import { Slide01Title } from "../slides/Slide01Title";
import { Slide02Thesis } from "../slides/Slide02Thesis";
import { Slide03MarketMap } from "../slides/Slide03MarketMap";
import { Slide04Neighbors } from "../slides/Slide04Neighbors";
import { Slide05CompareScoring } from "../slides/Slide05CompareScoring";
import { Slide06CompareEnterprise } from "../slides/Slide06CompareEnterprise";
import {
  Slide07ZeroSetup,
  Slide08DefensibleAnswer,
  Slide09LargeTrace,
  Slide10EcosystemHook,
} from "../slides/Slide07to10Differentiators";
import {
  Slide11NoAuth,
  Slide12CloudOnly,
  Slide13NoSdk,
  Slide14NoSimulation,
  Slide15NoGuardrails,
  Slide16Maturity,
} from "../slides/Slide11to16Gaps";
import { Slide17EffortSequencing } from "../slides/Slide17EffortSequencing";
import { Slide18Positioning } from "../slides/Slide18Positioning";
import {
  Slide19LeadWithFeatures,
  Slide20WhatToMeasure,
  Slide21SimulationGuardrails,
  Slide22McpCapabilities,
  Slide23EnterpriseReadiness,
  Slide24FailureAttribution,
} from "../slides/Slide19to24Recommendations";
import { Slide25WatchItem } from "../slides/Slide25WatchItem";
import { Slide26Closing } from "../slides/Slide26Closing";

// Ordered 1-indexed registry of every slide in the deck. Both the
// interactive /deck/:n viewer and the /print export route render off of
// this single list, so slide order only ever needs to change here.
export const SLIDES: React.FC[] = [
  Slide01Title,
  Slide02Thesis,
  Slide03MarketMap,
  Slide04Neighbors,
  Slide05CompareScoring,
  Slide06CompareEnterprise,
  Slide07ZeroSetup,
  Slide08DefensibleAnswer,
  Slide09LargeTrace,
  Slide10EcosystemHook,
  Slide11NoAuth,
  Slide12CloudOnly,
  Slide13NoSdk,
  Slide14NoSimulation,
  Slide15NoGuardrails,
  Slide16Maturity,
  Slide17EffortSequencing,
  Slide18Positioning,
  Slide19LeadWithFeatures,
  Slide20WhatToMeasure,
  Slide21SimulationGuardrails,
  Slide22McpCapabilities,
  Slide23EnterpriseReadiness,
  Slide24FailureAttribution,
  Slide25WatchItem,
  Slide26Closing,
];

export const SLIDE_COUNT = SLIDES.length;
