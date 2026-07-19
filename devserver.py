"""
Dev server for AWord — same as `python -m http.server` but sends
Cache-Control: no-store on every response.

WHY THIS EXISTS: during development, many sessions repeatedly edit
core/*.js or templates/<name>/*.js and reload the SAME browser tab to
test. Plain `python -m http.server` doesn't send cache headers, so
Chrome may reuse a stale cached copy of a .js file after an edit,
making a real fix look like it "didn't work". This server prevents
that entirely so every reload always gets the latest file from disk.

Usage:  python devserver.py [port]     (default port 5510)
"""
import os
import sys
import http.server

# Always serve THIS project folder, no matter what directory the process
# was launched from (the preview tool doesn't let us set a working directory
# for a raw script the way `--directory` does for `python -m http.server`).
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5510


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    http.server.test(HandlerClass=NoCacheHandler, port=PORT)
