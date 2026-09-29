"""Entrée WSGI pour Passenger sur N0C (l'application reste ASGI ailleurs)."""

from a2wsgi import ASGIMiddleware

from app.main import app

application = ASGIMiddleware(app)
