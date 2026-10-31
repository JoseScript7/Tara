from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class MockOllama(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            "choices": [{
                "message": {
                    "content": "",
                    "tool_calls": [{
                        "id": "call_123",
                        "type": "function",
                        "function": {
                            "name": "draft_compensation_credit",
                            "arguments": '{"amount": 100}'
                        }
                    }]
                }
            }]
        }).encode())

HTTPServer(('', 11434), MockOllama).serve_forever()
