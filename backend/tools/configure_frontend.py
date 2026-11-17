"""Configure Vercel's API proxy without changing the interface."""
import argparse
import json
from pathlib import Path
from urllib.parse import urlparse

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--backend-url',required=True)
    args=parser.parse_args()
    url=args.backend_url.rstrip('/')
    parsed=urlparse(url)
    if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password or parsed.path not in {'','/'} or parsed.query or parsed.fragment:
        parser.error('Provide only the HTTPS origin of your Render service')
    target=Path(__file__).resolve().parents[2]/'frontend/vercel.json'
    config=json.loads(target.read_text()) if target.exists() else {}
    existing=[rule for rule in config.get('rewrites',[]) if rule.get('source')!='/api/:path*']
    config['rewrites']=[{'source':'/api/:path*','destination':url+'/api/:path*'},*existing]
    target.write_text(json.dumps(config,indent=2)+'\n',encoding='utf-8')
    print('Configured frontend/vercel.json. Leave VITE_API_URL unset so requests use /api.')
