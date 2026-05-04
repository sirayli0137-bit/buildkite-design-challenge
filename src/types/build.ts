export type JobState = "normal" | "pending" | "scheduled" | "retried";
export type StepStatus = "complete" | "in-progress" | "failed" | "pending";
export type StepType = "command" | "parallel" | "matrix" | "group";

export interface Job {
  id: string;
  name: string;
  status: StepStatus;
  command: string;
  agent: string;
  queue: string;
  duration: string;
  startTime: string;
  state: JobState;
  exitCode: number | null;
}

export interface BuildStep {
  id: string;
  name: string;
  type: StepType;
  status: StepStatus;
  command?: string;
  agent?: string;
  queue?: string;
  duration?: string;
  startTime?: string;
  state?: JobState;
  exitCode?: number | null;
  jobs?: Job[];
}
