"""Local Windows peak-memory probe; no OCR accuracy or Linux memory guarantee."""
import ctypes
import json
import sys
from pathlib import Path
from unittest.mock import patch
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from app import create_app
from app.anpr import detector
app=create_app()
class Counters(ctypes.Structure):
    _fields_=[('cb',ctypes.c_ulong),('PageFaultCount',ctypes.c_ulong),('PeakWorkingSetSize',ctypes.c_size_t),('WorkingSetSize',ctypes.c_size_t),('QuotaPeakPagedPoolUsage',ctypes.c_size_t),('QuotaPagedPoolUsage',ctypes.c_size_t),('QuotaPeakNonPagedPoolUsage',ctypes.c_size_t),('QuotaNonPagedPoolUsage',ctypes.c_size_t),('PagefileUsage',ctypes.c_size_t),('PeakPagefileUsage',ctypes.c_size_t)]
# Tesseract is installed by Docker; only bypass its availability probe on this host.
with patch.object(detector.shutil,'which',return_value=sys.executable):
    for size in [(640,360),(3000,2000),(4000,3000)]:
        assert detector.detect_plate(Image.new('RGB',size,'white')) is None
counters=Counters();counters.cb=ctypes.sizeof(counters)
ctypes.windll.kernel32.GetCurrentProcess.restype=ctypes.c_void_p
ctypes.windll.psapi.GetProcessMemoryInfo.argtypes=[ctypes.c_void_p,ctypes.POINTER(Counters),ctypes.c_ulong]
if not ctypes.windll.psapi.GetProcessMemoryInfo(ctypes.windll.kernel32.GetCurrentProcess(),ctypes.byref(counters),counters.cb):
    raise ctypes.WinError()
print(json.dumps({'platform':'Windows','peak_working_set_mib':round(counters.PeakWorkingSetSize/1048576,1),'current_working_set_mib':round(counters.WorkingSetSize/1048576,1),'includes':'Flask imports, ONNX warmup and blank-image inference up to 12MP','excludes':'Tesseract subprocess and PostgreSQL connection pool'}))
