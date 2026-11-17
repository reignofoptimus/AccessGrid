"""CPU ONNX inference: training dependencies are excluded from the serving image."""
import os
import re
import shutil
from pathlib import Path
from threading import Lock
import cv2
import numpy as np
import pytesseract

cv2.setNumThreads(1)
_session = None
_load_lock = Lock()

class RecognitionUnavailable(RuntimeError):
    pass

class RecognitionTimeout(RuntimeError):
    pass

def get_session():
    global _session
    with _load_lock:
        if _session is None:
            path = Path(os.environ.get('ANPR_MODEL_PATH', str(Path(__file__).with_name('best.onnx'))))
            if not path.is_file():
                raise RecognitionUnavailable('ANPR model is missing')
            if not shutil.which('tesseract'):
                raise RecognitionUnavailable('Tesseract is not installed')
            try:
                import onnxruntime as ort
                options = ort.SessionOptions()
                options.intra_op_num_threads = 1
                options.inter_op_num_threads = 1
                options.enable_cpu_mem_arena = False
                options.enable_mem_pattern = False
                options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
                session = ort.InferenceSession(str(path), sess_options=options, providers=['CPUExecutionProvider'])
                if session.get_inputs()[0].shape != [1, 3, 640, 640]:
                    raise ValueError('Expected fixed 640px detector input')
                session.run(None, {session.get_inputs()[0].name: np.zeros((1, 3, 640, 640), dtype=np.float32)})
                _session = session
            except Exception as error:
                raise RecognitionUnavailable('ANPR model could not be initialized') from error
    return _session

def letterbox(image):
    height, width = image.shape[:2]
    ratio = min(640 / width, 640 / height)
    resized = cv2.resize(image, (round(width * ratio), round(height * ratio)))
    left = (640 - resized.shape[1]) // 2
    top = (640 - resized.shape[0]) // 2
    canvas = np.full((640, 640, 3), 114, dtype=np.uint8)
    canvas[top:top + resized.shape[0], left:left + resized.shape[1]] = resized
    tensor = np.ascontiguousarray(canvas.transpose(2, 0, 1)[None], dtype=np.float32) / 255.0
    return tensor, ratio, left, top

def decode_boxes(output, ratio, left, top, width, height):
    # YOLOv8 single-class raw export: cx, cy, width, height, class confidence.
    predictions = np.asarray(output)[0]
    if predictions.ndim != 2 or predictions.shape[0] != 5:
        raise RecognitionUnavailable('Unsupported detector output')
    rows = predictions.T
    rows = rows[np.isfinite(rows).all(axis=1) & (rows[:, 4] >= 0.35)]
    rows = rows[np.argsort(-rows[:, 4])[:100]]
    boxes, scores = [], []
    for cx, cy, w, h, score in rows:
        if w > 0 and h > 0:
            boxes.append([float((cx-w/2-left)/ratio), float((cy-h/2-top)/ratio), float(w/ratio), float(h/ratio)])
            scores.append(float(score))
    if not boxes:
        return []
    selected = np.asarray(cv2.dnn.NMSBoxes(boxes, scores, 0.35, 0.45)).flatten()
    result = []
    for index in selected:
        x, y, w, h = boxes[int(index)]
        pad = max(2, min(12, h * 0.1))
        box = (max(0, int(x-pad)), max(0, int(y-pad)), min(width, int(x+w+pad)), min(height, int(y+h+pad)))
        if box[2] > box[0] and box[3] > box[1]:
            result.append(box)
    return result

def ocr_plate(crop):
    gray = cv2.cvtColor(crop, cv2.COLOR_RGB2GRAY)
    h, w = gray.shape
    scale = min(4.0, 960 / w, 256 / h)
    gray = cv2.resize(gray, (max(1, round(w*scale)), max(1, round(h*scale))), interpolation=cv2.INTER_CUBIC)
    gray = cv2.bilateralFilter(gray, 7, 17, 17)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    try:
        value = pytesseract.image_to_string(binary, lang='eng', config='--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', timeout=5)
    except pytesseract.TesseractNotFoundError as error:
        raise RecognitionUnavailable('Tesseract is not installed') from error
    except RuntimeError as error:
        raise RecognitionTimeout('Plate reading timed out; try a smaller, clearer image') from error
    plate = re.sub(r'[^A-Z0-9]', '', value.upper())
    # Correct common letter/digit OCR confusions only in the numeric positions
    # of a recognized Indian registration layout; never alter series/state letters.
    match=re.fullmatch(r'([A-Z]{2})([0-9OIZSB]{2})([A-Z]{1,3})([0-9OIZSB]{4})',plate)
    if match:
        digits=str.maketrans({'O':'0','I':'1','Z':'2','S':'5','B':'8'})
        state,district,series,number=match.groups()
        plate=state+district.translate(digits)+series+number.translate(digits)
    return plate if re.fullmatch(r'[A-Z0-9]{6,15}', plate) else None

def detect_plate(image):
    session = get_session()
    image = image.convert('RGB')
    image.thumbnail((1600, 1600))
    pixels = np.asarray(image)
    tensor, ratio, left, top = letterbox(pixels)
    output = session.run(None, {session.get_inputs()[0].name: tensor})[0]
    boxes = decode_boxes(output, ratio, left, top, image.width, image.height)
    if not boxes:
        return None
    x1, y1, x2, y2 = boxes[0]
    return ocr_plate(pixels[y1:y2, x1:x2])
