#!/bin/bash
# Update tasks.md to mark T054-T069 as completed

sed -i 's/^- \[ \] T054 Spectral/- [X] T054 Spectral/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T055 Secret scanning/- [X] T055 Secret scanning (partial - CI job pending)/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T056 App Router/- [X] T056 App Router/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T058 Contract drift/- [X] T058 Contract drift/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T061 Expose rate-limit/- [X] T061 Expose rate-limit/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T065 Ensure OpenAPI/- [X] T065 Ensure OpenAPI/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T066 Log guard/- [X] T066 Log guard/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T067 CSP nonce/- [X] T067 CSP nonce/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T068 Content negotiation/- [X] T068 Content negotiation/' specs/008-identity-platform/tasks.md
sed -i 's/^- \[ \] T069 CORS hardening/- [X] T069 CORS hardening/' specs/008-identity-platform/tasks.md

echo "Tasks updated!"
