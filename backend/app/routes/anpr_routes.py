from flask import Blueprint,jsonify,current_app
from app.uploads import read_image
anpr_bp=Blueprint('anpr',__name__)

@anpr_bp.post('/')
def detect_plate_api():
    image=read_image()
    detector=current_app.config.get('PLATE_DETECTOR')
    if detector is None:
        from app.anpr.detector import detect_plate
        import numpy as np
        detector=lambda img: detect_plate(np.asarray(img)[:,:,::-1].copy())
    return jsonify(plate=detector(image))
