from flask import jsonify, request, Blueprint
from app import db
from app.models import Vehicle, User
from flask_login import current_user
from flask import abort
from app.security import json_object, text, plate_value, find_vehicle

bp = Blueprint('vehicles', __name__)

@bp.route('/', methods=['GET'])
def get_vehicles():
    vehicles = (Vehicle.query.filter_by(owner_id=current_user.id) if current_user.role == 'student' else Vehicle.query).all()
    return jsonify([v.to_dict() for v in vehicles])

@bp.route('/', methods=['POST'])
def add_vehicle():
    data = json_object()
    plate=plate_value(data)
    owner=text(data,'owner',64)
    category=text(data,'type',20)
    if category not in {'Staff','Student','Visitor','HOD','Principal'}:
        abort(400,description='Invalid vehicle category')
    owner_id=data.get('ownerId')
    if owner_id is not None and (type(owner_id) is not int or not db.session.get(User,owner_id)):
        abort(400,description='Invalid owner ID')
    if find_vehicle(plate):
        abort(409,description='Plate number already registered')
    vehicle=Vehicle(plate_number=plate,type=category,owner_name=owner,owner_id=owner_id,department=text(data,'department',64,False),status='active')
    db.session.add(vehicle)
    db.session.commit()
    return jsonify(vehicle.to_dict()),201
