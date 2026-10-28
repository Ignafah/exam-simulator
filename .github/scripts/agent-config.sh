#!/usr/bin/env bash
# Calcule la configuration d'un agent spécialisé à partir des labels de l'issue.
# Usage : agent-config.sh "label1,label2,..."
# Écrit dans $GITHUB_OUTPUT : area, tools (commandes autorisées), paths (fichiers modifiables, regex).
set -euo pipefail

LABELS=",${1:-},"

COMMON="Read,Write,Edit,Glob,Grep,Bash(mkdir:*),Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(git switch:*),Bash(git add:*),Bash(git mv:*),Bash(git rm:*),Bash(git commit:*),Bash(git push:*),Bash(git check-ignore:*),Bash(gh issue view:*),Bash(gh issue comment:*),Bash(gh issue edit:*),Bash(gh pr create:*),Bash(gh pr view:*),Bash(gh pr comment:*)"
BACKEND_TOOLS="Bash(dotnet:*)"
FRONTEND_TOOLS="Bash(npm ci:*),Bash(npm install:*),Bash(npm create vite:*),Bash(npm run:*),Bash(npx @vite-pwa/assets-generator:*),Bash(npx pwa-assets-generator:*),Bash(npx tsc:*)"

# Fichiers modifiables. Tout le reste (dont .github/, CLAUDE.md, legacy/) est refusé par check-paths.sh.
BACKEND_PATHS='^(backend/|docs/|README\.md$|\.gitignore$|docker-compose\.yml$|\.config/dotnet-tools\.json$)'
FRONTEND_PATHS='^(frontend/|docs/|README\.md$|\.gitignore$)'
GENERAL_PATHS='^(backend/|frontend/|docs/|README\.md$|\.gitignore$|docker-compose\.yml$|\.config/dotnet-tools\.json$)'

if [[ "$LABELS" == *",area:backend,"* ]]; then
  AREA="backend"; TOOLS="$COMMON,$BACKEND_TOOLS"; PATHS="$BACKEND_PATHS"
elif [[ "$LABELS" == *",area:frontend,"* ]]; then
  AREA="frontend"; TOOLS="$COMMON,$FRONTEND_TOOLS"; PATHS="$FRONTEND_PATHS"
else
  AREA="general"; TOOLS="$COMMON,$BACKEND_TOOLS,$FRONTEND_TOOLS"; PATHS="$GENERAL_PATHS"
fi

{
  echo "area=$AREA"
  echo "tools=$TOOLS"
  echo "paths=$PATHS"
} >> "$GITHUB_OUTPUT"

echo "Agent $AREA configuré."
