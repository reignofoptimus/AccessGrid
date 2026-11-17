from flask import Blueprint,jsonify,current_app
from threading import BoundedSemaphore
from app.uploads import read_image

anpr_bp=Blueprint('anpr',__name__)
_scan_slot=BoundedSemaphore(1)

@anpr_bp.post('/')
def detect_plate_api():
    if not _scan_slot.acquire(blocking=False):
        return jsonify(error='Recognition is busy. Try again shortly.'),429,{'Retry-After':'5'}
    try:
        from app.anpr.detector import detect_plate,RecognitionUnavailable,RecognitionTimeout
        image=read_image()
        detector=current_app.config.get('PLATE_DETECTOR') or detect_plate
        try:
            plate=detector(image)
        except RecognitionUnavailable:
            current_app.logger.exception('Recognition unavailable')
            return jsonify(error='Plate recognition is temporarily unavailable.'),503
        except RecognitionTimeout as error:
            return jsonify(error=str(error)),504
        finally:
            image.close()
        return jsonify(plate=plate)
    finally:
        _scan_slot.release()
