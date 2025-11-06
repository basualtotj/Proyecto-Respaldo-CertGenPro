#!/bin/bash

# 🔧 ALIASES PARA GIT - CertGen Pro
# Agrega estos aliases a tu .zshrc o .bashrc para commits súper rápidos

echo "📝 Agregando aliases de Git..."

# Crear archivo de aliases temporal
cat << 'EOF' > /tmp/git_aliases.sh

# 🚀 ALIASES PARA COMMITS RÁPIDOS
alias gc='./c.sh'                           # Commit rápido
alias gcs='./c.sh "$(date +%H:%M) - cambios menores"'  # Commit con timestamp
alias gcp='./quick-commit.sh'               # Commit completo con verificaciones
alias gs='git status'                       # Status rápido
alias gl='git log --oneline -10'            # Log últimos 10 commits
alias gd='git diff'                         # Ver diferencias
alias gb='git branch'                       # Ver branches
alias gco='git checkout'                    # Cambiar branch

# 🔄 ALIASES PARA DESARROLLO
alias dev-save='./c.sh "💾 Guardado de desarrollo"'
alias dev-fix='./c.sh "🐛 Bug fix"'
alias dev-feat='./c.sh "✨ Nueva funcionalidad"'
alias dev-docs='./c.sh "📚 Actualización documentación"'

EOF

echo ""
echo "✅ Aliases creados en /tmp/git_aliases.sh"
echo ""
echo "🔧 Para activarlos PERMANENTEMENTE, agrega esto a tu ~/.zshrc:"
echo ""
cat /tmp/git_aliases.sh
echo ""
echo "📋 USO RÁPIDO:"
echo "  gc                    # Commit con mensaje automático"
echo "  gc 'mi mensaje'       # Commit con mensaje personalizado" 
echo "  gcp                   # Commit completo con verificaciones"
echo "  dev-save              # Commit de guardado"
echo "  gs                    # Git status"
echo "  gl                    # Ver últimos commits"
echo ""
echo "💡 PRUEBA AHORA: ./c.sh 'Primer commit automático'"
