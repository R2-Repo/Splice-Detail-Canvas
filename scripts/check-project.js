import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredFiles = [
  'index.html',
  'package.json',
  'README.md',
  'CONTRIBUTING.md',
  'AGENTS.md',
  'PROJECT_OVERVIEW.md',
  '.env.example',
  'src/main.js',
  'src/styles.css',
  '.gitignore',
  '.cursor/rules/agent-communication.md',
  '.cursor/skills/README.md',
  '.github/workflows/ci.yml',
  '.github/pull_request_template.md',
  '.github/ISSUE_TEMPLATE/bug_report.md',
  '.github/ISSUE_TEMPLATE/config.yml',
  'docs/README.md',
  'docs/START_HERE.md',
  'docs/ONBOARDING.md',
  'docs/MEMORY.md',
  'docs/HANDOFF.md',
  'docs/TESTING.md',
  'docs/DEFINITION_OF_DONE.md',
  'docs/QUALITY.md',
  'docs/SECURITY.md',
  'docs/MCP.md',
  'docs/PROMPT_EXAMPLES.md',
  'docs/REPO_SETUP_CHECKLIST.md',
  'docs/memory/README.md',
  'playwright.config.js',
  'vitest.config.js',
  'tests/runner.test.js',
  'e2e/smoke.spec.js'
];

const requiredDirs = [
  '.cursor/rules',
  '.cursor/skills',
  'docs/plans',
  'docs/memory',
  '.github/workflows',
  '.github/ISSUE_TEMPLATE',
  'src',
  'scripts',
  'docs',
  'tests',
  'e2e'
];

const missing = [];

for (const file of requiredFiles) {
  if (!existsSync(path.join(projectRoot, file))) {
    missing.push(file);
  }
}

for (const dir of requiredDirs) {
  if (!existsSync(path.join(projectRoot, dir))) {
    missing.push(`${dir}/ (directory)`);
  }
}

if (missing.length > 0) {
  console.error('Project check failed. Missing paths:');
  for (const p of missing) {
    console.error(`- ${p}`);
  }
  process.exit(1);
}

console.log('Project check passed.');
