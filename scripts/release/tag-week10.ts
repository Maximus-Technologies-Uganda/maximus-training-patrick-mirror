import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Week 10 release tag automation – T061
 *
 * This script writes a lightweight marker file under docs/week-10 and
 * prints a suggested git tag for the Week 10 SSR & Hardening release.
 */

function main() {
  const docsDir = path.join(process.cwd(), 'docs', 'week-10');
  const markerPath = path.join(docsDir, 'release-marker.json');

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const payload = {
    release: 'week10-frontend-ssr-hardening',
    createdAt: new Date().toISOString(),
  } as const;

  fs.writeFileSync(markerPath, JSON.stringify(payload, null, 2));

   
  console.log('Release marker written to', markerPath);
   
  console.log('Suggested tag: v0.10.0-week10-frontend-ssr-hardening');
}

main();
