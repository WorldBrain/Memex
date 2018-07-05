# python -m SimpleHTTPPutServer 8080
import os
from os import path
import http.server

class SputHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_PUT(self):
        length = int(self.headers["Content-Length"])
        filepath = self.translate_path(self.path)
        dirpath = path.dirname(filepath)
        os.makedirs(dirpath, exist_ok=True)
        with open(filepath, "wb") as dst:
            dst.write(self.rfile.read(length))
        self.send_response(200, 'OK')
        self.end_headers()


def run(server_class=http.server.HTTPServer, handler_class=http.server.BaseHTTPRequestHandler):
    server_address = ('', 8000)
    httpd = server_class(server_address, handler_class)
    httpd.serve_forever()

if __name__ == '__main__':
    run(handler_class=SputHTTPRequestHandler)
