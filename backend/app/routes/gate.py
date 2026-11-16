from flask import Blueprint,jsonify,request,abort
from flask_login import current_user
from sqlalchemy.orm import joinedload
from app import db
from app.models import Vehicle,EntryLog
from app.security import json_object,text,plate_value,find_vehicle
from app.uploads import read_image

bp=Blueprint('gate',__name__)

@bp.post('/scan')
def scan_vehicle():
    from app.routes.anpr_routes import detect_plate_api
    return detect_plate_api()


def movement(action):
    data=json_object()
    plate=plate_value(data)
    gate=data.get('gate','Main Gate')
    if gate not in {'Main Gate','North Gate'}:
        abort(400,description='Invalid gate')
    if 'manual' in data and type(data['manual']) is not bool:
        abort(400,description='Invalid manual flag')
    vehicle=find_vehicle(plate)
    if vehicle is None:
        if action=='exit':
            abort(404,description='Vehicle not found')
        vehicle=Vehicle(plate_number=plate,type='Visitor',owner_name=text(data,'owner',64),status='active',is_inside=False)
        db.session.add(vehicle)
        db.session.flush()
    if vehicle.status!='active':
        abort(403,description='Registration inactive')
    inside=action=='entry'
    # Conditional UPDATE makes concurrent/replayed movements conflict rather than duplicate logs.
    changed=Vehicle.query.filter_by(id=vehicle.id,is_inside=not inside,status='active').update({'is_inside':inside},synchronize_session=False)
    if changed!=1:
        db.session.rollback()
        abort(409,description='Vehicle is already in that state')
    log=EntryLog(vehicle_id=vehicle.id,action=action,gate_name=gate,manual_entry=True)
    db.session.add(log)
    db.session.commit()
    return jsonify(message='Movement recorded',log=log.to_dict())

@bp.post('/entry')
def vehicle_entry():
    return movement('entry')

@bp.post('/exit')
def vehicle_exit():
    return movement('exit')

@bp.get('/logs')
def get_logs():
    try:
        limit=int(request.args.get('limit',50))
        vehicle_id=int(request.args['vehicle_id']) if 'vehicle_id' in request.args else None
        if not 1<=limit<=1000 or (vehicle_id is not None and vehicle_id<=0):
            raise ValueError()
    except (ValueError,TypeError):
        abort(400,description='Invalid pagination or vehicle ID')
    query=EntryLog.query.options(joinedload(EntryLog.vehicle)).order_by(EntryLog.timestamp.desc())
    if current_user.role=='student':
        if vehicle_id is not None:
            vehicle=db.session.get(Vehicle,vehicle_id)
            if vehicle is None or vehicle.owner_id!=current_user.id:
                abort(404,description='Vehicle not found')
        query=query.join(Vehicle).filter(Vehicle.owner_id==current_user.id)
    if vehicle_id is not None:
        query=query.filter(EntryLog.vehicle_id==vehicle_id)
    return jsonify([log.to_dict() for log in query.limit(limit).all()])
