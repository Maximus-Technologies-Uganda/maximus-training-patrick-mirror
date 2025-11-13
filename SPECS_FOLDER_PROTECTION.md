# Folder Protection & Backup Strategy
## 001-frontend-ssr-hardening Specifications

### Overview
The `specs/001-frontend-ssr-hardening/` folder is the **single source of truth** for the entire Frontend Foundations Week 10 SSR & Hardening project specification. It contains:

- **9 critical files** with 870+ lines of specification
- **78 tasks** across 6 phases
- **Complete design documentation** for US1-US3
- **API contracts** and data models

### Why This Matters
This folder documents the entire architecture, test strategies, and acceptance criteria. Loss of this folder would:
- Break project continuity
- Lose phase tracking and dependencies
- Orphan all task specifications
- Remove reference implementations

### Protection Layers

#### Layer 1: Git Version Control ✅
```bash
# Tracked in git
git log --oneline -- specs/001-frontend-ssr-hardening/

# Committed with commit: 0f5a0989
# and: 72ed87cd (protection marker)
```

#### Layer 2: .gitkeep File ✅
- File: `specs/001-frontend-ssr-hardening/.gitkeep`
- Purpose: Prevents accidental deletion + provides restoration guide
- Status: Committed to git

#### Layer 3: Automated Backup Script ✅
```bash
# Run backup
./scripts/backup-specs-folder.ps1

# Creates timestamped backup with checksums
# Example: backups/specs-001-ssr-hardening-20251113-143000/
```

#### Layer 4: CI/CD Protection (Recommended)
```yaml
# Add to .github/workflows/protect-specs.yml
- name: Verify specs folder integrity
  run: |
    REQUIRED_FILES=(
      "specs/001-frontend-ssr-hardening/tasks.md"
      "specs/001-frontend-ssr-hardening/plan.md"
      "specs/001-frontend-ssr-hardening/spec.md"
      ... (full list in script)
    )
    for file in "${REQUIRED_FILES[@]}"; do
      if [ ! -f "$file" ]; then
        echo "❌ CRITICAL: $file missing"
        exit 1
      fi
    done
    echo "✅ All specification files present"
```

#### Layer 5: Recovery Procedure 🆘
If the folder is ever lost or corrupted:

```bash
# Quick restore from git history
git checkout 8c411829 -- specs/001-frontend-ssr-hardening/

# Full restore with verification
./scripts/backup-specs-folder.ps1

# Restore from backup (if available)
cp -r backups/specs-001-ssr-hardening-*/001-frontend-ssr-hardening specs/
```

### Critical File Inventory

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `tasks.md` | 182 | Phase tracker & task list | ✅ Committed |
| `plan.md` | ? | Project timeline | ✅ Committed |
| `spec.md` | ? | User stories | ✅ Committed |
| `research.md` | ? | Design patterns | ✅ Committed |
| `data-model.md` | ? | Schema & data | ✅ Committed |
| `contracts/openapi.yaml` | ? | API spec | ✅ Committed |
| `contracts/query.zod.ts` | ? | Zod schemas | ✅ Committed |
| `checklists/requirements.md` | ? | Requirements | ✅ Committed |
| `checklists/requirements-quality.md` | ? | Quality criteria | ✅ Committed |

### Last Successful Backup
- **Date**: 2025-11-13
- **Commit**: 0f5a0989 & 72ed87cd
- **Branch**: feat/phase5-implementation
- **Status**: ✅ All files verified & committed

### Backup Schedule (Recommended)
```bash
# Run weekly backup
0 0 * * 0 cd /path/to/repo && ./scripts/backup-specs-folder.ps1

# Or run before major phase pushes
git push origin feat/phase5-implementation && ./scripts/backup-specs-folder.ps1
```

### Team Communication
**IMPORTANT**: This folder must never be deleted or emptied by:
- Automated tools
- Refactoring scripts
- CI/CD jobs
- Manual cleanup

**If accidental deletion occurs:**
1. Run: `git checkout 8c411829 -- specs/001-frontend-ssr-hardening/`
2. Run: `./scripts/backup-specs-folder.ps1` to verify
3. Commit restoration: `git commit -m "restore: recover 001-frontend-ssr-hardening from accidental deletion"`

### Verification Checklist
- [ ] Folder exists at `specs/001-frontend-ssr-hardening/`
- [ ] All 9 files present (see inventory above)
- [ ] `.gitkeep` file exists with restoration guide
- [ ] Git history shows commits: 0f5a0989 & 72ed87cd
- [ ] Backup script runs without errors
- [ ] All test references to this folder resolve correctly

---

**Last Updated**: 2025-11-13  
**Protection Status**: ✅ ACTIVE  
**Recovery Status**: ✅ READY
