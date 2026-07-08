#!/usr/bin/env python3
"""Petit serveur local pour l'app "Mon Salaire".
Lance un serveur sur http://localhost:8000 et ouvre le navigateur automatiquement.
"""
import http.server
import socketserver
import webbrowser
import os
import threading

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

def open_browser():
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serveur démarré : http://localhost:{PORT}")
        print("Laisse cette fenêtre ouverte. Ferme-la (Ctrl+C) pour arrêter le serveur.")
        threading.Timer(0.8, open_browser).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServeur arrêté.")
