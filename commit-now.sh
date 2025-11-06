#!/bin/bash
# COMMIT DIRECTO - Sin preguntas, sin confirmaciones
git add . && git commit -m "🔄 Auto-backup: $(date '+%Y-%m-%d %H:%M')" && git push && echo "✅ Commit realizado"
