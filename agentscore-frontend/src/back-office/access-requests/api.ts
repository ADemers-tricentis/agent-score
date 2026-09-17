// AUTO-GENERATED STUB for access-requests/api - placeholder exports only, no real HTTP calls.
// Every real named export is preserved (typed loosely) so imports resolve at bundle time;
// actual fake data / behavior gets filled in during the data-stripping pass.

export class ApiStatusError extends Error {}
export type AccessRequestState = "waiting" | "declined" | "approved";
export interface ExistingUserRef { [key: string]: any }
export interface AccessRequestSummary { [key: string]: any }
export interface AccessRequestListResponse { [key: string]: any }
export interface ListAccessRequestsParams { [key: string]: any }
export function listAccessRequests(...args: any[]): any { throw new Error("stub: listAccessRequests not implemented"); }
export function declineAccessRequest(...args: any[]): any { throw new Error("stub: declineAccessRequest not implemented"); }
export function removeAccessRequest(...args: any[]): any { throw new Error("stub: removeAccessRequest not implemented"); }
