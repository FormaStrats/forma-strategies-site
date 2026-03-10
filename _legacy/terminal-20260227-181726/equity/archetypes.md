# Equity Research — Universe Model Archetypes

*Last Updated: February 25, 2026*

This document governs how financial models are built, which valuation methods apply, and what assumptions matter most for each company in the coverage universe. Read this before populating any `_Financial_Model.xlsx`.

---

## Archetype Definitions & Valuation Methodology

---

### 1. Compounder Platform

**Intended For:** Durable large-cap businesses with scale economics, pricing power, recurring revenue, and demonstrated ability to compound returns on invested capital (ROIC) above cost of capital for extended periods.

**Characteristics:**
- Revenue growth: 6–20% CAGR with high visibility
- Gross margins: typically 40–80%+
- Generates substantial free cash flow; capital return via buybacks and/or dividends
- ROIC sustainably above 15%; often 25–50%+
- Business model is platform-like: switching costs, network effects, or ecosystem lock-in

**Model Structure:**
- 5-year explicit forecast period + terminal value
- Revenue modeled by segment (don't use single-line revenue)
- Operating leverage modeled explicitly: gross margin expansion, SG&A leverage, R&D as % of revenue declining
- FCF conversion rate tracked (FCF / Net Income — should be >90% for quality compounders)
- Capital return: model buybacks reducing share count, normalize EPS impact
- Terminal growth rate: 3–5% (reflects pricing power + market share maintenance)

**Primary Valuation Methods:**
- DCF (WACC 8–10%, terminal growth 3–5%): gives intrinsic value anchor
- EV/EBIT (NTM and 2-year forward): cross-check vs. sector peers
- NTM P/E: for market-convention comps
- FCF Yield: most useful for capital allocation decisions

**Key Model Assumptions to Sensitize:**
- Revenue growth deceleration rate (year 3–5 vs. year 1–2)
- Operating margin terminal destination (are margins expanding, plateauing, or at risk?)
- WACC: test at ±100bps
- Terminal growth rate: test at 2%, 3.5%, 5%

**Universe:** AAPL, MSFT, GOOGL, AMZN, META, ORCL, ACN, AVGO, V, MA, BRK.B, DHR, LIN, UNH

---

### 2. Mature Defensive

**Intended For:** Slower-growth, stable-margin businesses with predictable cash flows, consistent dividend growth, and limited cyclicality. Pricing power is real but modest; volume growth anchors the model.

**Characteristics:**
- Revenue growth: 2–6% CAGR
- Gross margins: stable, not expanding materially
- High dividend payout ratios (40–70% of FCF)
- ROIC: 10–20%, stable
- Capital allocation: dividends + modest buybacks; M&A is bolt-on, not transformative

**Model Structure:**
- Volume/price/mix decomposition is essential — do NOT model revenue as a single growth rate
- Segment margins modeled separately (margin profile differs across divisions)
- Dividend model: payout ratio, dividend growth rate, yield-on-cost projection
- Working capital normalized; capex as % of revenue is a stable input
- 10-year explicit DCF appropriate given low growth / long cash flow visibility

**Primary Valuation Methods:**
- DCF (WACC 7–9%, terminal growth 2–3%): most reliable anchor
- EV/EBITDA: sector comps convention
- P/E: dividend discount model implied P/E
- Dividend Discount Model (DDM): appropriate for utilities-like businesses within this archetype

**Key Model Assumptions to Sensitize:**
- Organic volume growth (unit volume, not price): is it positive or negative?
- Pricing power: ability to pass through cost inflation (input costs, labor)
- Dividend sustainability: FCF coverage ratio of the dividend (target: >2.0x)
- M&A risk: has management signaled large deals? Model leverage impact.

**Universe:** ABT, JNJ, MDT, HON, CSCO, IBM, CMCSA, KO, MCD, HD, WMT, ABEV

---

### 3. Cyclical Value

**Intended For:** Businesses whose earnings are materially driven by commodity prices, economic cycles, or speculative asset prices. Valuation on trough/mid-cycle normalized earnings, not peak.

**Characteristics:**
- Revenue and EBITDA can swing ±30–50% through cycles
- Valuation is meaningless on peak multiples — always normalize
- Capital allocation is cycle-sensitive: capex contracts at cycle troughs
- Balance sheet matters enormously — leverage can be lethal at cycle bottoms

**Model Structure:**
- Mid-cycle earnings/FCF normalization is the anchor (not current-quarter results)
- For energy: model at $70/bbl, $80/bbl, $90/bbl WTI scenarios; show earnings sensitivity per $10 move
- For crypto-adjacent (COIN, MSTR): model at bear/base/bull Bitcoin price scenarios
- Balance sheet stress test: can the company survive a 2-year trough without equity dilution?
- Scenario analysis is mandatory: show 3 cases (bear/base/bull) with discrete assumptions

**Primary Valuation Methods:**
- Mid-cycle EV/EBITDA (not current-quarter): compare to historical cycle averages
- P/NAV (for energy, commodity): useful for asset-heavy businesses
- FCF yield on mid-cycle earnings: most investor-friendly for energy
- For MSTR: BTC per share NAV and premium/discount to NAV is the primary metric
- For COIN: EV/Revenue or EV/EBITDA at normalized (not peak) crypto volumes

**Key Model Assumptions to Sensitize:**
- Commodity price (oil, BTC, crypto trading volumes)
- Production growth / reserve life (energy)
- Capital structure and debt maturity schedule
- Breakeven price (energy: what WTI/Henry Hub price generates 0 FCF?)

**Universe:** COIN, MSTR, CVX, XOM, INTC, GME

---

### 4. Hypergrowth / Emerging Platform

**Intended For:** High-growth companies with rapid revenue expansion, margin ramp underway, and long-duration TAM optionality. Current earnings are misleading — value is in the future state.

**Characteristics:**
- Revenue growth: 20–100%+ CAGR currently, decelerating over model period
- Gross margins expanding toward 60–80% long-term
- Significant SBC (stock-based compensation) — must normalize for dilution
- Current P/E is not meaningful; EV/Sales + FCF bridge is the primary framework
- Outcome is binary-like: these companies either compound dramatically or destroy capital

**Model Structure:**
- Cohort or S-curve revenue growth model: model the deceleration explicitly (don't extrapolate peak growth rates)
- Revenue growth waterfall: ARR, NRR, new customer additions, ARPU expansion
- Gross margin ramp: model by segment; show path to long-run target
- Operating expense leverage: S&M, R&D, G&A as % of revenue declining over time
- SBC normalization: report both GAAP and SBC-adjusted FCF; model diluted share count
- Long-run margin target sensitivity: small changes in terminal margin create large value swings

**Primary Valuation Methods:**
- EV/NTM Revenue (with margin maturation bridge): primary relative value method
- Long-run FCF bridge: assume terminal margin (e.g., 25–35% FCF margin) in 5–7 years → DCF back
- Rule of 40 score tracking: (revenue growth % + FCF margin %) — target >40
- EV/ARR (for SaaS): cross-check vs. NRR and growth rate peers

**Key Model Assumptions to Sensitize:**
- Revenue growth deceleration: how fast does the growth rate fall?
- Terminal FCF margin: the single biggest driver of intrinsic value
- SBC dilution: models often understate the cost of equity compensation
- TAM sizing: is the market actually as large as management claims?

**Universe:** NVDA, PLTR, APP, CRWD, HOOD, CRCL, TSLA, MRVL

---

### 5. Bank / Financial Institution

**Intended For:** Balance-sheet-driven businesses where earnings power is a function of net interest margin, credit quality, and fee income — not operating leverage in the traditional sense.

**Characteristics:**
- NII (net interest income) is the primary earnings driver; model the balance sheet, not the P&L in isolation
- Credit cycle is the key risk variable: provision expense swings can erase a year of earnings
- Capital ratios (CET1) constrain capital return; must model regulatory capital framework
- ROTCE (return on tangible common equity) is the north star metric for management and investors

**Model Structure:**
- Balance sheet model first: loan growth, deposit beta, NIM compression/expansion
- NII model: average earning assets × NIM = NII; sensitize to rate scenarios (Fed funds ±50/100bps)
- Fee income modeled separately: trading, IB, wealth, card fees
- Provision model: through-the-cycle normalized loss rate (not current-quarter benign provisions)
- CET1 ratio → excess capital → capital return capacity (buybacks + dividends)

**Primary Valuation Methods:**
- P/TBV (price to tangible book value): primary anchor — compare to ROTCE / cost of equity
- ROTCE framework: fair P/TBV = ROTCE / CoE; if ROTCE > CoE, stock should trade >1x TBV
- NTM P/E: secondary; cross-check vs. sector
- Dividend yield: relevant for income-oriented holders

**Key Model Assumptions to Sensitize:**
- NIM: sensitize ±25bps in both directions; large earnings impact
- Loan growth: cycle-driven; stress at -5% (recession scenario)
- Credit losses: normalize 50–100bps NCO rate; stress at 150–200bps
- CET1 target: every 50bps above target is capital available for return

**Universe:** JPM, BAC, GS

---

### 6. Biopharma Pipeline

**Intended For:** Drug and biotech companies where value is driven by product-level revenue, patent exclusivity timelines, and R&D pipeline optionality. Single products often represent 30–60%+ of revenue.

**Characteristics:**
- LOE (loss of exclusivity) cliffs are the central risk — model them by product
- Pipeline risk is binary: Phase III failure can destroy 20–40% of enterprise value
- Revenue visibility is high for marketed products; low for pipeline
- R&D productivity (how much value is generated per dollar of R&D) varies enormously

**Model Structure:**
- Product-level revenue model: each significant product modeled separately (peak sales, market share, LOE date, revenue ramp/decline curve)
- Portfolio-level aggregation: sum individual products; model patent cliff years explicitly
- SOTP (sum-of-the-parts) for pipeline: risk-adjust pipeline assets by phase (Phase I: 5–10% probability; Phase II: 15–25%; Phase III: 50–60%; registered: 85–90%)
- R&D run-rate modeled as % of revenue (typically 15–25% for large-cap pharma)
- Operating leverage: SG&A as % of revenue declining as portfolio matures

**Primary Valuation Methods:**
- SOTP/rNPV (risk-adjusted net present value): pipeline assets discounted at 10–12%; marketed products at 8–10%
- EV/EBITDA (NTM): for marketed products portion; compare to mature pharma peers
- P/E: secondary; most useful post-LOE-cliff when earnings are stabilizing
- FCF yield: for mature, post-cliff portfolios

**Key Model Assumptions to Sensitize:**
- LOE timing and magnitude: what does the revenue cliff look like in the year of patent expiry?
- Pipeline probability of success: shift Phase III probability ±15pp; large NPV impact
- IRA/government pricing negotiations: which products are subject to Medicare price-setting?
- Peak sales estimates: cross-check vs. sell-side consensus and analogous drugs

**Universe:** ABBV, AZN, LLY, MRK

---

### 7. Asset Manager / ETF

**Intended For:** AUM-driven businesses where revenue = AUM × fee rate, and value is driven by organic flows, market beta on AUM, and fee rate sustainability.

**Characteristics:**
- Revenue is highly sensitive to market levels (AUM fluctuates with market beta)
- Organic flow rate (net new money as % of AUM) is the true alpha of the business
- Fee compression is structural: passive and semi-passive products are repricing lower
- Operating leverage is high: incremental AUM has near-zero marginal cost

**Model Structure:**
- AUM model: beginning AUM × market return + net flows = ending AUM
- Revenue = average AUM × blended fee rate (model fee compression separately)
- Operating leverage: revenue growth flows to EBITDA disproportionately
- Dividend/distribution model: ETFs have different cash flow profiles than active managers

**Primary Valuation Methods:**
- % of AUM: price-to-AUM ratio (compare to AUM multiples for peer ETF families)
- EV/EBITDA: for the management company (DFA is private; DFAC is the ETF product)
- Distribution yield: for ETF investors focused on income
- Flow trajectory: forward AUM growth rate is the dominant driver of value

**Key Model Assumptions to Sensitize:**
- Market return assumption: AUM is market-sensitive; stress at -20% market scenario
- Net flow rate: is the product gaining or losing organic flows?
- Fee rate trajectory: how fast are fees compressing?
- Expense ratio: monitor for DFA's cost competitiveness vs. Vanguard/Blackrock

**Universe:** DFAC

---

## Universe Assignment

| Company | Ticker | Assigned Archetype | Sector |
|---------|--------|--------------------|--------|
| Apple Inc. | AAPL | Compounder Platform | Big Tech |
| Microsoft Corporation | MSFT | Compounder Platform | Big Tech |
| Alphabet Inc. (Google) | GOOGL | Compounder Platform | Big Tech |
| Amazon.com Inc. | AMZN | Compounder Platform | Big Tech |
| Meta Platforms Inc. | META | Compounder Platform | Big Tech |
| Oracle Corporation | ORCL | Compounder Platform | Enterprise Tech |
| Accenture plc | ACN | Compounder Platform | Enterprise Tech |
| Broadcom Inc. | AVGO | Compounder Platform | Semiconductors |
| Visa Inc. | V | Compounder Platform | Payments |
| Mastercard Incorporated | MA | Compounder Platform | Payments |
| Berkshire Hathaway Inc. B | BRK.B | Compounder Platform | Diversified Finance |
| Danaher Corporation | DHR | Compounder Platform | Life Science Tools |
| Linde plc | LIN | Compounder Platform | Industrial Gases |
| UnitedHealth Group | UNH | Compounder Platform | Managed Care |
| NVIDIA Corporation | NVDA | Hypergrowth / Emerging Platform | AI / Semiconductors |
| Palantir Technologies | PLTR | Hypergrowth / Emerging Platform | AI Software |
| AppLovin Corporation | APP | Hypergrowth / Emerging Platform | Ad Tech / AI |
| CrowdStrike Holdings | CRWD | Hypergrowth / Emerging Platform | Cybersecurity |
| Robinhood Markets Inc. | HOOD | Hypergrowth / Emerging Platform | Fintech |
| Circle Internet Group | CRCL | Hypergrowth / Emerging Platform | Digital Assets |
| Tesla Inc. | TSLA | Hypergrowth / Emerging Platform | EV / Energy / AI |
| Marvell Technology | MRVL | Hypergrowth / Emerging Platform | Custom Silicon |
| Abbott Laboratories | ABT | Mature Defensive | MedTech / Diagnostics |
| Johnson & Johnson | JNJ | Mature Defensive | Pharma / MedTech |
| Medtronic plc | MDT | Mature Defensive | Medical Devices |
| Honeywell International | HON | Mature Defensive | Industrial Conglomerate |
| Cisco Systems Inc. | CSCO | Mature Defensive | Enterprise Networking |
| IBM Corporation | IBM | Mature Defensive | Hybrid Cloud / IT Services |
| Comcast Corporation | CMCSA | Mature Defensive | Connectivity / Media |
| The Coca-Cola Company | KO | Mature Defensive | Beverage |
| McDonald's Corporation | MCD | Mature Defensive | QSR / Franchise |
| The Home Depot Inc. | HD | Mature Defensive | Home Improvement Retail |
| Walmart Inc. | WMT | Mature Defensive | Retail / eCommerce |
| Ambev S.A. | ABEV | Mature Defensive | EM Beverage |
| Coinbase Global Inc. | COIN | Cyclical Value | Crypto Exchange |
| MicroStrategy Incorporated | MSTR | Cyclical Value | BTC Treasury Proxy |
| Chevron Corporation | CVX | Cyclical Value | Integrated Energy |
| Exxon Mobil Corporation | XOM | Cyclical Value | Integrated Energy |
| Intel Corporation | INTC | Cyclical Value | Semiconductors (turnaround) |
| GameStop Corp. | GME | Cyclical Value | Retail / Meme |
| JPMorgan Chase & Co. | JPM | Bank / Financial Institution | Money Center Bank |
| Bank of America Corp. | BAC | Bank / Financial Institution | Money Center Bank |
| Goldman Sachs Group | GS | Bank / Financial Institution | Capital Markets / Banking |
| AbbVie Inc. | ABBV | Biopharma Pipeline | Large-Cap Pharma |
| AstraZeneca plc | AZN | Biopharma Pipeline | Large-Cap Pharma |
| Eli Lilly and Company | LLY | Biopharma Pipeline | Large-Cap Pharma |
| Merck & Co. Inc. | MRK | Biopharma Pipeline | Large-Cap Pharma |
| Dimensional U.S. Equity ETF | DFAC | Asset Manager / ETF | Factor ETF |

---

## Model Build Rules — Step by Step

When converting each `*_Financial_Model.xlsx` template for a specific company:

**Step 1 — Assign archetype and configure tabs.** Open the model, confirm the assigned archetype from the table above. Activate the correct forecast structure: segment-level revenue, margin drivers, capital return model per the archetype definition.

**Step 2 — Ingest historical GAAP financials.** Populate 5–7 years of historical income statement, balance sheet, and cash flow statement. Source: 10-K filings (direct links in each company's `_10-K` folder). For banks: populate balance sheet items (loans, deposits, NIM) before touching the P&L.

**Step 3 — Calibrate segment-level assumptions.** Use historical actuals to anchor forward assumptions. Do not extrapolate peak-cycle metrics. Reference the company's `_Intro.md` → Revenue Architecture section for segment mix context and key drivers.

**Step 4 — Build forward forecasts.** 5-year explicit period (10-year for Mature Defensive); terminal value thereafter. Apply the valuation methods specified per archetype above.

**Step 5 — Sensitize key assumptions.** Run at minimum: revenue growth ±3pp, operating margin ±2pp, WACC ±1pp. For Cyclical/Binary names: run bear/base/bull scenario with discrete commodity price or growth assumptions.

**Step 6 — Cross-check with market.** Compare model-implied price to current price in `Mr_Market.md`. If implied value is >30% above market price, audit assumptions for optimism bias. If >30% below, audit for excessive conservatism or verify the structural bear thesis is correctly captured.

---

*This document is the governance framework for all financial modeling in this research terminal. Maintain consistency with these archetype frameworks across the universe to enable apples-to-apples comparison across names.*
