// AUTO-GENERATED STUB for llm-catalog/api - placeholder exports only, no real HTTP calls.

export type {
  LLMInferenceCreate,
  LLMInferenceOut,
  LLMInferenceUpdate,
  TestConnectionIn,
} from "@/back-office/llm-catalog/schema";

export type LLMInferenceSelectableOut = any;
export type TestConnectionOut = any;
export interface ListInferencesParams { [key: string]: any }

export type LlmUsageRowOut = any;
export type LlmUsageListOut = any;
export type LlmUsageSummaryOut = any;
export type LlmUsagePayloadOut = any;
export interface UsageFilters { [key: string]: any }
export interface ListUsageParams { [key: string]: any }

export const LLM_CATALOG_ROUTES = {
  list: "/admin/llm-inferences",
  create: "/admin/llm-inferences",
  detail: "/admin/llm-inferences/{inference_id}",
  update: "/admin/llm-inferences/{inference_id}",
  remove: "/admin/llm-inferences/{inference_id}",
  restore: "/admin/llm-inferences/{inference_id}/restore",
  setDefault: "/admin/llm-inferences/{inference_id}/default",
};

export function listInferences(...args: any[]): any { throw new Error("stub: listInferences not implemented"); }
export function getInference(...args: any[]): any { throw new Error("stub: getInference not implemented"); }
export function createInference(...args: any[]): any { throw new Error("stub: createInference not implemented"); }
export function updateInference(...args: any[]): any { throw new Error("stub: updateInference not implemented"); }
export function deleteInference(...args: any[]): any { throw new Error("stub: deleteInference not implemented"); }
export function restoreInference(...args: any[]): any { throw new Error("stub: restoreInference not implemented"); }
export function setDefaultInference(...args: any[]): any { throw new Error("stub: setDefaultInference not implemented"); }
export function testConnection(...args: any[]): any { throw new Error("stub: testConnection not implemented"); }
export function listSelectableInferences(...args: any[]): any { throw new Error("stub: listSelectableInferences not implemented"); }
export function listLlmUsage(...args: any[]): any { throw new Error("stub: listLlmUsage not implemented"); }
export function getLlmUsageSummary(...args: any[]): any { throw new Error("stub: getLlmUsageSummary not implemented"); }
export function getLlmUsageRow(...args: any[]): any { throw new Error("stub: getLlmUsageRow not implemented"); }
export function getLlmUsagePayload(...args: any[]): any { throw new Error("stub: getLlmUsagePayload not implemented"); }

export const inferencesListQueryOptions: any = undefined;
export const inferenceQueryOptions: any = undefined;
export const selectableInferencesQueryOptions: any = undefined;
export const usageListQueryOptions: any = undefined;
export const usageSummaryQueryOptions: any = undefined;
export const usageRowQueryOptions: any = undefined;
export const usagePayloadQueryOptions: any = undefined;
