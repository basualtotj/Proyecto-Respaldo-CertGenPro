#!/bin/bash

# 🚀 COMMIT SÚPER RÁPIDO - Una línea, todo automático

# Mensaje por defecto o personalizado
MSG="${1:-"🔄 Auto-update: $(date '+%H:%M %d/%m/%Y')"}"

# Todo en una secuencia
echo "🚀 Commit rápido: $MSG"
git add . && \
git commit -m "$MSG" && \
git push && \
echo "✅ Listo! $(git log -1 --format='%h - %s')" || \
echo "❌ Error en el commit"
