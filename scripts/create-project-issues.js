#!/usr/bin/env node

/**
 * Script to create GitHub issues from the task lists in specs directory
 * Reads all tasks.md files and creates GitHub issues for each task
 * Run with: node scripts/create-project-issues.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const specsDir = path.join(__dirname, '..', 'specs');

// Task status mapping
const STATUS_MAP = {
  '[X]': 'completed',
  '[x]': 'completed',
  '[ ]': 'open',
};

// Phase mapping from task prefixes
const PHASE_MAP = {
  T001: 'setup',
  T002: 'setup',
  T003: 'setup',
  T004: 'foundational',
  T005: 'foundational',
  T006: 'foundational',
  // Add more mappings as needed...
};

function parseTasksFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const tasks = [];
  let currentPhase = '';

  for (const line of lines) {
    // Check for phase headers (handles both "—" and "-" as separators)
    const phaseMatch = line.match(/^## Phase \d+[:\s—\-]+(.+)$/);
    if (phaseMatch) {
      currentPhase = phaseMatch[1]
        .replace(/&/g, 'and') // Replace & with 'and'
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace any non-alphanumeric with dash
        .replace(/^-+|-+$/g, ''); // Trim dashes from start/end
      continue;
    }

    // Check for tasks - match both formats:
    // Format 1: - [ ] T001 Task description
    // Format 2: - [ ] Task description — Location
    const taskMatch = line.match(/^- \[([ Xx])\] (.+)$/);
    if (taskMatch) {
      const [, status, fullDescription] = taskMatch;
      const taskIdMatch =
        fullDescription.match(/^(T\d+)\s+(.+)$/) || fullDescription.match(/^(.+?)\s*—\s*(.+)$/);

      if (taskIdMatch) {
        const [, idOrDesc, descOrLocation] = taskIdMatch;
        let taskId, description, location;

        // Determine if this is format 1 (T001 Task) or format 2 (Task — Location)
        if (idOrDesc.match(/^T\d+$/)) {
          // Format 1: T001 Task description
          taskId = idOrDesc;
          description = descOrLocation;
          location = currentPhase || 'unknown';
        } else {
          // Format 2: Description — Location
          taskId = fullDescription.match(/(T\d+)/)?.[1] || '';
          description = fullDescription;
          location = descOrLocation;
        }

        if (taskId) {
          tasks.push({
            id: taskId,
            description: description.trim(),
            location: location.trim(),
            status: STATUS_MAP[`[${status}]`] || 'open',
            phase: currentPhase,
            file: path.basename(filePath, '.md'),
          });
        }
      }
    }
  }

  return tasks;
}

function createIssue(task) {
  const title = `${task.id}: ${task.description}`;
  const body = `**Task:** ${task.description}
**Location:** ${task.location}
**Phase:** ${task.phase}
**Source:** specs/${task.file}/tasks.md

${task.status === 'completed' ? '**Status:** ✅ Completed' : '**Status:** 🔄 Open'}

---

*This issue was automatically created from the task list. Please update the task status in the source file when completed.*`;

  // Build labels - use status only (phase labels may not exist yet)
  const labels = [task.status === 'completed' ? 'status/completed' : 'status/open'];

  // Write body to temporary file to avoid shell escaping issues
  const tempFile = path.join(
    os.tmpdir(),
    `issue-body-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.txt`,
  );

  try {
    fs.writeFileSync(tempFile, body, 'utf8');

    // Build command arguments array for spawnSync (no shell escaping needed)
    const args = ['issue', 'create', '--title', title, '--body-file', tempFile];
    if (labels.length > 0) {
      args.push('--label', labels.join(','));
    }

    console.log(`Creating issue: ${title}`);

    // Use spawnSync to avoid shell escaping issues completely
    const result = spawnSync('gh', args, { encoding: 'utf8' });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`gh issue create failed with status ${result.status}: ${result.stderr}`);
    }

    console.log(`Created: ${result.stdout.trim()}`);
  } catch (error) {
    console.error(`Failed to create issue for ${task.id}: ${error.message}`);
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

function findAllTaskFiles(baseDir) {
  const taskFiles = [];

  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Check if this directory has tasks.md
        const tasksPath = path.join(fullPath, 'tasks.md');
        if (fs.existsSync(tasksPath)) {
          taskFiles.push(tasksPath);
        }

        // Recursively walk subdirectories
        walkDir(fullPath);
      }
    }
  }

  walkDir(baseDir);
  return taskFiles;
}

function main() {
  console.log('Parsing task files...');

  const allTasks = [];

  // Auto-discover all tasks.md files in specs directory
  const taskFiles = findAllTaskFiles(specsDir);

  if (taskFiles.length === 0) {
    console.warn('No tasks.md files found in specs directory');
    return;
  }

  for (const filePath of taskFiles) {
    const relativePath = path.relative(path.join(__dirname, '..'), filePath);
    console.log(`Processing ${relativePath}...`);
    const tasks = parseTasksFromFile(filePath);
    allTasks.push(...tasks);
  }

  console.log(`Found ${allTasks.length} tasks`);

  // Filter to only open tasks (optional)
  const openTasks = allTasks.filter((task) => task.status === 'open');

  console.log(`Creating ${openTasks.length} open issues...`);

  for (const task of openTasks) {
    createIssue(task);
  }

  console.log('Done! Check GitHub for the created issues.');
}

if (require.main === module) {
  main();
}
