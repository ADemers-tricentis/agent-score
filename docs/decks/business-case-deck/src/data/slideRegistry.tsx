import { Slide01Title } from "../slides/Slide01Title";
import { Slide02MarketSignal } from "../slides/Slide02MarketSignal";
import { Slide03Consolidating } from "../slides/Slide03Consolidating";
import { Slide04WhyTricentis } from "../slides/Slide04WhyTricentis";
import { Slide05WhatAgentScoreIs } from "../slides/Slide05WhatAgentScoreIs";
import { Slide06TargetPersona } from "../slides/Slide06TargetPersona";
import { Slide07TargetICP } from "../slides/Slide07TargetICP";
import { Slide08ValueProp } from "../slides/Slide08ValueProp";
import { Slide09ROIMetrics } from "../slides/Slide09ROIMetrics";

// Ordered 1-indexed registry of every slide in the deck. Both the
// interactive /deck/:n viewer and the /print export route render off of
// this single list, so slide order only ever needs to change here.
export const SLIDES: React.FC[] = [
  Slide01Title,
  Slide02MarketSignal,
  Slide03Consolidating,
  Slide04WhyTricentis,
  Slide05WhatAgentScoreIs,
  Slide06TargetPersona,
  Slide07TargetICP,
  Slide08ValueProp,
  Slide09ROIMetrics,
];

export const SLIDE_COUNT = SLIDES.length;
