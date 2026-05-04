export type StepEventType =
  | "step_start"
  | "step_output"
  | "step_complete"
  | "step_error"
  | "workflow_complete"
  | "workflow_error"
  | "workflow_outcome";

export interface StepEvent {
  type: StepEventType;
  stepId?: string;
  label?: string;
  content?: string;
  duration?: string;
  error?: string;
  summary?: string;
}

export type AutomationRunner = (
  input: Record<string, unknown>
) => AsyncGenerator<StepEvent>;
