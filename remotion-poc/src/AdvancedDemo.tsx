import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Series,
  Sequence,
} from 'remotion';

const FONT = 'Helvetica, Arial, sans-serif';
const AMBER = '#f59e0b';
const BG = '#0a0a0a';

const Glow: React.FC<{ x?: number; y?: number; intensity?: number }> = ({
  x = 50,
  y = 40,
  intensity = 0.5,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at ${x}% ${y}%, rgba(245,158,11,${intensity}) 0%, rgba(10,10,10,0) 60%)`,
    }}
  />
);

const useFade = (inAt = 8, outAt?: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const o = outAt ?? durationInFrames - 12;
  const into = interpolate(frame, [inAt, inAt + 16], [0, 1], { extrapolateRight: 'clamp' });
  const outo = interpolate(frame, [o, o + 12], [1, 0], { extrapolateLeft: 'clamp' });
  return Math.min(into, outo);
};

const useRise = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  return interpolate(s, [0, 1], [50, 0]);
};

/* Scene 1 — Title */
const SceneTitle: React.FC = () => {
  const opacity = useFade();
  const y = useRise();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Glow intensity={0.45} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: FONT, fontSize: 30, letterSpacing: 8, color: AMBER, fontWeight: 700, marginBottom: 28 }}>
          THE PRO BUILDER
        </div>
        <div style={{ fontFamily: FONT, fontSize: 92, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.05, padding: '0 80px' }}>
          Creative Reactor
        </div>
        <div style={{ fontFamily: FONT, fontSize: 34, color: 'rgba(255,255,255,0.55)', marginTop: 30, letterSpacing: 2 }}>
          Engineered For Performance.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 2 — The problem */
const SceneProblem: React.FC = () => {
  const opacity = useFade();
  const y = useRise();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Glow x={30} y={70} intensity={0.3} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'flex-start', padding: 90, opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: FONT, fontSize: 30, color: AMBER, letterSpacing: 4, marginBottom: 24 }}>THE PROBLEM</div>
        <div style={{ fontFamily: FONT, fontSize: 72, fontWeight: 800, color: '#fff', lineHeight: 1.15 }}>
          What should we<br />create next?
        </div>
        <div style={{ fontFamily: FONT, fontSize: 36, color: 'rgba(255,255,255,0.6)', marginTop: 36, lineHeight: 1.4 }}>
          20+ years of winning assets,<br />locked in folders nobody reads.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 3 — The pipeline (animated steps) */
const PipelineStep: React.FC<{ index: number; label: string; sub: string }> = ({ index, label, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - 10 - index * 14, fps, config: { damping: 200 } });
  const opacity = s;
  const x = interpolate(s, [0, 1], [-60, 0]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, opacity, transform: `translateX(${x}px)`, marginBottom: 30 }}>
      <div style={{ width: 70, height: 70, borderRadius: 16, background: 'rgba(245,158,11,0.15)', border: `2px solid ${AMBER}`, color: AMBER, fontFamily: FONT, fontSize: 36, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {index + 1}
      </div>
      <div>
        <div style={{ fontFamily: FONT, fontSize: 44, fontWeight: 700, color: '#fff' }}>{label}</div>
        <div style={{ fontFamily: FONT, fontSize: 28, color: 'rgba(255,255,255,0.55)' }}>{sub}</div>
      </div>
    </div>
  );
};

const ScenePipeline: React.FC = () => {
  const opacity = useFade(4);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Glow x={70} y={30} intensity={0.28} />
      <AbsoluteFill style={{ justifyContent: 'center', padding: 90, opacity }}>
        <div style={{ fontFamily: FONT, fontSize: 30, color: AMBER, letterSpacing: 4, marginBottom: 40 }}>HOW IT WORKS</div>
        <PipelineStep index={0} label="Knowledge Vault" sub="Every winning asset, embedded & searchable" />
        <PipelineStep index={1} label="Campaign Reactor" sub="Agent reasons over what already worked" />
        <PipelineStep index={2} label="AI Oven" sub="Generates images & video clips" />
        <PipelineStep index={3} label="Remotion Counter" sub="Brands, captions & exports finished ads" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 4 — Sample output ad (the "counter" result) */
const SceneOutput: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = useFade();
  const y = useRise();
  const glow = interpolate(frame, [0, 90], [0.3, 0.6]);
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Glow intensity={glow} y={35} />
      <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 70, opacity }}>
        <div style={{ fontFamily: FONT, fontSize: 26, letterSpacing: 6, color: AMBER, fontWeight: 700 }}>THE PRO BUILDER</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: 80, opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: FONT, fontSize: 80, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.12 }}>
          Stop guessing.<br />Start compounding.
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 110, opacity }}>
        <div style={{ fontFamily: FONT, fontSize: 28, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>↑ a finished ad, generated in-house</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* Scene 5 — Close */
const SceneClose: React.FC = () => {
  const opacity = useFade();
  const y = useRise();
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Glow intensity={0.5} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: FONT, fontSize: 64, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.15, padding: '0 80px' }}>
          Own the oven.<br />Own the counter.<br />
          <span style={{ color: AMBER }}>Own the library.</span>
        </div>
        <div style={{ fontFamily: FONT, fontSize: 30, color: 'rgba(255,255,255,0.55)', marginTop: 40, letterSpacing: 3 }}>
          THE PRO BUILDER · CREATIVE REACTOR
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const AdvancedDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Series>
        <Series.Sequence durationInFrames={120}><SceneTitle /></Series.Sequence>
        <Series.Sequence durationInFrames={120}><SceneProblem /></Series.Sequence>
        <Series.Sequence durationInFrames={180}><ScenePipeline /></Series.Sequence>
        <Series.Sequence durationInFrames={150}><SceneOutput /></Series.Sequence>
        <Series.Sequence durationInFrames={120}><SceneClose /></Series.Sequence>
      </Series>
      {/* progress bar across whole video */}
      <Sequence>
        <ProgressBar />
      </Sequence>
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const w = interpolate(frame, [0, durationInFrames], [0, 100]);
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ height: 8, width: `${w}%`, background: AMBER }} />
    </AbsoluteFill>
  );
};
