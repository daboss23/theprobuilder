// Demo intelligence data powering the TPB Creative Reactor command center.
// This is the curated knowledge layer the platform presents as an AI strategist
// actively working across 20+ years of TPB creative assets.

export interface KpiStat {
  label: string
  value: number
  delta: string
  trend: 'up' | 'down' | 'flat'
}

export const reactorKpis: KpiStat[] = [
  { label: 'Knowledge Assets', value: 2847, delta: '+128', trend: 'up' },
  { label: 'Winning Creatives', value: 412, delta: '+19', trend: 'up' },
  { label: 'Winning Hooks', value: 689, delta: '+34', trend: 'up' },
  { label: 'Frameworks', value: 47, delta: '+3', trend: 'up' },
  { label: 'SOPs', value: 31, delta: '+1', trend: 'up' },
  { label: 'Member Wins', value: 538, delta: '+22', trend: 'up' },
  { label: 'Patterns Identified', value: 96, delta: '+7', trend: 'up' },
  { label: 'Campaign Ideas Ready', value: 24, delta: '+5', trend: 'up' },
]

// Neon accent channel names shared with the command-center UI layer.
export type DataAccent = 'blue' | 'cyan' | 'violet' | 'emerald' | 'pink' | 'amber'

export interface AngleStat {
  name: string
  score: number // 0-100 win index
  campaigns: number
  trend: 'up' | 'down' | 'flat'
  delta: string
  accent: DataAccent
}

export const winningAngles: AngleStat[] = [
  { name: 'Profit', score: 94, campaigns: 61, trend: 'up', delta: '4', accent: 'emerald' },
  { name: 'Systems', score: 88, campaigns: 54, trend: 'up', delta: '4', accent: 'cyan' },
  { name: 'Time Freedom', score: 85, campaigns: 47, trend: 'up', delta: '4', accent: 'blue' },
  { name: 'Leadership', score: 79, campaigns: 38, trend: 'flat', delta: '—', accent: 'pink' },
  { name: 'Cashflow', score: 76, campaigns: 33, trend: 'up', delta: '4', accent: 'amber' },
  { name: 'Growth', score: 71, campaigns: 42, trend: 'down', delta: '2', accent: 'violet' },
  { name: 'Team Accountability', score: 68, campaigns: 29, trend: 'up', delta: '3', accent: 'cyan' },
]

export interface PerformanceSignal {
  label: string
  value: string
  metric: string
  pct: number
  accent: DataAccent
}

// Compact performance read-outs along the foot of the Reactor Dashboard.
export const performanceSignals: PerformanceSignal[] = [
  { label: 'Top Performing Platform', value: 'Facebook', metric: 'ROAS 4.7x', pct: 87, accent: 'blue' },
  { label: 'Best Performing Format', value: 'Video', metric: 'Win Rate 68%', pct: 68, accent: 'emerald' },
  { label: 'Optimal Hook Length', value: '8-12 Words', metric: 'Win Rate 72%', pct: 72, accent: 'violet' },
  { label: 'Peak Engagement Time', value: '7PM - 10PM', metric: 'Win Rate 63%', pct: 63, accent: 'amber' },
]

export interface HeatRow {
  dimension: string
  cells: number[] // intensity 0-100 across months
}

export const heatmapMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

export const creativeHeatmap: HeatRow[] = [
  { dimension: 'Hooks', cells: [62, 71, 80, 88, 92, 94] },
  { dimension: 'Headlines', cells: [55, 60, 74, 70, 82, 86] },
  { dimension: 'Offers', cells: [48, 52, 58, 77, 81, 79] },
  { dimension: 'Creative Formats', cells: [40, 58, 63, 72, 85, 90] },
  { dimension: 'Transformations', cells: [70, 74, 78, 84, 88, 95] },
  { dimension: 'Patterns', cells: [44, 49, 61, 66, 73, 81] },
]

export interface Recommendation {
  campaign: string
  reason: string
  assetsNeeded: string[]
  suggestedHook: string
  confidence: number
  priority: 'High' | 'Medium' | 'Critical'
}

export const recommendations: Recommendation[] = [
  {
    campaign: 'The Profit Leak Campaign',
    reason:
      'Profitability messaging is outperforming growth messaging by 31% across the last 6 cohorts. Margin language is converting builders faster than revenue language.',
    assetsNeeded: ['Founder Video', 'Static Proof Ad', 'Member Testimonial'],
    suggestedHook:
      "Most builders don't have a revenue problem. They have a profit leak.",
    confidence: 92,
    priority: 'Critical',
  },
  {
    campaign: 'The 45-Hour Owner',
    reason:
      'Time-freedom transformations show the highest emotional resonance and save rate. Identity-shift angle is under-utilized vs demand.',
    assetsNeeded: ['Founder Video', 'Day-in-the-life UGC', 'Carousel Story'],
    suggestedHook:
      'You didn’t build a business. You built a job that pays worse than your foreman.',
    confidence: 87,
    priority: 'High',
  },
  {
    campaign: 'Systems Before Scale',
    reason:
      'Contrarian "stop scaling" angle is breaking pattern fatigue. Strong fit with operations-pain segment from sales calls.',
    assetsNeeded: ['Static Contrarian Ad', 'VSL Opener', 'Whiteboard Video'],
    suggestedHook: 'Scaling a broken business just breaks it faster.',
    confidence: 81,
    priority: 'High',
  },
]

export interface ReactorStatus {
  label: string
  value: number
  total: number
}

export const reactorStatus: ReactorStatus[] = [
  { label: 'Assets Ingested', value: 2847, total: 3000 },
  { label: 'Patterns Extracted', value: 96, total: 120 },
  { label: 'Campaign Concepts Generated', value: 184, total: 200 },
  { label: 'Recommendations Ready', value: 24, total: 24 },
]

/* ----------------------------- Knowledge Vault ---------------------------- */

export interface UploadCard {
  title: string
  accept: string
  icon: string
}

export const uploadCards: UploadCard[] = [
  { title: 'Upload Winning Creative', accept: 'Video / Image', icon: 'Clapperboard' },
  { title: 'Upload Winning Copy', accept: 'Text / Doc', icon: 'FileText' },
  { title: 'Upload Hook Framework', accept: 'Doc / PDF', icon: 'Anchor' },
  { title: 'Upload Creative Framework', accept: 'Doc / PDF', icon: 'LayoutTemplate' },
  { title: 'Upload Offer Framework', accept: 'Doc / PDF', icon: 'Tag' },
  { title: 'Upload VSL Framework', accept: 'Doc / Script', icon: 'Film' },
  { title: 'Upload Creative SOP', accept: 'Doc / PDF', icon: 'ListChecks' },
  { title: 'Upload Member Win', accept: 'Story / Video', icon: 'Trophy' },
  { title: 'Upload Event Content', accept: 'Video / Deck', icon: 'CalendarDays' },
  { title: 'Upload Podcast Transcript', accept: 'Audio / Text', icon: 'Mic' },
  { title: 'Upload Webinar', accept: 'Video / Deck', icon: 'MonitorPlay' },
]

export interface VaultCategory {
  group: string
  items: { name: string; count: number }[]
}

export const vaultCategories: VaultCategory[] = [
  {
    group: 'Creative Assets',
    items: [
      { name: 'Winning Ads', count: 214 },
      { name: 'Winning Videos', count: 137 },
      { name: 'Winning Statics', count: 188 },
      { name: 'Event Footage', count: 42 },
    ],
  },
  {
    group: 'Copy Assets',
    items: [
      { name: 'Hooks', count: 689 },
      { name: 'Headlines', count: 421 },
      { name: 'Primary Text', count: 356 },
      { name: 'VSLs', count: 28 },
      { name: 'Webinar Scripts', count: 19 },
    ],
  },
  {
    group: 'Framework Assets',
    items: [
      { name: 'Hook Frameworks', count: 14 },
      { name: 'Creative Frameworks', count: 12 },
      { name: 'Offer Frameworks', count: 11 },
      { name: 'VSL Frameworks', count: 10 },
    ],
  },
  {
    group: 'SOP Assets',
    items: [
      { name: 'Creative SOPs', count: 9 },
      { name: 'Story Mining SOPs', count: 7 },
      { name: 'Content SOPs', count: 8 },
      { name: 'Member Interview SOPs', count: 7 },
    ],
  },
  {
    group: 'Transformation Assets',
    items: [
      { name: 'Member Wins', count: 538 },
      { name: 'Testimonials', count: 312 },
      { name: 'Success Stories', count: 196 },
    ],
  },
  {
    group: 'Authority Assets',
    items: [
      { name: 'Podcasts', count: 88 },
      { name: 'Events', count: 24 },
      { name: 'Webinars', count: 41 },
      { name: 'Presentations', count: 33 },
    ],
  },
]

/* --------------------------- Research Intelligence ------------------------ */

export const internalSources = [
  { name: 'Sales Calls', count: 1240, signal: 91 },
  { name: 'Coaching Calls', count: 860, signal: 84 },
  { name: 'Applications', count: 3100, signal: 72 },
  { name: 'Member Interviews', count: 214, signal: 95 },
  { name: 'Event Recordings', count: 96, signal: 68 },
  { name: 'CRM Notes', count: 5400, signal: 61 },
]

export const externalSources = [
  { name: 'Reddit', count: 420, signal: 77 },
  { name: 'Forums', count: 188, signal: 64 },
  { name: 'Competitors', count: 142, signal: 70 },
  { name: 'Reviews', count: 612, signal: 81 },
  { name: 'YouTube', count: 305, signal: 66 },
]

export interface ResearchOutput {
  type: string
  items: string[]
}

export const researchOutputs: ResearchOutput[] = [
  {
    type: 'Pain Points',
    items: [
      'Working 70+ hour weeks with no exit',
      'Margins eroding despite record revenue',
      'Business cannot run without the owner',
      'Cashflow gaps between progress payments',
    ],
  },
  {
    type: 'Desires',
    items: [
      'Predictable profit on every job',
      'A leadership team that owns outcomes',
      'Weekends back without losing control',
    ],
  },
  {
    type: 'Objections',
    items: [
      "I don't have time to implement systems",
      'My business is different / too custom',
      'Coaching is for builders who are struggling',
    ],
  },
  {
    type: 'Beliefs',
    items: [
      'More revenue will fix the profit problem',
      'Only I can deliver at this quality',
      'Hiring senior people is too expensive',
    ],
  },
  {
    type: 'Language',
    items: ['"flat out"', '"chasing my tail"', '"the wheels fall off"', '"jobs going backwards"'],
  },
  {
    type: 'Market Trends',
    items: [
      'Rising material costs squeezing fixed-price jobs',
      'Skilled-labour shortage driving delays',
      'Shift toward fixed-margin contracts',
    ],
  },
]

/* ----------------------- Transformation Intelligence ---------------------- */

export interface Transformation {
  member: string
  before: { label: string; value: string }[]
  after: { label: string; value: string }[]
  type: string
  emotional: string
  financial: string
  identity: string
  angles: string[]
}

export const transformations: Transformation[] = [
  {
    member: 'Custom Home Builder — VIC',
    before: [
      { label: 'Hours', value: '70 hr weeks' },
      { label: 'Margin', value: '12%' },
      { label: 'Structure', value: 'Owner dependent' },
    ],
    after: [
      { label: 'Hours', value: '45 hr weeks' },
      { label: 'Margin', value: '22%' },
      { label: 'Structure', value: 'Leadership team' },
    ],
    type: 'Profit + Time Freedom',
    emotional: 'Relief from burnout, presence with family',
    financial: '+$340k net profit in 14 months',
    identity: 'From operator to owner',
    angles: ['Profit Leak', 'The 45-Hour Owner', 'Systems Before Scale'],
  },
  {
    member: 'Renovations Co — QLD',
    before: [
      { label: 'Revenue', value: '$2.1M' },
      { label: 'Net', value: '4%' },
      { label: 'Team', value: 'No structure' },
    ],
    after: [
      { label: 'Revenue', value: '$3.4M' },
      { label: 'Net', value: '18%' },
      { label: 'Team', value: 'PM + Estimator' },
    ],
    type: 'Systems + Leadership',
    emotional: 'Confidence, control over the calendar',
    financial: '+$540k net profit, 18% margin',
    identity: 'From foreman to CEO',
    angles: ['Systems Pattern', 'Leadership Story', 'Margin Math'],
  },
]

/* --------------------------- Creative Intelligence ------------------------ */

export interface CreativeAnalysis {
  type: string
  count: number
  winRate: number
  structure: string
  visualStyle: string
  opening: string
  cta: string
}

export const creativeAnalyses: CreativeAnalysis[] = [
  {
    type: 'Founder Video',
    count: 96,
    winRate: 71,
    structure: 'Hook → Contrarian belief → Proof → Mechanism → CTA',
    visualStyle: 'Handheld, on-site, natural light, no captions burn-in',
    opening: 'Direct-to-camera pattern interrupt in first 1.5s',
    cta: 'Soft DM / comment trigger',
  },
  {
    type: 'Static Proof Ad',
    count: 188,
    winRate: 64,
    structure: 'Big number → Member name → 1-line transformation',
    visualStyle: 'Dark bg, bold numerals, single accent color',
    opening: 'Specific profit figure as headline',
    cta: 'Learn the system',
  },
  {
    type: 'Testimonial Video',
    count: 74,
    winRate: 58,
    structure: 'Before pain → Turning point → After result',
    visualStyle: 'Interview framing, b-roll of job sites',
    opening: 'Member states their old hours/margin',
    cta: 'Apply to work with us',
  },
  {
    type: 'Event Video',
    count: 42,
    winRate: 49,
    structure: 'Energy montage → Key insight → Community proof',
    visualStyle: 'High-energy cuts, crowd, stage',
    opening: 'Room reaction shot',
    cta: 'Get on the waitlist',
  },
]

/* ----------------------------- Copy Intelligence -------------------------- */

export interface CopyItem {
  text: string
  metric: string
  angle: string
}

export const topHooks: CopyItem[] = [
  { text: "Most builders don't have a revenue problem. They have a profit leak.", metric: '4.2% CTR', angle: 'Profit' },
  { text: 'You built a job that pays worse than your foreman.', metric: '3.8% CTR', angle: 'Time Freedom' },
  { text: 'Scaling a broken business just breaks it faster.', metric: '3.6% CTR', angle: 'Systems' },
  { text: 'Your margin is hiding in plain sight.', metric: '3.3% CTR', angle: 'Cashflow' },
]

export const topHeadlines: CopyItem[] = [
  { text: 'From 12% to 22% margin in 14 months — without taking on more jobs.', metric: '2.1x ROAS', angle: 'Profit' },
  { text: 'The builders working 45-hour weeks aren’t working harder. They’re working different.', metric: '1.9x ROAS', angle: 'Time Freedom' },
  { text: 'Build the team that builds the business.', metric: '1.7x ROAS', angle: 'Leadership' },
]

export const topOffers: CopyItem[] = [
  { text: 'The Profit System Audit — find your leak in 30 minutes.', metric: '38% book rate', angle: 'Profit' },
  { text: 'Leadership Blueprint workshop for builders doing $2M+.', metric: '29% book rate', angle: 'Leadership' },
  { text: 'The 90-Day Systems Sprint.', metric: '24% book rate', angle: 'Systems' },
]

/* ---------------------------- Pattern Intelligence ------------------------ */

export interface Pattern {
  name: string
  hook: string
  headline: string
  creativeStyle: string
  transformation: string
  offer: string
  cta: string
  notes: string
  strength: number
}

export const patterns: Pattern[] = [
  {
    name: 'Profit Pattern',
    hook: "Most builders don't have a revenue problem. They have a profit leak.",
    headline: 'From 12% to 22% margin without taking on more jobs.',
    creativeStyle: 'Static proof ad, bold numerals',
    transformation: 'Low margin → predictable profit',
    offer: 'Profit System Audit',
    cta: 'Find your leak',
    notes: 'Highest win index. Pairs best with member profit numbers.',
    strength: 94,
  },
  {
    name: 'Systems Pattern',
    hook: 'Scaling a broken business just breaks it faster.',
    headline: 'Systems before scale.',
    creativeStyle: 'Whiteboard / founder video',
    transformation: 'Chaos → repeatable operations',
    offer: '90-Day Systems Sprint',
    cta: 'Build your system',
    notes: 'Strong with operations-pain segment.',
    strength: 88,
  },
  {
    name: 'Time Freedom Pattern',
    hook: 'You built a job that pays worse than your foreman.',
    headline: 'The 45-hour owner.',
    creativeStyle: 'Day-in-the-life UGC',
    transformation: '70 hr weeks → 45 hr weeks',
    offer: 'Owner Freedom Roadmap',
    cta: 'Get your time back',
    notes: 'Highest emotional resonance + save rate.',
    strength: 85,
  },
  {
    name: 'Authority Pattern',
    hook: '20 years. 500+ builders. One system.',
    headline: 'The program builders actually finish.',
    creativeStyle: 'Event montage',
    transformation: 'Skeptic → believer',
    offer: 'Waitlist',
    cta: 'See the proof',
    notes: 'Use to warm cold audiences before profit angle.',
    strength: 77,
  },
  {
    name: 'Transformation Pattern',
    hook: 'Same business. Different owner.',
    headline: 'What changed wasn’t the market.',
    creativeStyle: 'Before/after testimonial',
    transformation: 'Owner-dependent → leadership team',
    offer: 'Apply',
    cta: 'Read the story',
    notes: 'Best mid-funnel asset.',
    strength: 82,
  },
  {
    name: 'Contrarian Pattern',
    hook: 'Stop trying to grow.',
    headline: 'The advice that doubled their margin.',
    creativeStyle: 'Founder direct-to-camera',
    transformation: 'Growth obsession → profit focus',
    offer: 'Profit System Audit',
    cta: 'Hear me out',
    notes: 'Breaks pattern fatigue. Rotate in quarterly.',
    strength: 79,
  },
]

/* ----------------------------- Creative Learnings ------------------------- */

export interface Learning {
  insight: string
  evidence: string
  recommendation: string
}

export const learnings: Learning[] = [
  {
    insight: 'Founder videos outperform talking-head interviews.',
    evidence: '71% win rate vs 58% across 170 creatives in the last 3 cohorts.',
    recommendation: 'Default new concepts to founder-led, on-site delivery.',
  },
  {
    insight: 'Specific profit numbers outperform vague claims.',
    evidence: 'Ads with a dollar/margin figure had 2.1x ROAS vs 1.3x for generic.',
    recommendation: 'Always lead with a real member figure in the hook or headline.',
  },
  {
    insight: 'Transformation stories outperform feature messaging.',
    evidence: 'Story-led creatives held attention 40% longer (avg watch time).',
    recommendation: 'Frame the mechanism inside a member transformation arc.',
  },
  {
    insight: 'Member wins outperform generic promises.',
    evidence: 'Named-member proof ads booked 38% vs 21% for promise-led.',
    recommendation: 'Mine new member wins monthly to refresh proof inventory.',
  },
]

/* --------------------------- Campaign Reactor ----------------------------- */

export const reactorInputs = [
  'Research Intelligence',
  'Transformation Intelligence',
  'Creative Intelligence',
  'Copy Intelligence',
  'Frameworks',
  'SOPs',
  'Patterns',
]

export const reactorOutputTypes = [
  'Hooks',
  'Headlines',
  'Primary Text',
  'VSL Openers',
  'Static Concepts',
  'Video Concepts',
  'Founder Concepts',
  'Testimonial Concepts',
  'Event Concepts',
  'Campaign Concepts',
]
