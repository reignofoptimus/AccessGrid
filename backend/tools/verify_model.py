"""Verify ONNX against PyTorch raw predictions using deterministic inputs."""
import hashlib
import json
from pathlib import Path
import numpy as np
import torch
import onnxruntime as ort
from ultralytics import YOLO

root=Path(__file__).resolve().parents[1]/'app/anpr'
model=YOLO(str(root/'best.pt')).model.float().eval()
session=ort.InferenceSession(str(root/'best.onnx'),providers=['CPUExecutionProvider'])
rng=np.random.default_rng(47)
errors=[]
with torch.inference_mode():
    for image in [np.zeros((1,3,640,640),dtype=np.float32),rng.random((1,3,640,640),dtype=np.float32)]:
        expected=model(torch.from_numpy(image))[0].numpy()
        actual=session.run(None,{session.get_inputs()[0].name:image})[0]
        np.testing.assert_allclose(actual,expected,rtol=1e-3,atol=2e-3)
        errors.append(float(np.max(np.abs(actual-expected))))
metadata={'source_sha256':hashlib.sha256((root/'best.pt').read_bytes()).hexdigest(),'onnx_sha256':hashlib.sha256((root/'best.onnx').read_bytes()).hexdigest(),'input':[1,3,640,640],'output':session.get_outputs()[0].shape,'opset':17,'raw_prediction_max_absolute_errors':errors,'verification':'Zero and deterministic random tensors; no real-image accuracy claim.'}
(root/'model-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
print(json.dumps(metadata))
