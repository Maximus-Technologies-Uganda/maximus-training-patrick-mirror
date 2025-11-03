#!/bin/bash

# Script to populate GitHub Project with issues from task lists
# Usage: ./scripts/populate-project-issues.sh [limit]
# limit: Maximum number of issues to create (default: 20)

set -e

LIMIT=${1:-20}
COUNT=0

echo "🔄 Populating GitHub Project with issues from task lists..."
echo "Limit: $LIMIT issues"

# Function to create an issue
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    echo "Creating issue: $title"

    # Create the issue using GitHub CLI
    if gh issue create --title "$title" --body "$body" --label "$labels"; then
        echo "✅ Created: $title"
        ((COUNT++))
    else
        echo "❌ Failed: $title"
    fi
}

# Read from Week 8 tasks
echo "📋 Processing Week 8 Identity Platform tasks..."

while IFS= read -r line; do
    if [[ $COUNT -ge $LIMIT ]]; then
        echo "Reached limit of $LIMIT issues"
        break
    fi

    # Parse task lines: - [ ] T001 description — location
    if [[ $line =~ ^- \[([ Xx])\]\ (T[0-9]+):?\ (.+)\ —\ (.+)$ ]]; then
        status="${BASH_REMATCH[1]}"
        task_id="${BASH_REMATCH[2]}"
        description="${BASH_REMATCH[3]}"
        location="${BASH_REMATCH[4]}"

        # Skip completed tasks
        if [[ "$status" == "X" || "$status" == "x" ]]; then
            continue
        fi

        title="$task_id: $description"
        body="**Task:** $description
**Location:** $location
**Source:** specs/008-identity-platform/tasks.md

**Status:** 🔄 Open

---

*This issue was created from the Week 8 Identity Platform task list.*"

        # Determine phase and component labels
        labels="week/8"

        # Phase detection
        case $task_id in
            T001|T002|T003) labels="$labels,phase/setup" ;;
            T004|T005|T006|T031|T032|T042|T044|T049|T050|T051|T054|T055|T056|T058|T061|T065|T066|T067|T068|T069|T076|T084|T085|T086|T087|T090|T092|T094|T095|T096|T097|T098)
                labels="$labels,phase/foundational" ;;
            T007|T008|T009|T043) labels="$labels,phase/us1" ;;
            T010|T011|T012|T013|T014|T015|T016|T017|T018|T019|T033|T034|T035|T036|T037|T038|T047|T048|T052|T053|T060|T062|T063|T074|T077|T093|T099)
                labels="$labels,phase/us2" ;;
            T020|T021|T022|T023|T064) labels="$labels,phase/us3" ;;
            T024|T025|T026|T027|T039|T040|T041|T057|T059|T070|T071|T072|T073|T075|T078|T079|T081|T083|T088|T089|T091|T100|T101|T105|T112)
                labels="$labels,phase/observability" ;;
            T028|T029|T030|T080|T082|T106) labels="$labels,phase/release" ;;
        esac

        # Component detection
        if [[ "$location" == *frontend* || "$location" == *component* ]]; then
            labels="$labels,component/frontend"
        fi
        if [[ "$location" == *api* || "$location" == *middleware* ]]; then
            labels="$labels,component/api"
        fi
        if [[ "$location" == *workflow* || "$location" == *ci* ]]; then
            labels="$labels,component/ci"
        fi

        create_issue "$title" "$body" "$labels"
    fi
done < specs/008-identity-platform/tasks.md

echo ""
echo "🎉 Created $COUNT issues for the GitHub Project!"
echo ""
echo "Next steps:"
echo "1. Go to your GitHub Project board"
echo "2. Review and organize the created issues"
echo "3. Set up automation rules in the project settings"
echo "4. Consider creating custom fields for priority, estimation, etc."
