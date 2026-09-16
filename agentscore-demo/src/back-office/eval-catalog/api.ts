// AUTO-GENERATED STUB for eval-catalog/api - placeholder exports only, no real HTTP calls.
// Every real named export is preserved (typed loosely) so imports resolve at bundle time;
// actual fake data / behavior gets filled in during the data-stripping pass.

export type EvalDefinitionRead = any;
export type EvalDefinitionCreate = any;
export type EvalDefinitionPatch = any;
export type EvalVersionRead = any;
export type EvalVersionCreate = any;
export type DimensionRead = any;
export type DimensionCreate = any;
export type DimensionPatch = any;
export type DimensionEvalsUpdate = any;
export type ProfileRead = any;
export type ProfileCreate = any;
export type ProfileVersionRead = any;
export type ProfileVersionCreate = any;

export interface ListEvalsParams { [key: string]: any }
export interface ListDimensionsParams { [key: string]: any }
export interface ListProfilesParams { [key: string]: any }

export async function listEvals(...args: any[]): Promise<any> { throw new Error("stub: listEvals not implemented"); }
export async function getEval(evalId: string): Promise<EvalDefinitionRead> { throw new Error("stub: getEval not implemented"); }
export async function patchEval(...args: any[]): Promise<any> { throw new Error("stub: patchEval not implemented"); }
export async function listDimensions(...args: any[]): Promise<any> { throw new Error("stub: listDimensions not implemented"); }
export async function createDimension(...args: any[]): Promise<any> { throw new Error("stub: createDimension not implemented"); }
export async function patchDimension(...args: any[]): Promise<any> { throw new Error("stub: patchDimension not implemented"); }
export async function setDimensionEvals(...args: any[]): Promise<any> { throw new Error("stub: setDimensionEvals not implemented"); }
export async function listProfiles(...args: any[]): Promise<any> { throw new Error("stub: listProfiles not implemented"); }
export async function getProfile(profileId: string): Promise<ProfileRead> { throw new Error("stub: getProfile not implemented"); }
export async function createProfile(...args: any[]): Promise<any> { throw new Error("stub: createProfile not implemented"); }
export async function addProfileVersion(...args: any[]): Promise<any> { throw new Error("stub: addProfileVersion not implemented"); }
export async function patchProfile(...args: any[]): Promise<any> { throw new Error("stub: patchProfile not implemented"); }

export const evalsListQueryOptions: any = undefined;
export const evalQueryOptions: any = undefined;
export const dimensionsListQueryOptions: any = undefined;
export const profilesListQueryOptions: any = undefined;
export const profileQueryOptions: any = undefined;
