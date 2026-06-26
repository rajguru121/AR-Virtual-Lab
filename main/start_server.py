#!/usr/bin/env python3
"""
VirtuLab Local Server
Double-click this file (or run: python start_server.py) to start the server.
Then open http://localhost:8080 in your browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import threading
import time

PORT = 8080

# Fix MIME types for Unity WebGL
class UnityHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        base, ext = os.path.splitext(path)
        ext = ext.lower()
        mime_map = {
            '.wasm':        'application/wasm',
            '.data':        'application/octet-stream',
            '.br':          'application/octet-stream',
            '.gz':          'application/octet-stream',
            '.js':          'application/javascript',
            '.unityweb':    'application/octet-stream',
            '.html':        'text/html',
            '.css':         'text/css',
            '.json':        'application/json',
            '.png':         'image/png',
            '.jpg':         'image/jpeg',
            '.svg':         'image/svg+xml',
        }
        return mime_map.get(ext, super().guess_type(path))

    def end_headers(self):
        # Required for Unity Brotli/Gzip compressed builds
        path = self.path.lower().split('?')[0]
        if path.endswith('.br'):
            self.send_header('Content-Encoding', 'br')
        elif path.endswith('.gz'):
            self.send_header('Content-Encoding', 'gzip')
        # Allow camera/AR access in iframes
        self.send_header('Cross-Origin-Opener-Policy',   'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        super().end_headers()

    def log_message(self, format, *args):
        # Quiet mode — only print errors
        if args[1] not in ('200', '304', '206'):
            print(f"  [{args[1]}] {args[0]}")

def open_browser():
    time.sleep(1.2)
    webbrowser.open(f'http://localhost:{PORT}')

if __name__ == '__main__':
    # Change to the directory this script is in
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    try:
        with socketserver.TCPServer(('', PORT), UnityHandler) as httpd:
            httpd.allow_reuse_address = True

            print()
            print('  ╔══════════════════════════════════════╗')
            print('  ║       VirtuLab Local Server          ║')
            print('  ╠══════════════════════════════════════╣')
            print(f'  ║   Running at: http://localhost:{PORT}   ║')
            print('  ║   Opening browser automatically...  ║')
            print('  ║                                      ║')
            print('  ║   Press CTRL+C to stop the server   ║')
            print('  ╚══════════════════════════════════════╝')
            print()

            # Open browser in background thread
            threading.Thread(target=open_browser, daemon=True).start()

            httpd.serve_forever()

    except OSError as e:
        if 'Address already in use' in str(e):
            print(f'\n  Port {PORT} is already in use.')
            print(f'  Try opening: http://localhost:{PORT}')
            print(f'  (A server may already be running)\n')
            webbrowser.open(f'http://localhost:{PORT}')
            input('  Press Enter to exit...')
        else:
            raise
    except KeyboardInterrupt:
        print('\n\n  Server stopped. Goodbye!\n')
