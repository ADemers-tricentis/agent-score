import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SCENES } from "./scenes";
import { brand } from "./theme";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Reveal } from "./scenes/Reveal";
import { Dimensions } from "./scenes/Dimensions";
import { Attribution } from "./scenes/Attribution";
import { Flow } from "./scenes/Flow";
import { CTA } from "./scenes/CTA";

const COMPONENTS = {
  hook: Hook,
  problem: Problem,
  reveal: Reveal,
  dimensions: Dimensions,
  attribution: Attribution,
  flow: Flow,
  cta: CTA,
} as const;

export const Explainer: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: brand.navyDeep }}>
      {SCENES.map((scene) => {
        const start = from;
        from += scene.durationInFrames;
        const SceneComponent = COMPONENTS[scene.id];
        return (
          <Sequence
            key={scene.id}
            from={start}
            durationInFrames={scene.durationInFrames}
          >
            <SceneComponent durationInFrames={scene.durationInFrames} />
            <Sequence from={scene.audioDelay}>
              <Audio src={staticFile(scene.audio)} volume={1} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
