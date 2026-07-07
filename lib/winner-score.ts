// Winner score — a single blended "how many × the account average" number for a
// live ad, so the "what should I iterate on" picker can rank winners at a glance
// (the competitor dashboard's "Nx badge", 1.0× = average) instead of eyeballing
// four separate metrics. Paired with a spend/volume confidence flag so a 5×
// score on $37 of spend reads as LOW, not a winner to clone.
//
// Pure + framework-agnostic: computed once at Meta ingest and stored in the
// outcome's metrics, then read by ORACLE and the Our Winners tab. No SDK, no DB.

export interface WinnerScoreInput {
  ctr?: number
  roas?: number
  /** Cost per lead — lower is better, so it's inverted in the blend. */
  cpl?: number
  spend?: number
  impressions?: number
}

/** Cohort medians the ad is scored against (its own account/objective). */
export interface CohortMedians {
  ctr: number
  roas: number
  cpl?: number
}

export interface WinnerScore {
  /** Blended performance vs the cohort median. 1.0 = average. */
  score: number
  /** Statistical confidence in the score, driven by spend + impression volume. */
  confidence: 'low' | 'high'
  /** Display band, e.g. "2.31x". */
  band: string
}

export interface WinnerScoreOptions {
  /** Impressions below this → low confidence (default 1000). */
  impressionsFloor?: number
  /** Spend at/above this alone earns high confidence (default 250). */
  spendFloor?: number
  /** Upper clamp so one wild ratio can't dominate the blend (default 9.99). */
  maxScore?: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * Blend the available ratios of an ad's metrics to its cohort medians into one
 * score. CTR and ROAS are higher-is-better; CPL is inverted. Missing metrics are
 * simply skipped — the score averages whatever signal exists, defaulting to 1.0
 * (average) when there is nothing to compare.
 */
export function computeWinnerScore(
  ad: WinnerScoreInput,
  medians: CohortMedians,
  opts: WinnerScoreOptions = {},
): WinnerScore {
  const maxScore = opts.maxScore ?? 9.99
  const impressionsFloor = opts.impressionsFloor ?? 1000
  const spendFloor = opts.spendFloor ?? 250

  const ratios: number[] = []
  if (medians.ctr > 0 && (ad.ctr ?? 0) > 0) ratios.push(ad.ctr! / medians.ctr)
  if (medians.roas > 0 && (ad.roas ?? 0) > 0) ratios.push(ad.roas! / medians.roas)
  if ((medians.cpl ?? 0) > 0 && (ad.cpl ?? 0) > 0) ratios.push(medians.cpl! / ad.cpl!)

  const raw = ratios.length ? ratios.reduce((s, r) => s + r, 0) / ratios.length : 1
  const score = round2(Math.min(Math.max(raw, 0), maxScore))

  const confidence: WinnerScore['confidence'] =
    (ad.impressions ?? 0) >= impressionsFloor || (ad.spend ?? 0) >= spendFloor ? 'high' : 'low'

  return { score, confidence, band: `${score.toFixed(2)}x` }
}

/** Format a stored score number as its display band, e.g. 2.3 → "2.30x". */
export function formatBand(score: number | undefined | null): string {
  const n = typeof score === 'number' && Number.isFinite(score) ? score : 1
  return `${n.toFixed(2)}x`
}
