#!/usr/bin/env bash
# Les requêtes GraphQL contiennent des variables $x entre apostrophes : c'est voulu.
# shellcheck disable=SC2016
# Synchronise la colonne (champ Status) d'une issue sur le board avec son état réel.
# Usage : board-sync.sh <numéro d'issue> [<numéro d'issue> ...]
# Variables d'environnement :
#   GH_TOKEN       jeton par défaut du dépôt (lecture des issues et des PR)
#   PROJECT_TOKEN  jeton personnel (scope "project") pour modifier le board
#   PROJECT_OWNER  propriétaire du board (ton compte)
#   PROJECT_NUMBER numéro du board (dans son URL)
#   GH_REPO        owner/repo
set -euo pipefail

# --- Colonnes : noms acceptés pour chaque étape (comparaison sans tenir compte des majuscules) ---
declare -A COLUMN_NAMES=(
  [BACKLOG]="Backlog"
  [REFINEMENT]="Refinement|Raffinement"
  [TO_VALIDATE]="To validate|À valider|A valider"
  [READY]="Ready|Prêt"
  [IN_PROGRESS]="In progress|En cours"
  [IN_REVIEW]="In review|Review|En revue"
  [DONE]="Done|Terminé"
  [BLOCKED]="Blocked|Bloqué"
)

# --- État d'une issue -> étape du board (la première règle qui s'applique gagne) ---
# Arguments : état (OPEN/CLOSED), labels séparés par des virgules, "true" si une PR d'agent est ouverte.
compute_stage() {
  local state="$1" labels=",$2," has_pr="$3"
  has() { [[ "$labels" == *",$1,"* ]]; }

  if [ "$state" = "CLOSED" ];                                then echo DONE;        return; fi
  if has needs-human || has needs-clarification;              then echo BLOCKED;     return; fi
  if [ "$has_pr" = "true" ];                                  then echo IN_REVIEW;   return; fi
  if has ready-for-agent || has planned;                      then echo IN_PROGRESS; return; fi
  if has approved;                                            then echo READY;       return; fi
  if has to-validate;                                         then echo TO_VALIDATE; return; fi
  if has refine || has idea;                                  then echo REFINEMENT;  return; fi
  if has sub-task;                                            then echo READY;       return; fi
  echo BACKLOG
}

# Permet de tester la règle seule : board-sync.sh --compute <state> <labels> <has_pr>
if [ "${1:-}" = "--compute" ]; then compute_stage "$2" "$3" "$4"; exit 0; fi

project_gql() { GH_TOKEN="$PROJECT_TOKEN" gh api graphql "$@"; }

# --- Board : identifiant, champ Status et ses colonnes ---
PROJECT_JSON=$(project_gql -f login="$PROJECT_OWNER" -F number="$PROJECT_NUMBER" -f query='
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) {
        id
        field(name: "Status") {
          ... on ProjectV2SingleSelectField { id options { id name } }
        }
      }
    }
  }')
PROJECT_ID=$(jq -r '.data.user.projectV2.id // empty' <<<"$PROJECT_JSON")
FIELD_ID=$(jq -r '.data.user.projectV2.field.id // empty' <<<"$PROJECT_JSON")
if [ -z "$PROJECT_ID" ] || [ -z "$FIELD_ID" ]; then
  echo "::error::Board introuvable (PROJECT_OWNER=$PROJECT_OWNER, PROJECT_NUMBER=$PROJECT_NUMBER) ou champ Status absent."
  exit 1
fi
OPTIONS=$(jq -c '.data.user.projectV2.field.options' <<<"$PROJECT_JSON")
echo "Colonnes du board : $(jq -r '[.[].name] | join(" | ")' <<<"$OPTIONS")"

option_id_for() {
  local stage="$1" candidate id
  IFS='|' read -ra candidates <<<"${COLUMN_NAMES[$stage]}"
  for candidate in "${candidates[@]}"; do
    id=$(jq -r --arg n "$candidate" '.[] | select((.name | ascii_downcase) == ($n | ascii_downcase)) | .id' <<<"$OPTIONS" | head -n1)
    if [ -n "$id" ]; then echo "$id"; return; fi
  done
}

REPO_OWNER="${GH_REPO%%/*}"
REPO_NAME="${GH_REPO##*/}"

sync_issue() {
  local number="$1"
  local issue state labels has_pr stage option_id issue_id item_id

  issue=$(gh issue view "$number" --json state,labels)
  state=$(jq -r '.state' <<<"$issue")
  labels=$(jq -r '[.labels[].name] | join(",")' <<<"$issue")
  if [ -n "$(gh pr list --head "ai/issue-$number" --state open --json number --jq '.[0].number // empty')" ]; then
    has_pr=true
  else
    has_pr=false
  fi

  stage=$(compute_stage "$state" "$labels" "$has_pr")
  option_id=$(option_id_for "$stage")
  if [ -z "$option_id" ]; then
    echo "::warning::#$number : étape $stage, mais aucune colonne correspondante (${COLUMN_NAMES[$stage]}). Carte non déplacée."
    return 0
  fi

  # Carte de l'issue sur ce board (créée si absente).
  local lookup
  lookup=$(project_gql -f owner="$REPO_OWNER" -f name="$REPO_NAME" -F number="$number" -f query='
    query($owner: String!, $name: String!, $number: Int!) {
      repository(owner: $owner, name: $name) {
        issue(number: $number) { id projectItems(first: 20) { nodes { id project { id } } } }
      }
    }')
  issue_id=$(jq -r '.data.repository.issue.id' <<<"$lookup")
  item_id=$(jq -r --arg p "$PROJECT_ID" '.data.repository.issue.projectItems.nodes[] | select(.project.id == $p) | .id' <<<"$lookup" | head -n1)

  if [ -z "$item_id" ]; then
    item_id=$(project_gql -f project="$PROJECT_ID" -f content="$issue_id" -f query='
      mutation($project: ID!, $content: ID!) {
        addProjectV2ItemById(input: { projectId: $project, contentId: $content }) { item { id } }
      }' --jq '.data.addProjectV2ItemById.item.id')
  fi

  project_gql -f project="$PROJECT_ID" -f item="$item_id" -f field="$FIELD_ID" -f option="$option_id" -f query='
    mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $project, itemId: $item, fieldId: $field,
        value: { singleSelectOptionId: $option }
      }) { projectV2Item { id } }
    }' > /dev/null

  echo "#$number -> $stage"
}

for number in "$@"; do
  sync_issue "$number"
done
