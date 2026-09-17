// AUTO-GENERATED STUB for agents/scoring-api - placeholder exports only, no real HTTP calls.
// Every real named export is preserved (typed loosely) so imports resolve at bundle time;
// actual fake data / behavior gets filled in during the data-stripping pass.

export type ScoringRunOut = any;
export type FailureSummaryItem = any;
export type InferenceRef = any;
export type RunMetricOut = any;
export type BenchmarkConfigOut = any;
export type DiscriminationOut = any;
export type EvalDiscriminationOut = any;
export type FitJobAcceptedOut = any;
export type FitDecisionOut = any;
export type FitDecisionsOut = any;
export type FitDecisionDetailOut = any;
export type ProfileEntryOut = any;
export type AgentCardOut = any;
export type ProfileAdoptIn = any;
export type AdoptableProfilesOut = any;
export type AdoptableProfileOut = any;
export type AdoptableProfileVersionOut = any;
export type DimensionAggregateOut = any;
export type ReadinessOut = any;
export type LabelingProposal = any;
export type GoldenOut = any;
export type LabelDecisionIn = any;
export type RunCreateIn = any;
export type RunCreatedOut = any;
export type DrillThroughInteraction = any;
export type AdvisorRunOut = any;
export type AdvisorRecommendationOut = any;
export type AdvisorCitationGroupOut = any;
export type AdvisorCitationOut = any;
export type AdvisorVerdictRefOut = any;
export type AdvisorBasisOut = any;
export type AdvisorJobAcceptedOut = any;
export type AdvisorRequestOut = any;
export type AdvisorRunListOut = any;
export type AdvisorRequestState = any;
export type AdvisorRequestStage = any;
export type RankedCandidateOut = any;
export type MatchedProfileOut = any;
export type DriftNudgeOut = any;
export type ConfidenceOut = any;
export type TrendPoint = any;
export type EvalTrendPoint = any;
export type VersionTrendPoint = any;
export type VersionGrade = any;
export type ScoringEventOut = any;
export type ScoringEventListOut = any;
export type ScoringEventType = any;
export type ScheduleUpdateIn = any;
export type RunScopeListOut = any;
export type RunInteractionContentOut = any;
export type RunInteractionValueOut = any;
export type RunInteractionSummaryOut = any;
export type RunInteractionListOut = any;
export type RunInteractionEvaluationOut = any;
export type RunInteractionDetailOut = any;
export type RunInteractionEvidenceFilter = any;
export type TraceScoreDetailOut = any;
export type TraceEvalResultOut = any;
export type TraceRunCreateIn = any;
export const scoringKeys: any = undefined;
export function getReadiness(...args: any[]): any { throw new Error("stub: getReadiness not implemented"); }
export const readinessQueryOptions: any = undefined;
export function getBenchmark(...args: any[]): any { throw new Error("stub: getBenchmark not implemented"); }
export function adoptProfile(...args: any[]): any { throw new Error("stub: adoptProfile not implemented"); }
export const benchmarkQueryOptions: any = undefined;
export function getAdoptableProfiles(...args: any[]): any { throw new Error("stub: getAdoptableProfiles not implemented"); }
export const adoptableProfilesQueryOptions: any = undefined;
export interface FitDecisionsParams { [key: string]: any }
export function getFitDecisions(...args: any[]): any { throw new Error("stub: getFitDecisions not implemented"); }
export const fitDecisionsQueryOptions: any = undefined;
export function getFitDecisionDetail(...args: any[]): any { throw new Error("stub: getFitDecisionDetail not implemented"); }
export const fitDecisionDetailQueryOptions: any = undefined;
export interface AccumulatedFitDecisions { [key: string]: any }
export function useAccumulatedFitDecisions(...args: any[]): any { throw new Error("stub: useAccumulatedFitDecisions not implemented"); }
export function getAgentCard(...args: any[]): any { throw new Error("stub: getAgentCard not implemented"); }
export const CARD_POLL_INTERVAL_MS: any = undefined;
export const CARD_POLL_TIMEOUT_MS: any = undefined;
export const cardQueryOptions: any = undefined;
export function regenerateCard(...args: any[]): any { throw new Error("stub: regenerateCard not implemented"); }
export interface ListRunsParams { [key: string]: any }
export type RunsPageOut = any;
export const RUNS_PAGE_LIMIT: any = undefined;
export function listRuns(...args: any[]): any { throw new Error("stub: listRuns not implemented"); }
export function getRun(...args: any[]): any { throw new Error("stub: getRun not implemented"); }
export function triggerRun(...args: any[]): any { throw new Error("stub: triggerRun not implemented"); }
export class TraceRunConflictError extends Error {}
export function getTraceScoreDetail(...args: any[]): any { throw new Error("stub: getTraceScoreDetail not implemented"); }
export function triggerTraceRun(...args: any[]): any { throw new Error("stub: triggerTraceRun not implemented"); }
export function approveRun(...args: any[]): any { throw new Error("stub: approveRun not implemented"); }
export function resumeRun(...args: any[]): any { throw new Error("stub: resumeRun not implemented"); }
export function getRunMetricInteractions(...args: any[]): any { throw new Error("stub: getRunMetricInteractions not implemented"); }
export const RUN_RESULTS_PAGE_LIMIT: any = undefined;
export interface ListRunInteractionsParams { [key: string]: any }
export function listRunInteractions(...args: any[]): any { throw new Error("stub: listRunInteractions not implemented"); }
export function getRunInteraction(...args: any[]): any { throw new Error("stub: getRunInteraction not implemented"); }
export const runsQueryOptions: any = undefined;
export const runQueryOptions: any = undefined;
export const metricInteractionsQueryOptions: any = undefined;
export const runInteractionsQueryOptions: any = undefined;
export const runInteractionQueryOptions: any = undefined;
export class AdvisorTriggerError extends Error {}
export class AdvisorReadError extends Error {}
export function triggerImprovementAdvisor(...args: any[]): any { throw new Error("stub: triggerImprovementAdvisor not implemented"); }
export function triggerImprovementAdvisorForRun(...args: any[]): any { throw new Error("stub: triggerImprovementAdvisorForRun not implemented"); }
export type ListAdvisorRunsParams = any;
export function listAdvisorRuns(...args: any[]): any { throw new Error("stub: listAdvisorRuns not implemented"); }
export const ADVISOR_POLL_INTERVAL_MS: any = undefined;
export const ADVISOR_UNCONFIRMED_AFTER_MS: any = undefined;
export const ADVISOR_LONG_WAIT_AFTER_MS: any = undefined;
export const advisorRunsQueryOptions: any = undefined;
export function getRunTasks(...args: any[]): any { throw new Error("stub: getRunTasks not implemented"); }
export function useRunTasks(...args: any[]): any { throw new Error("stub: useRunTasks not implemented"); }
export function getLabelingQueue(...args: any[]): any { throw new Error("stub: getLabelingQueue not implemented"); }
export function submitLabelDecision(...args: any[]): any { throw new Error("stub: submitLabelDecision not implemented"); }
export function listGoldens(...args: any[]): any { throw new Error("stub: listGoldens not implemented"); }
export const labelingQueueQueryOptions: any = undefined;
export const goldensQueryOptions: any = undefined;
export function postAutoFit(...args: any[]): any { throw new Error("stub: postAutoFit not implemented"); }
export function postUnpin(...args: any[]): any { throw new Error("stub: postUnpin not implemented"); }
export function postDismissDrift(...args: any[]): any { throw new Error("stub: postDismissDrift not implemented"); }
export interface TrendParams { [key: string]: any }
export function getTrend(...args: any[]): any { throw new Error("stub: getTrend not implemented"); }
export function getVersions(...args: any[]): any { throw new Error("stub: getVersions not implemented"); }
export const trendQueryOptions: any = undefined;
export const versionsQueryOptions: any = undefined;
export interface ScoringEventsParams { [key: string]: any }
export const SCORING_EVENT_TYPE_OPTIONS: any = undefined;
export const SCORING_EVENTS_PAGE_LIMIT: any = undefined;
export function getScoringEvents(...args: any[]): any { throw new Error("stub: getScoringEvents not implemented"); }
export function putSchedule(...args: any[]): any { throw new Error("stub: putSchedule not implemented"); }
export const scoringEventsQueryOptions: any = undefined;
