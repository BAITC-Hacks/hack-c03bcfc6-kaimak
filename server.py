"""Dependency-free HTTP server for the Astana city simulator."""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from ai import analyze_with_providers
from data import ACTIONS, BUDGET, CATEGORIES, DISTRICTS, INDICATORS, HORIZON, SYNERGIES, CONFLICTS, PRESETS, DATASET_VERSION
from engine import simulate, validate_choices

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
MAX_BODY = 16_384


class Handler(BaseHTTPRequestHandler):
    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        route = self.path.split("?", 1)[0]
        if route == "/api/bootstrap":
            baseline = simulate([])
            self._json(200, {"budget": BUDGET, "categories": CATEGORIES, "districts": DISTRICTS, "actions": ACTIONS, "indicators": INDICATORS, "horizon": HORIZON, "synergies": SYNERGIES, "conflicts": CONFLICTS, "presets": PRESETS, "version": DATASET_VERSION, "baseline": baseline})
            return
        files = {"/": "index.html", "/app.js": "app.js", "/style.css": "style.css"}
        if route not in files:
            self.send_error(404)
            return
        path = STATIC / files[route]
        content_type = {".html": "text/html; charset=utf-8", ".js": "application/javascript; charset=utf-8", ".css": "text/css; charset=utf-8"}[path.suffix]
        body = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        route = self.path.split("?", 1)[0]
        if route not in ("/api/simulate", "/api/analyze"):
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > MAX_BODY:
                raise ValueError("Неверный размер запроса.")
            request = json.loads(self.rfile.read(length))
            if not isinstance(request, dict) or set(request) != {"choices"}:
                raise ValueError("Ожидается список решений choices.")
            choices = validate_choices(request["choices"], complete=route == "/api/analyze")
            result = simulate(choices, with_recommendation=True)
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self._json(400, {"error": str(error)})
            return
        if route == "/api/analyze":
            result["providers"] = analyze_with_providers(choices, result)
        self._json(200, result)


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"Astana simulator: http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped")
    finally:
        server.server_close()
