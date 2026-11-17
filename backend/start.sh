#!/bin/sh
set -eu
python deploy_init.py
exec gunicorn run:app --config gunicorn.conf.py
