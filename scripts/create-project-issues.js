#!/usr/bin/env node

/**
 * Script to create GitHub issues from the task lists in specs/*/tasks.md files
 * Run with: node scripts/create-project-issues.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const specsDir = path.join(__dirname, '..', 'specs');

// Task status mapping
const STATUS_MAP = {
  '[X]': 'completed',
  '[x]': 'completed',
  '[ ]': 'open'
};

// Phase mapping from task prefixes
const PHASE_MAP = {
  'T001': 'setup', 'T002': 'setup', 'T003': 'setup',
  'T004': 'foundational', 'T005': 'foundational', 'T006': 'foundational',
  // Add more mappings as needed...
};

function parseTasksFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const tasks = [];
  let currentPhase = '';

  for (const line of lines) {
    // Check for phase headers
    const phaseMatch = line.match(/^## Phase \d+ — (.+)$/);
    if (phaseMatch) {
      currentPhase = phaseMatch[1].toLowerCase().replace(/[^a-z0-9]/g, '-');
      continue;
    }

    // Check for tasks
    const taskMatch = line.match(/^- \[([ Xx])\] (.+?) — (.+)$/);
    if (taskMatch) {
      const [, status, description, location] = taskMatch;
      const taskId = description.match(/(T\d+)/)?.[1];

      tasks.push({
        id: taskId,
        description: description.trim(),
        location: location.trim(),
        status: STATUS_MAP[status] || 'open',
        phase: currentPhase,
        file: path.basename(filePath, '.md')
      });
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

  const labels = [
    `phase/${task.phase}`,
    task.status === 'completed' ? 'status/completed' : 'status/open'
  ];

  // Use GitHub CLI to create the issue
  const command = `gh issue create --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "${labels.join(',')}"`;

  try {
    console.log(`Creating issue: ${title}`);
    const result = execSync(command, { encoding: 'utf8' });
    console.log(`Created: ${result.trim()}`);
  } catch (error) {
    console.error(`Failed to create issue for ${task.id}: ${error.message}`);
  }
}

function main() {
  console.log('Parsing task files...');

  const allTasks = [];

  // Find all tasks.md files
  const taskFiles = [
    'specs/008-identity-platform/tasks.md',
    'specs/007-spec/week-7.5-finishers/tasks.md',
    // Add other task files as needed
  ];

  for (const file of taskFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`Processing ${file}...`);
      const tasks = parseTasksFromFile(filePath);
      allTasks.push(...tasks);
    }
  }

  console.log(`Found ${allTasks.length} tasks`);

  // Filter to only open tasks (optional)
  const openTasks = allTasks.filter(task => task.status === 'open');

  console.log(`Creating ${openTasks.length} open issues...`);

  for (const task of openTasks.slice(0, 10)) { // Limit to first 10 for testing
    createIssue(task);
  }

  console.log('Done! Check GitHub for the created issues.');
}

if (require.main === module) {
  main();
}
