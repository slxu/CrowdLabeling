#! /usr/bin/env python

import SimpleHTTPServer
import SocketServer

PORT = 11888

Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

httpd = SocketServer.TCPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
