// U.S. federal income tax withholding for 2026 (IRS Publication 15-T, Worksheet 1A, Annual Percentage Method),
// 2026 income tax brackets (Rev. Proc. 2025-32) and 2026 FICA. Maintained by PaycheckGauge: https://paycheckgauge.com

export type FilingStatus = 'single' | 'married' | 'hoh'

/** Table row: from `over`, tax is `base` plus `rate` times the amount over `over`. */
export interface Bracket { over: number; base: number; rate: number }

const b = (rows: [number, number, number][]): Bracket[] => rows.map(([over, base, rate]) => ({ over, base, rate }))

/** Pub. 15-T 2026, Annual Percentage Method — STANDARD withholding rate schedules (2020+ Form W-4, Step 2 not checked). */
export const STANDARD_SCHEDULES: Record<FilingStatus, Bracket[]> = {
  married: b([[0, 0, 0], [19300, 0, 0.1], [44100, 2480, 0.12], [120100, 11600, 0.22], [230700, 35932, 0.24], [422850, 82048, 0.32], [531750, 116896, 0.35], [788000, 206583.5, 0.37]]),
  single: b([[0, 0, 0], [7500, 0, 0.1], [19900, 1240, 0.12], [57900, 5800, 0.22], [113200, 17966, 0.24], [209275, 41024, 0.32], [263725, 58448, 0.35], [648100, 192979.25, 0.37]]),
  hoh: b([[0, 0, 0], [15550, 0, 0.1], [33250, 1770, 0.12], [83000, 7740, 0.22], [121250, 16155, 0.24], [217300, 39207, 0.32], [271750, 56631, 0.35], [656150, 191171, 0.37]]),
}

/** Pub. 15-T 2026, Annual Percentage Method — Form W-4 STEP 2 CHECKBOX withholding rate schedules. */
export const CHECKBOX_SCHEDULES: Record<FilingStatus, Bracket[]> = {
  married: b([[0, 0, 0], [16100, 0, 0.1], [28500, 1240, 0.12], [66500, 5800, 0.22], [121800, 17966, 0.24], [217875, 41024, 0.32], [272325, 58448, 0.35], [400450, 103291.75, 0.37]]),
  single: b([[0, 0, 0], [8050, 0, 0.1], [14250, 620, 0.12], [33250, 2900, 0.22], [60900, 8983, 0.24], [108938, 20512, 0.32], [136163, 29224, 0.35], [328350, 96489.63, 0.37]]),
  hoh: b([[0, 0, 0], [12075, 0, 0.1], [20925, 885, 0.12], [45800, 3870, 0.22], [64925, 8077.5, 0.24], [112950, 19603.5, 0.32], [140175, 28315.5, 0.35], [332375, 95585.5, 0.37]]),
}

/** Worksheet 1A, line 1g: subtracted when the Step 2 checkbox is NOT checked. */
export const LINE_1G: Record<FilingStatus, number> = { married: 12900, single: 8600, hoh: 8600 }

/** Rev. Proc. 2025-32: 2026 income tax brackets on taxable income. */
export const TAX_BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  single: b([[0, 0, 0.1], [12400, 1240, 0.12], [50400, 5800, 0.22], [105700, 17966, 0.24], [201775, 41024, 0.32], [256225, 58448, 0.35], [640600, 192979.25, 0.37]]),
  married: b([[0, 0, 0.1], [24800, 2480, 0.12], [100800, 11600, 0.22], [211400, 35932, 0.24], [403550, 82048, 0.32], [512450, 116896, 0.35], [768700, 206583.5, 0.37]]),
  hoh: b([[0, 0, 0.1], [17700, 1770, 0.12], [67450, 7740, 0.22], [105700, 16155, 0.24], [201750, 39207, 0.32], [256200, 56631, 0.35], [640600, 191171, 0.37]]),
}
/** Rev. Proc. 2025-32: 2026 standard deduction. */
export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = { single: 16100, married: 32200, hoh: 24150 }

/** 2026 FICA: Social Security wage base $184,500; Additional Medicare Tax withheld above $200,000. */
export const SOCIAL_SECURITY = { rate: 0.062, wageBase: 184500 }
export const MEDICARE = { rate: 0.0145, additionalRate: 0.009, additionalWithholdingThreshold: 200000 }

export function applyBrackets(table: Bracket[], amount: number): number {
  if (amount <= 0) return 0
  let row = table[0]
  for (const r of table) if (amount >= r.over) row = r
  return row.base + (amount - row.over) * row.rate
}

export interface W4 {
  filingStatus: FilingStatus
  /** Step 2 checkbox (multiple jobs or spouse works). */
  step2Checkbox?: boolean
  /** Step 3: total annual credits for dependents. */
  step3Credits?: number
  /** Step 4(a): other annual income. */
  step4aOtherIncome?: number
  /** Step 4(b): annual deductions. */
  step4bDeductions?: number
  /** Step 4(c): extra withholding per pay period. */
  step4cExtraWithholding?: number
}

/**
 * Federal income tax to withhold for one pay period (Pub. 15-T 2026, Worksheet 1A, 2020+ Form W-4).
 * `taxableWagesPerPeriod` is gross pay minus pre-tax deductions (401(k), section 125); `periodsPerYear` is 52, 26, 24, 12…
 * Not rounded: the IRS lets employers round to the nearest dollar.
 */
export function federalWithholding(taxableWagesPerPeriod: number, periodsPerYear: number, w4: W4): number {
  const annual = taxableWagesPerPeriod * periodsPerYear + (w4.step4aOtherIncome ?? 0)
  const adjustment = (w4.step4bDeductions ?? 0) + (w4.step2Checkbox ? 0 : LINE_1G[w4.filingStatus])
  const adjusted = Math.max(0, annual - adjustment)
  const schedules = w4.step2Checkbox ? CHECKBOX_SCHEDULES : STANDARD_SCHEDULES
  const tentative = applyBrackets(schedules[w4.filingStatus], adjusted) / periodsPerYear
  const afterCredits = Math.max(0, tentative - (w4.step3Credits ?? 0) / periodsPerYear)
  return afterCredits + (w4.step4cExtraWithholding ?? 0)
}

/** Employee Social Security and Medicare for a year of wages subject to FICA (single employer). */
export function ficaTaxes(annualFicaWages: number) {
  const w = Math.max(0, annualFicaWages)
  const socialSecurity = Math.min(w, SOCIAL_SECURITY.wageBase) * SOCIAL_SECURITY.rate
  const medicare = w * MEDICARE.rate + Math.max(0, w - MEDICARE.additionalWithholdingThreshold) * MEDICARE.additionalRate
  return { socialSecurity, medicare }
}

/** 2026 federal income tax on a year's income using the standard deduction (no credits). */
export function incomeTax2026(income: number, filingStatus: FilingStatus): number {
  return applyBrackets(TAX_BRACKETS_2026[filingStatus], Math.max(0, income - STANDARD_DEDUCTION_2026[filingStatus]))
}
