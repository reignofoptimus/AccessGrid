"""Run in a separate CPU PyTorch/Ultralytics environment, never on Render startup."""
from pathlib import Path
from ultralytics import YOLO

if __name__=='__main__':
    model=YOLO(str(Path(__file__).resolve().parents[1]/'app/anpr/best.pt'))
    model.export(format='onnx',imgsz=640,opset=17,dynamic=False,simplify=False,nms=False,device='cpu')
