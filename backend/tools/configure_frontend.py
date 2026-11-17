"""Configure Vercel's API proxy without changing the interface."""
import argparse
from urllib.parse import urlparse

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--backend-url',required=True)
    args=parser.parse_args()
    url=args.backend_url.rstrip('/')
    parsed=urlparse(url)
    if parsed.scheme!='https' or not parsed.hostname or parsed.username or parsed.password or parsed.path not in {'','/'} or parsed.query or parsed.fragment:
        parser.error('Provide only the HTTPS origin of your Render service')
    print('Set this deployment environment variable in Vercel:')
    print('BACKEND_ORIGIN='+url)
    print('frontend/vercel.ts configures the API proxy. Leave VITE_API_URL unset.')
