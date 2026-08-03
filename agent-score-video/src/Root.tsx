import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import { UserJourney } from "./scenes/UserJourney";
import { TOTAL_FRAMES } from "./scenes";
import { FPS } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Explainer"
        component={Explainer}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="UserJourney"
        component={UserJourney}
        durationInFrames={100}
        fps={FPS}
        width={1920}
        height={1150}
      />
    </>
  );
};
