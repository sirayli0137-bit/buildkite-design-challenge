import type { BuildStep } from "@/types/build";

/**
 * Primary dataset for the expanded-region task.
 *
 * Six pipeline steps (checkout → deploy). Steps 2–4 contain nested `jobs`.
 * The build fails at "Test (Node 18)" — downstream steps stay pending.
 */
export const mockBuildSteps: BuildStep[] = [
  {
    id: "checkout",
    name: "Checkout",
    type: "command",
    status: "complete",
    command: "git checkout",
    agent: "ubuntu-latest",
    queue: "default",
    duration: "4s",
    startTime: "10:45:30",
    state: "normal",
    exitCode: 0,
  },
  {
    id: "deps",
    name: "Dependencies",
    type: "parallel",
    status: "complete",
    duration: "45s",
    startTime: "10:45:34",
    jobs: [
      {
        id: "deps-npm",
        name: "NPM",
        status: "complete",
        command: "npm ci",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "45s",
        startTime: "10:45:34",
        state: "normal",
        exitCode: 0,
      },
      {
        id: "deps-pip",
        name: "pip",
        status: "complete",
        command: "pip install",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "30s",
        startTime: "10:45:34",
        state: "normal",
        exitCode: 0,
      },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    type: "parallel",
    status: "complete",
    duration: "13s",
    startTime: "10:46:04",
    jobs: [
      {
        id: "lint-js",
        name: "Lint JS",
        status: "complete",
        command: "npm run lint",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "8s",
        startTime: "10:46:04",
        state: "normal",
        exitCode: 0,
      },
      {
        id: "lint-py",
        name: "Lint Python",
        status: "complete",
        command: "flake8",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "5s",
        startTime: "10:46:04",
        state: "normal",
        exitCode: 0,
      },
    ],
  },
  {
    id: "test-matrix",
    name: "Test matrix",
    type: "matrix",
    status: "failed",
    duration: "1m 20s",
    startTime: "10:46:19",
    jobs: [
      {
        id: "test-node16",
        name: "Test (Node 16)",
        status: "complete",
        command: "npm test",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "1m 20s",
        startTime: "10:46:19",
        state: "normal",
        exitCode: 0,
      },
      {
        id: "test-node18",
        name: "Test (Node 18)",
        status: "failed",
        command: "npm test",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "1m 12s",
        startTime: "10:46:19",
        state: "normal",
        exitCode: 1,
      },
      {
        id: "test-node20",
        name: "Test (Node 20)",
        status: "pending",
        command: "npm test",
        agent: "ubuntu-latest",
        queue: "default",
        duration: "--",
        startTime: "--",
        state: "pending",
        exitCode: null,
      },
    ],
  },
  {
    id: "bundle",
    name: "Bundle",
    type: "command",
    status: "pending",
    command: "npm run build",
    agent: "ubuntu-latest",
    queue: "default",
    duration: "--",
    startTime: "--",
    state: "pending",
    exitCode: null,
  },
  {
    id: "deploy",
    name: "Deploy",
    type: "command",
    status: "pending",
    command: "deploy.sh",
    agent: "ubuntu-latest",
    queue: "default",
    duration: "--",
    startTime: "--",
    state: "pending",
    exitCode: null,
  },
];

/**
 * Scenario: Post-fix verified — every step (and matrix variant) passes.
 * Used by V7.2 (Verified) so the whole build header reflects the success.
 */
export const verifiedScenarioSteps: BuildStep[] = [
  {
    id: "checkout",
    name: "Checkout",
    type: "command",
    status: "complete",
    command: "git checkout",
    agent: "ubuntu-latest",
    queue: "default",
    duration: "4s",
    startTime: "10:45:30",
    state: "normal",
    exitCode: 0,
  },
  {
    id: "deps",
    name: "Dependencies",
    type: "parallel",
    status: "complete",
    duration: "45s",
    startTime: "10:45:34",
    jobs: [
      { id: "deps-npm", name: "NPM", status: "complete", command: "npm ci", agent: "ubuntu-latest", queue: "default", duration: "45s", startTime: "10:45:34", state: "normal", exitCode: 0 },
      { id: "deps-pip", name: "pip", status: "complete", command: "pip install", agent: "ubuntu-latest", queue: "default", duration: "30s", startTime: "10:45:34", state: "normal", exitCode: 0 },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    type: "parallel",
    status: "complete",
    duration: "13s",
    startTime: "10:46:04",
    jobs: [
      { id: "lint-js", name: "Lint JS", status: "complete", command: "npm run lint", agent: "ubuntu-latest", queue: "default", duration: "8s", startTime: "10:46:04", state: "normal", exitCode: 0 },
      { id: "lint-py", name: "Lint Python", status: "complete", command: "flake8", agent: "ubuntu-latest", queue: "default", duration: "5s", startTime: "10:46:04", state: "normal", exitCode: 0 },
    ],
  },
  {
    id: "test-matrix",
    name: "Test matrix",
    type: "matrix",
    status: "complete",
    duration: "1m 22s",
    startTime: "10:46:19",
    jobs: [
      { id: "test-node16", name: "Test (Node 16)", status: "complete", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 18s", startTime: "10:46:19", state: "normal", exitCode: 0 },
      { id: "test-node18", name: "Test (Node 18)", status: "complete", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 14s", startTime: "10:46:19", state: "normal", exitCode: 0 },
      { id: "test-node20", name: "Test (Node 20)", status: "complete", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 22s", startTime: "10:46:19", state: "normal", exitCode: 0 },
    ],
  },
  { id: "bundle", name: "Bundle", type: "command", status: "complete", command: "npm run build", agent: "ubuntu-latest", queue: "default", duration: "12s", startTime: "10:47:41", state: "normal", exitCode: 0 },
  { id: "deploy", name: "Deploy", type: "command", status: "complete", command: "deploy.sh", agent: "ubuntu-latest", queue: "default", duration: "30s", startTime: "10:47:53", state: "normal", exitCode: 0 },
];

/**
 * Scenario: Stuck build — Test (Node 18) has been running for 3h 24m
 * past its typical 8m duration. Used by V7.1 (Stuck build).
 */
export const stuckScenarioSteps: BuildStep[] = [
  { id: "checkout", name: "Checkout", type: "command", status: "complete", command: "git checkout", agent: "ubuntu-latest", queue: "default", duration: "4s", startTime: "10:45:30", state: "normal", exitCode: 0 },
  {
    id: "deps",
    name: "Dependencies",
    type: "parallel",
    status: "complete",
    duration: "45s",
    startTime: "10:45:34",
    jobs: [
      { id: "deps-npm", name: "NPM", status: "complete", command: "npm ci", agent: "ubuntu-latest", queue: "default", duration: "45s", startTime: "10:45:34", state: "normal", exitCode: 0 },
      { id: "deps-pip", name: "pip", status: "complete", command: "pip install", agent: "ubuntu-latest", queue: "default", duration: "30s", startTime: "10:45:34", state: "normal", exitCode: 0 },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    type: "parallel",
    status: "complete",
    duration: "13s",
    startTime: "10:46:04",
    jobs: [
      { id: "lint-js", name: "Lint JS", status: "complete", command: "npm run lint", agent: "ubuntu-latest", queue: "default", duration: "8s", startTime: "10:46:04", state: "normal", exitCode: 0 },
      { id: "lint-py", name: "Lint Python", status: "complete", command: "flake8", agent: "ubuntu-latest", queue: "default", duration: "5s", startTime: "10:46:04", state: "normal", exitCode: 0 },
    ],
  },
  {
    id: "test-matrix",
    name: "Test matrix",
    type: "matrix",
    status: "in-progress",
    duration: "3h 24m",
    startTime: "10:46:19",
    jobs: [
      { id: "test-node16", name: "Test (Node 16)", status: "complete", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 20s", startTime: "10:46:19", state: "normal", exitCode: 0 },
      { id: "test-node18", name: "Test (Node 18)", status: "in-progress", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "3h 24m", startTime: "10:46:19", state: "normal", exitCode: null },
      { id: "test-node20", name: "Test (Node 20)", status: "pending", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
    ],
  },
  { id: "bundle", name: "Bundle", type: "command", status: "pending", command: "npm run build", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
  { id: "deploy", name: "Deploy", type: "command", status: "pending", command: "deploy.sh", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
];

/**
 * Scenario: Multiple parallel failures — Lint and Test matrix both broke
 * independently. Used by V7.4 (Multi-failure) to demonstrate row stacking.
 */
export const multiFailScenarioSteps: BuildStep[] = [
  { id: "checkout", name: "Checkout", type: "command", status: "complete", command: "git checkout", agent: "ubuntu-latest", queue: "default", duration: "4s", startTime: "10:45:30", state: "normal", exitCode: 0 },
  {
    id: "deps",
    name: "Dependencies",
    type: "parallel",
    status: "complete",
    duration: "45s",
    startTime: "10:45:34",
    jobs: [
      { id: "deps-npm", name: "NPM", status: "complete", command: "npm ci", agent: "ubuntu-latest", queue: "default", duration: "45s", startTime: "10:45:34", state: "normal", exitCode: 0 },
      { id: "deps-pip", name: "pip", status: "complete", command: "pip install", agent: "ubuntu-latest", queue: "default", duration: "30s", startTime: "10:45:34", state: "normal", exitCode: 0 },
    ],
  },
  {
    id: "lint",
    name: "Lint",
    type: "parallel",
    status: "failed",
    duration: "5s",
    startTime: "10:46:04",
    exitCode: 2,
  },
  {
    id: "test-matrix",
    name: "Test matrix",
    type: "matrix",
    status: "failed",
    duration: "1m 12s",
    startTime: "10:46:19",
    jobs: [
      { id: "test-node16", name: "Test (Node 16)", status: "complete", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 20s", startTime: "10:46:19", state: "normal", exitCode: 0 },
      { id: "test-node18", name: "Test (Node 18)", status: "failed", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "1m 12s", startTime: "10:46:19", state: "normal", exitCode: 1 },
      { id: "test-node20", name: "Test (Node 20)", status: "pending", command: "npm test", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
    ],
  },
  { id: "bundle", name: "Bundle", type: "command", status: "pending", command: "npm run build", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
  { id: "deploy", name: "Deploy", type: "command", status: "pending", command: "deploy.sh", agent: "ubuntu-latest", queue: "default", duration: "--", startTime: "--", state: "pending", exitCode: null },
];
