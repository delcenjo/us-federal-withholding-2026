// Every row of the IRS Publication 15-T (2026) biweekly Wage Bracket Method table, all six columns.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { federalWithholding, ficaTaxes, incomeTax2026, type FilingStatus } from '../src/index.ts'

type Row = { desde: number; hasta: number; mfj: number; mfj_chk: number; hoh: number; hoh_chk: number; single: number; single_chk: number }
const rows = (JSON.parse(readFileSync(new URL('./irs-15t-2026-biweekly-wage-bracket.json', import.meta.url), 'utf8')) as Row[]).filter((r) => r.hasta > r.desde && r.hasta - r.desde <= 100)

test(`IRS 2026 biweekly wage bracket table (${rows.length} rows × 6 columns)`, () => {
  assert.ok(rows.length > 100)
  for (const r of rows) {
    const mid = (r.desde + r.hasta) / 2
    const w = (filingStatus: FilingStatus, step2Checkbox: boolean) => Math.round(federalWithholding(mid, 26, { filingStatus, step2Checkbox }))
    const msg = `$${r.desde}-$${r.hasta}`
    assert.equal(w('married', false), r.mfj, msg + ' married')
    assert.equal(w('married', true), r.mfj_chk, msg + ' married, Step 2')
    assert.equal(w('hoh', false), r.hoh, msg + ' head of household')
    assert.equal(w('hoh', true), r.hoh_chk, msg + ' head of household, Step 2')
    assert.equal(w('single', false), r.single, msg + ' single')
    assert.equal(w('single', true), r.single_chk, msg + ' single, Step 2')
  }
})

test('Social Security stops at the $184,500 wage base', () => {
  assert.equal(ficaTaxes(300000).socialSecurity, 11439)
})

test('2026 tax on $50,000 single: $33,900 taxable → $3,820', () => {
  assert.equal(incomeTax2026(50000, 'single'), 1240 + 21500 * 0.12)
})
