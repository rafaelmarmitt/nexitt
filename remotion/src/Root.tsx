import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 5 scenes, 18s total at 30fps -> 540 frames, minus transition overlaps
// We'll target 510 frames (17s)
export const RemotionRoot: React.FC = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={510}
    fps={30}
    width={1920}
    height={1080}
  />
);
