import { Composition } from 'remotion';
import { TpbAd } from './TpbAd';
import { AdvancedDemo } from './AdvancedDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TpbAd"
        component={TpbAd}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ hook: 'Stop guessing what to build next.' }}
      />
      <Composition
        id="AdvancedDemo"
        component={AdvancedDemo}
        durationInFrames={690}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
