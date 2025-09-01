#!/bin/bash
# Script para iniciar el backend PHP en el puerto 8084
cd "$(dirname "$0")/api"
php -S 127.0.0.1:8084
