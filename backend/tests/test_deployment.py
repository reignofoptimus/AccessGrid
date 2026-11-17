import os
import secrets
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import numpy as np
from flask import Flask
from app import create_app,db
from app.models import User,ParkingZone
from app.bootstrap import provision
from app.security import throttle
from app.anpr import detector
from werkzeug.exceptions import TooManyRequests


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        class Config:
            TESTING=True
            SECRET_KEY=secrets.token_hex(32)
            SQLALCHEMY_DATABASE_URI='sqlite:///'+str(Path(self.temp.name)/'test.db')
            SQLALCHEMY_TRACK_MODIFICATIONS=False
        self.config=Config
        self.app=create_app(Config)
        self.context=self.app.app_context();self.context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove();db.engine.dispose();self.context.pop();self.temp.cleanup()

    def test_bootstrap_is_idempotent_and_preserves_existing_data(self):
        with patch.dict(os.environ,{'BOOTSTRAP_ADMIN_USERNAME':'test-owner','BOOTSTRAP_ADMIN_PASSWORD':secrets.token_urlsafe(24)}):
            provision()
            zone=db.session.get(ParkingZone,'A');zone.occupied_count=5;db.session.commit()
            provision()
        self.assertEqual(User.query.count(),1)
        self.assertEqual(ParkingZone.query.count(),4)
        self.assertEqual(db.session.get(ParkingZone,'A').occupied_count,5)

    def test_bootstrap_requires_private_credentials_on_empty_database(self):
        with patch.dict(os.environ,{'BOOTSTRAP_ADMIN_USERNAME':'','BOOTSTRAP_ADMIN_PASSWORD':''}):
            with self.assertRaises(RuntimeError):provision()

    def test_counter_survives_new_app_instance(self):
        throttle('persistent',1,60)
        other=create_app(self.config)
        with other.app_context():
            with self.assertRaises(TooManyRequests):throttle('persistent',1,60)
            db.session.remove();db.engine.dispose()

    def test_postgres_url_uses_installed_driver(self):
        from config import normalize_database_url
        from sqlalchemy import create_engine
        for value in ['postgres://unused@localhost/example','postgresql://unused@localhost/example']:
            engine=create_engine(normalize_database_url(value))
            self.assertEqual(engine.dialect.driver,'psycopg2')
            engine.dispose()

    def test_health_does_not_require_login(self):
        response=self.app.test_client().get('/healthz')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.json,{'status':'ok'})


class DetectorTests(unittest.TestCase):
    def test_letterbox_shape_and_offsets(self):
        tensor,ratio,left,top=detector.letterbox(np.zeros((100,200,3),dtype=np.uint8))
        self.assertEqual(tensor.shape,(1,3,640,640))
        self.assertEqual(tensor.dtype,np.float32)
        self.assertEqual((ratio,left,top),(3.2,0,160))

    def test_nms_and_coordinates(self):
        predictions=np.array([[[320,321,20],[320,320,20],[200,200,10],[80,80,10],[.9,.8,.1]]],dtype=np.float32)
        boxes=detector.decode_boxes(predictions,2,0,160,320,160)
        self.assertEqual(len(boxes),1)
        self.assertTrue(100<=boxes[0][0]<=110)
        self.assertTrue(50<=boxes[0][1]<=60)

    def test_empty_predictions(self):
        self.assertEqual(detector.decode_boxes(np.zeros((1,5,8400)),1,0,0,640,640),[])

    def test_crop_is_bounded_and_ocr_has_deadline(self):
        with patch.object(detector.pytesseract,'image_to_string',return_value='KI 07 I 1234') as ocr:
            self.assertEqual(detector.ocr_plate(np.zeros((1000,3000,3),dtype=np.uint8)),'KI07I1234')
        self.assertLessEqual(ocr.call_args.args[0].shape[0],256)
        self.assertLessEqual(ocr.call_args.args[0].shape[1],960)
        self.assertEqual(ocr.call_args.kwargs['timeout'],5)

    def test_ocr_corrects_only_numeric_positions(self):
        with patch.object(detector.pytesseract,'image_to_string',return_value='KLO7ABI234'):
            self.assertEqual(detector.ocr_plate(np.zeros((40,160,3),dtype=np.uint8)),'KL07AB1234')

    def test_ocr_timeout_is_explicit(self):
        with patch.object(detector.pytesseract,'image_to_string',side_effect=RuntimeError('timeout')):
            with self.assertRaises(detector.RecognitionTimeout):detector.ocr_plate(np.zeros((40,160,3),dtype=np.uint8))

    def test_model_missing_is_explicit(self):
        with patch.object(detector,'_session',None),patch.dict(os.environ,{'ANPR_MODEL_PATH':'missing-test-model.onnx'}):
            with self.assertRaises(detector.RecognitionUnavailable):detector.get_session()

if __name__=='__main__':unittest.main()
