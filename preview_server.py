#!/usr/bin/env python3
"""
Universal preview server for lovii-site
Works both at root / and at subpath /lovii-site/ (GitHub Pages preview)
"""
import os
import pathlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote

ROOT = pathlib.Path(__file__).parent.resolve()  # /home/user/lovii-site
PARENT = ROOT.parent

class UniversalHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        # Strip query
        path = path.split('?', 1)[0].split('#', 1)[0]
        path = unquote(path)

        # Universal handling: if path starts with /lovii-site/, strip it
        if path.startswith('/lovii-site/'):
            path = path[len('/lovii-site'): ] or '/'
        elif path == '/lovii-site':
            path = '/'

        # Now resolve relative to ROOT
        # Use parent class logic but with ROOT as base
        # Re-implement simple translation
        path = path.lstrip('/')
        full = ROOT / path

        # If directory, serve index.html
        if full.is_dir():
            # Check for index.html
            idx = full / 'index.html'
            if idx.exists():
                return str(idx)
            return str(full)

        # If file doesn't exist, try adding .html or check if it's a directory without trailing slash
        if not full.exists():
            # Try with index.html for SPA-like routes
            # e.g., /business -> /business/index.html
            potential_dir = ROOT / path
            if potential_dir.is_dir():
                idx = potential_dir / 'index.html'
                if idx.exists():
                    return str(idx)
            # Try file as is
            # For 404, return 404.html but keep path for JS base detection
            # Let SimpleHTTPRequestHandler handle 404
            pass

        return str(full)

    def end_headers(self):
        # CORS and cache headers for preview
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # Handle root and subpath both
        parsed_path = self.path.split('?',1)[0]

        # If requesting directory without trailing slash, redirect to with slash for relative paths to work
        # e.g., /business -> /business/
        # This is crucial for ../assets/ to resolve correctly
        if parsed_path not in ('/', '/lovii-site', '/lovii-site/'):
            # Strip prefix for check
            check_path = parsed_path
            if check_path.startswith('/lovii-site/'):
                check_path = check_path[len('/lovii-site'):]
            check_path = check_path.lstrip('/')
            full = ROOT / check_path
            if full.is_dir() and not parsed_path.endswith('/'):
                # Redirect
                self.send_response(301)
                self.send_header('Location', parsed_path + '/' + ('?'+self.path.split('?',1)[1] if '?' in self.path else ''))
                self.end_headers()
                return

        return super().do_GET()

if __name__ == '__main__':
    port = 8000
    server = ThreadingHTTPServer(('0.0.0.0', port), UniversalHandler)
    print(f"Serving {ROOT} at http://0.0.0.0:{port}/")
    print(f"Universal: both / and /lovii-site/ work")
    print(f"Try: / , /business/ , /lovii-site/ , /lovii-site/business/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopping")
