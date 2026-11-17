import os

bind='0.0.0.0:'+os.environ.get('PORT','10000')
workers=1
threads=2
worker_class='gthread'
timeout=120
graceful_timeout=30
keepalive=5
accesslog='-'
errorlog='-'
max_requests=0
# Do not trust arbitrary forwarded client-address headers.
forwarded_allow_ips=''

def post_worker_init(worker):
    from app.anpr.detector import get_session
    get_session()
