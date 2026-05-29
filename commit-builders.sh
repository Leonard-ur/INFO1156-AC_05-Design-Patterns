#!/bin/bash
# Script para hacer commit del Entity Builder Pattern

# Navega al directorio del repositorio
cd "c:\Users\wladi\INFO1156-AC_05-Design-Patterns\INFO1156-AC_05-Design-Patterns.worktrees\agents-entity-builder-pattern-implementation" || exit 1

# Stage todos los cambios
echo "📦 Staging changes..."
git add -A

# Verifica qué será commiteado
echo -e "\n📊 Cambios a ser commiteados:"
git diff --cached --stat

# Hace el commit
echo -e "\n💾 Creating commit..."
git commit -m "feat: implement builder pattern for entity construction" -m "- Create PostEntityBuilder, CommentEntityBuilder, LikeEntityBuilder
- Auto-calculate derived fields (isFeatured, tags, sentimentScore, isPinned, strengthLabel)
- Replace direct constructors with fluent builders in posts controller
- Improve code readability and reduce parameter order errors
- All builders validate required fields before building

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

# Verifica el commit
echo -e "\n✅ Commit verification:"
echo -e "\nStatus:"
git status --short
echo -e "\nLast commit:"
git log --oneline -1

echo -e "\n✨ ¡Commit completado exitosamente!"
