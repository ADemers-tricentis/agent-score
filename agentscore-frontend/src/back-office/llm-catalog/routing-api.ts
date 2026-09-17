// AUTO-GENERATED STUB for llm-catalog/routing-api - placeholder exports only, no real HTTP calls.

export type TaskAssignmentOut = any;
export type InferenceRef = any;

export interface TaskTypeOption {
  value: string;
  label: string;
}

export const ASSIGNABLE_TASK_TYPES: TaskTypeOption[] = [
  { value: "guide_generation", label: "Guide generation" },
];

export function listTaskAssignments(...args: any[]): any { throw new Error("stub: listTaskAssignments not implemented"); }
export function upsertTaskAssignment(...args: any[]): any { throw new Error("stub: upsertTaskAssignment not implemented"); }
export function deleteTaskAssignment(...args: any[]): any { throw new Error("stub: deleteTaskAssignment not implemented"); }

export const taskAssignmentsListQueryOptions: any = undefined;
