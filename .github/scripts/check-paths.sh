#!/usr/bin/env bash
# Vérifie qu'une branche d'agent ne modifie que les fichiers autorisés pour sa spécialité.
# Usage : check-paths.sh <branche> <regex des chemins autorisés>
# Code de sortie 0 = conforme ; 1 = fichiers interdits (listés sur la sortie standard).
set -euo pipefail

BRANCH="$1"
ALLOWED="$2"

git fetch --quiet origin main "$BRANCH"
FILES=$(git diff --name-only "origin/main...origin/$BRANCH")

if [ -z "$FILES" ]; then
  echo "Aucun fichier modifié."
  exit 0
fi

BAD=$(printf '%s\n' "$FILES" | grep -Ev "$ALLOWED" || true)

if [ -n "$BAD" ]; then
  echo "$BAD"
  exit 1
fi

echo "Tous les fichiers modifiés sont autorisés."
