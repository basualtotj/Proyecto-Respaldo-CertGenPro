#!/bin/bash

# 🚀 SCRIPT DE COMMIT AUTOMÁTICO - CertGen Pro
# Hace verificación, staging, commit y push en una sola ejecución

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging con colores
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "🚀 =================================="
echo "   AUTO-COMMIT CertGen Pro"
echo "   $(date '+%Y-%m-%d %H:%M:%S')"
echo "==================================${NC}"
echo ""

# 1. Verificar que estamos en un repositorio git
log_info "Verificando repositorio Git..."
if [ ! -d ".git" ]; then
    log_error "No es un repositorio Git"
    exit 1
fi
log_success "Repositorio Git detectado"

# 2. Verificar branch actual
CURRENT_BRANCH=$(git branch --show-current)
log_info "Branch actual: $CURRENT_BRANCH"

# 3. Verificar estado del repositorio
log_info "Verificando estado del repositorio..."
git status --porcelain > /tmp/git_status.txt

if [ ! -s /tmp/git_status.txt ]; then
    log_warning "No hay cambios para commitear"
    echo ""
    log_info "Estado actual:"
    git status
    exit 0
fi

# 4. Mostrar cambios
log_info "Cambios detectados:"
echo ""
git status --short
echo ""

# 5. Mensaje de commit (puede ser pasado como parámetro)
if [ -z "$1" ]; then
    COMMIT_MSG="Auto-commit: $(date '+%Y-%m-%d %H:%M:%S') - Desarrollo CertGen Pro"
    log_warning "Usando mensaje automático: $COMMIT_MSG"
else
    COMMIT_MSG="$1"
    log_info "Mensaje personalizado: $COMMIT_MSG"
fi

echo ""

# 6. Staging de todos los archivos
log_info "Agregando archivos al staging..."
git add .
log_success "Archivos agregados al staging"

# 7. Verificar qué se va a commitear
log_info "Archivos que se van a commitear:"
git diff --cached --name-only | while read file; do
    echo "  📄 $file"
done
echo ""

# 8. Hacer commit
log_info "Realizando commit..."
git commit -m "$COMMIT_MSG"
log_success "Commit realizado exitosamente"

# 9. Verificar remote
log_info "Verificando remote..."
REMOTE=$(git remote -v | grep push | awk '{print $1}' | head -n1)
if [ -z "$REMOTE" ]; then
    log_warning "No hay remote configurado, solo commit local"
    log_success "Proceso completado (solo local)"
    exit 0
fi

log_info "Remote detectado: $REMOTE"

# 10. Push automático
log_info "Haciendo push a $REMOTE/$CURRENT_BRANCH..."
if git push $REMOTE $CURRENT_BRANCH; then
    log_success "Push completado exitosamente"
else
    log_error "Error en push, pero commit local realizado"
    exit 1
fi

# 11. Resumen final
echo ""
echo -e "${GREEN}🎉 =================================="
echo "   COMMIT COMPLETADO EXITOSAMENTE"
echo "==================================${NC}"
echo ""
log_success "Branch: $CURRENT_BRANCH"
log_success "Commit: $(git log -1 --format='%h - %s')"
log_success "Remote: Sincronizado"
echo ""
log_info "Para ver el historial: git log --oneline -10"

# Cleanup
rm -f /tmp/git_status.txt
