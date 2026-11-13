# us-federal-withholding-2026

2026 U.S. federal income tax withholding in TypeScript, straight from **IRS Publication 15-T (2026)**, Worksheet 1A (Annual Percentage Method, 2020 or later Form W-4), plus the 2026 income tax brackets and standard deduction (**Rev. Proc. 2025-32**) and 2026 FICA.

- **Tested against every row of the IRS 2026 biweekly Wage Bracket Method table**, all six columns (married, head of household and single, with and without the Step 2 checkbox): `npm test`.
- Zero dependencies. Node 22.18+ runs the TypeScript directly.
- Used in production by the [PaycheckGauge paycheck calculator](https://paycheckgauge.com/), which adds state and local income tax for all 50 states and D.C.

## Usage

```ts
import { federalWithholding, ficaTaxes, incomeTax2026 } from './src/index.ts'

// $2,000 every two weeks, single, 2020+ W-4 with nothing else filled in
federalWithholding(2000, 26, { filingStatus: 'single' }) // 156.15 per paycheck

// Married, Step 2 checked, $4,400 of Step 3 credits (two children under 17)
federalWithholding(3500, 26, { filingStatus: 'married', step2Checkbox: true, step3Credits: 4400 })

ficaTaxes(60000)                 // { socialSecurity: 3720, medicare: 870 }
incomeTax2026(50000, 'single')   // 3820 (standard deduction, no credits)
```

`taxableWagesPerPeriod` is gross pay minus pre-tax deductions (traditional 401(k), section 125 health insurance). The result is not rounded; Publication 15-T allows employers to round to the nearest dollar.

## 2026 figures

| | Single | Married filing jointly | Head of household |
|---|---|---|---|
| Standard deduction | $16,100 | $32,200 | $24,150 |
| Worksheet 1A line 1g | $8,600 | $12,900 | $8,600 |
| Top rate (37%) starts at (tax brackets) | $640,600 | $768,700 | $640,600 |

Social Security: 6.2% up to $184,500 of wages. Medicare: 1.45%, plus 0.9% withheld on wages above $200,000.

## Sources

- IRS Publication 15-T (2026), *Federal Income Tax Withholding Methods*: Annual Percentage Method tables and Worksheet 1A; the biweekly Wage Bracket Method table used in the tests.
- IRS Revenue Procedure 2025-32: 2026 tax rate tables and standard deduction.
- Social Security Administration: 2026 contribution and benefit base.

See the full 2026 tables with a per-paycheck lookup at **[paycheckgauge.com/federal-withholding-tables](https://paycheckgauge.com/federal-withholding-tables/)**, or calculate take-home pay with state taxes at **[paycheckgauge.com](https://paycheckgauge.com/)**.

## License

MIT. Not tax advice: check results against the current IRS publication for your payroll.
