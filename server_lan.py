#!/usr/bin/env python3
import http.server
import socketserver
import subprocess
import os
from urllib.parse import urlparse, parse_qs
import json

class PHPHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.handle_request()
    
    def do_POST(self):
        self.handle_request()
    
    def do_PUT(self):
        self.handle_request()
    
    def do_DELETE(self):
        self.handle_request()
    
    def do_PATCH(self):
        self.handle_request()
    
    def do_OPTIONS(self):
        self.handle_request()
    
    def handle_request(self):
        url_parts = urlparse(self.path)
        path = url_parts.path
        
        # Manejo especial para rutas de API
        if path.startswith('/api/'):
            self.handle_api_route()
        # Archivos PHP directs
        elif path.endswith('.php') or ('?' in self.path and '.php' in self.path):
            self.handle_php()
        # Archivos estáticos
        else:
            super().do_GET()
    
    def handle_api_route(self):
        """Maneja rutas de API usando el router PHP"""
        try:
            # Las rutas /api/* van al router principal
            php_router = 'api/index.php'
            
            if not os.path.exists(php_router):
                self.send_error(404, "API Router not found")
                return
            
            # Preparar variables de entorno
            env = os.environ.copy()
            env['REQUEST_METHOD'] = self.command
            env['REQUEST_URI'] = self.path
            env['QUERY_STRING'] = urlparse(self.path).query or ''
            env['HTTP_HOST'] = self.headers.get('Host', '')
            env['CONTENT_TYPE'] = self.headers.get('Content-Type', '')
            
            # Para métodos con contenido (POST, PUT, PATCH), leer el contenido
            post_data = b''
            if self.command in ['POST', 'PUT', 'PATCH']:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    env['CONTENT_LENGTH'] = str(content_length)
            
            # Ejecutar el router PHP
            result = subprocess.run(
                ['php', php_router],
                input=post_data,
                capture_output=True,
                env=env
            )
            
            # Enviar respuesta
            if result.returncode == 0:
                self.send_response(200)
                # Detectar tipo de contenido
                if result.stdout.startswith(b'{') or result.stdout.startswith(b'['):
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                else:
                    self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                self.wfile.write(result.stdout)
            else:
                self.send_error(500, f"PHP Error: {result.stderr.decode()}")
                
        except Exception as e:
            self.send_error(500, f"Server Error: {str(e)}")
    
    def handle_php(self):
        """Maneja archivos PHP individuales"""
        try:
            url_parts = urlparse(self.path)
            php_file = url_parts.path[1:]  # Remover /
            
            if not os.path.exists(php_file):
                self.send_error(404, "File not found")
                return
            
            # Variables de entorno más completas
            env = os.environ.copy()
            env['REQUEST_METHOD'] = self.command
            env['REQUEST_URI'] = self.path
            env['QUERY_STRING'] = url_parts.query or ''
            env['HTTP_HOST'] = self.headers.get('Host', '')
            env['CONTENT_TYPE'] = self.headers.get('Content-Type', '')
            env['SCRIPT_NAME'] = '/' + php_file
            env['PATH_INFO'] = ''
            
            # Variables adicionales de CGI
            env['SERVER_SOFTWARE'] = 'PythonServer/1.0'
            env['SERVER_NAME'] = env['HTTP_HOST'].split(':')[0] if ':' in env['HTTP_HOST'] else env['HTTP_HOST']
            env['SERVER_PORT'] = env['HTTP_HOST'].split(':')[1] if ':' in env['HTTP_HOST'] else '8089'
            env['REQUEST_SCHEME'] = 'http'
            env['DOCUMENT_ROOT'] = os.getcwd()
            env['SCRIPT_FILENAME'] = os.path.abspath(php_file)
            env['REDIRECT_STATUS'] = '200'
            
            # Headers HTTP como variables de entorno
            for header, value in self.headers.items():
                header_name = 'HTTP_' + header.upper().replace('-', '_')
                env[header_name] = value
            
            # POST data
            post_data = b''
            if self.command == 'POST':
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    post_data = self.rfile.read(content_length)
                    env['CONTENT_LENGTH'] = str(content_length)
            
            # Debug para login-handler.php
            if php_file == 'login-handler.php':
                print(f"🔍 Debug login: POST data = {post_data}")
                print(f"🔍 Debug login: Content-Type = {env.get('CONTENT_TYPE', 'None')}")
            
            # Ejecutar PHP con CGI
            cmd = ['php-cgi', '-f', php_file]
            result = subprocess.run(
                cmd,
                input=post_data,
                capture_output=True,
                env=env,
                cwd=os.getcwd()
            )
            
            # Respuesta CGI
            if result.returncode == 0:
                # Parsear la respuesta CGI (headers + body)
                output = result.stdout
                if b'\r\n\r\n' in output:
                    headers_part, body_part = output.split(b'\r\n\r\n', 1)
                elif b'\n\n' in output:
                    headers_part, body_part = output.split(b'\n\n', 1)
                else:
                    # Sin headers separados, asumir que es solo el body
                    headers_part = b''
                    body_part = output
                
                self.send_response(200)
                
                # Parsear headers CGI
                content_type = 'text/html; charset=utf-8'
                for line in headers_part.decode().split('\n'):
                    if line.strip() and ':' in line:
                        key, value = line.split(':', 1)
                        if key.strip().lower() == 'content-type':
                            content_type = value.strip()
                        else:
                            self.send_header(key.strip(), value.strip())
                
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(body_part)
            else:
                self.send_error(500, f"PHP Error: {result.stderr.decode()}")
                
        except Exception as e:
            self.send_error(500, f"Server Error: {str(e)}")

if __name__ == "__main__":
    PORT = 8089
    with socketserver.TCPServer(("0.0.0.0", PORT), PHPHandler) as httpd:
        print(f"🚀 Servidor híbrido iniciado en http://0.0.0.0:{PORT}")
        print(f"📡 Accesible desde LAN: http://192.168.127.139:{PORT}")
        print(f"🔧 Soporta PHP + archivos estáticos + API routes")
        httpd.serve_forever()
