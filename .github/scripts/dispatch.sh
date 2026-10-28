#!/usr/bin/env bash
# Planificateur (sans IA).
# 1. Ferme les idées dont tous les sous-tickets sont terminés.
# 2. Si aucun sous-ticket n'est en cours (WIP = 1), lance le prochain dont les dépendances sont fermées.
# Conventions dans le corps d'un sous-ticket :
#   Parent : #12
#   Dépend de : #14, #15     (ou "aucun")
set -euo pipefail

parent_of()  { grep -oE '^Parent ?: ?#[0-9]+' <<<"$1" | grep -oE '[0-9]+' | head -n1 || true; }
deps_of()    { grep -E '^D[ée]pend de ?:' <<<"$1" | grep -oE '#[0-9]+' | tr -d '#' || true; }

ALL_SUBTASKS=$(gh issue list --state all --label sub-task --limit 300 --json number,state,body)

# --- 1. Fermer les idées terminées -------------------------------------------------
for parent in $(gh issue list --state open --label planned --limit 100 --json number --jq '.[].number'); do
  total=0; open=0
  while IFS= read -r row; do
    body=$(jq -r '.body' <<<"$row")
    [ "$(parent_of "$body")" = "$parent" ] || continue
    total=$((total + 1))
    [ "$(jq -r '.state' <<<"$row")" = "OPEN" ] && open=$((open + 1))
  done < <(jq -c '.[]' <<<"$ALL_SUBTASKS")

  if [ "$total" -gt 0 ] && [ "$open" -eq 0 ]; then
    gh issue comment "$parent" --body "Tous les sous-tickets ($total) sont terminés. Idée réalisée."
    gh issue edit "$parent" --remove-label planned || true
    gh issue close "$parent" --reason completed
    echo "Idée #$parent fermée."
  fi
done

# --- 2. WIP = 1 --------------------------------------------------------------------
BUSY=$(gh issue list --state open --label sub-task --limit 300 --json number,labels \
  --jq '[.[] | select([.labels[].name] | any(. == "ready-for-agent" or . == "needs-clarification" or . == "needs-human"))] | length')
OPEN_AGENT_PRS=$(gh pr list --state open --limit 100 --json headRefName \
  --jq '[.[] | select(.headRefName | startswith("ai/issue-"))] | length')

if [ "$BUSY" -gt 0 ] || [ "$OPEN_AGENT_PRS" -gt 0 ]; then
  echo "Une tâche est déjà en cours ($BUSY issue(s) active(s), $OPEN_AGENT_PRS PR d'agent ouverte(s)). Rien à lancer."
  exit 0
fi

# --- 3. Lancer le prochain sous-ticket prêt (le plus ancien d'abord) ----------------
for number in $(jq -r '[.[] | select(.state == "OPEN") | .number] | sort | .[]' <<<"$ALL_SUBTASKS"); do
  body=$(jq -r --argjson n "$number" '.[] | select(.number == $n) | .body' <<<"$ALL_SUBTASKS")
  ready=true
  for dep in $(deps_of "$body"); do
    state=$(gh issue view "$dep" --json state --jq '.state')
    if [ "$state" != "CLOSED" ]; then ready=false; break; fi
  done

  if [ "$ready" = true ]; then
    gh issue edit "$number" --add-label ready-for-agent
    echo "Sous-ticket #$number lancé."
    exit 0
  fi
done

echo "Aucun sous-ticket prêt."
