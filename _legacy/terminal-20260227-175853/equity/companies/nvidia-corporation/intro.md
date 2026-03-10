# NVIDIA Corporation — Equity Research Brief

*Last Updated: February 25, 2026*

---

## Filing Coverage

- **Latest 10-K:** February 25, 2026 → https://www.sec.gov/Archives/edgar/data/1045810/000104581026000021/nvda-20260125.htm
- **Latest 10-Q:** November 19, 2025 → https://www.sec.gov/Archives/edgar/data/1045810/000104581025000230/nvda-20251026.htm
- **Latest 8-K:** February 25, 2026 → https://www.sec.gov/Archives/edgar/data/1045810/000104581026000019/nvda-20260225.htm

---

## Business Overview

NVIDIA is the world's dominant GPU (graphics processing unit) manufacturer and AI infrastructure company, with an estimated 80%+ market share in high-performance accelerators used for AI model training and inference. The company's business is organized into three primary segments: Data Center (gaming GPUs, enterprise GPUs for AI/ML/HPC), Gaming (consumer GeForce GPUs, gaming platforms), and Professional Visualization (workstation GPUs for design/simulation). Data Center revenue has exploded from 25% of total revenue (FY2021) to 85%+ currently, representing a transformational shift from a gaming-focused company to an AI infrastructure incumbent.

NVIDIA's H100 and newer Blackwell architecture GPUs are the de facto standard for large language model (LLM) training and inference, with estimated 2-3 million units deployed globally across hyperscalers (AWS, Azure, GCP, Meta, Tesla, OpenAI). The company has structured GPU supply to optimize pricing: a single H100 GPU costs $30K-40K at list price, and a typical GPU server contains 4-8 GPUs, translating to $120K-320K per server. Hyperscalers are purchasing GPU servers at $5B-10B annual rates, representing an unprecedented concentration of capex. NVIDIA's gross margins in Data Center exceed 75%, and operating margins exceed 50%, making the company one of the most profitable public corporations globally.

NVIDIA's strategic positioning centers on lock-in through proprietary CUDA software ecosystem and custom chip architectures. CUDA (Compute Unified Device Architecture) is a programming language and runtime that allows software developers to write code that runs efficiently on NVIDIA GPUs. NVIDIA has cultivated a 20-year moat through CUDA adoption: virtually all deep learning frameworks (PyTorch, TensorFlow) are optimized for CUDA, and retraining engineering teams to use alternative ecosystems (AMD, Intel, custom silicon) represents 12-24 month commitments. This software moat is the primary defensibility mechanism against competitors seeking to dethrone NVIDIA. The company is investing heavily in custom silicon to reduce dependence on TSMC and secure supply, but supply chain risk remains material given Taiwan concentration.

## Revenue Architecture

NVIDIA's Data Center unit economics are exceptional. The company sells GPUs through distribution channels to system integrators (Dell, HP, Supermicro) and direct to hyperscalers. Gross margins of 75%+ reflect minimal COGS (TSMC manufacturing), minimal customer support, and operating leverage on fixed R&D. Revenue per Data Center customer (hyperscaler) has accelerated: AWS, Meta, Google, Microsoft each spend $2B-5B annually on GPU procurement, and these customers are increasing capex allocations to 15-25% of revenue as AI becomes strategically critical. There is a virtuous cycle: more GPU supply enables larger model training, larger models unlock incremental value (better performance, new capabilities), which justifies more capex. This cycle has supported 100%+ YoY revenue growth from FY2023-FY2025, unprecedented for a company of NVIDIA's scale.

Pricing dynamics have been favorable: list prices for flagship H100 GPUs have remained steady despite supply constraints, with used-market secondary sales at 20-30% discounts. However, competition is emerging: AMD's MI300 series is gaining traction in certain workloads (particularly hyperscaler cost optimization plays), and custom silicon from hyperscalers (Google TPU, AWS Trainium, Meta Artemis) is incrementally displacing NVIDIA in certain inference workloads. Industry consensus suggests NVIDIA will retain 60-70% of market share long-term vs. the 80%+ currently, representing a meaningful revenue headwind by 2027-2028.

Gaming segment revenue has been relatively flat for 2 years as cryptocurrency mining demand collapsed and console cycle maturity constrained growth. However, Gaming gross margins remain strong (55-60%) and provide optionality if AI-powered gaming applications gain traction. Professional Visualization is a niche segment but profitable; RTX workstation GPUs command premium pricing for design/simulation workflows.

## Competitive Moat

NVIDIA's moat is primarily software-based through CUDA and secondarily hardware-based through execution at TSMC. The CUDA ecosystem represents a 20-year competitive advantage: tens of millions of engineers are trained in CUDA, millions of applications are optimized for CUDA, and the cost of migration to alternative architectures (AMD, custom silicon) is substantial. This creates a switching cost that competitors find difficult to overcome.

However, the moat is under structural pressure. AMD is investing heavily in ROCm (NVIDIA's equivalent) and has achieved parity on certain benchmarks; AMD's MI300 series is gaining traction with price-sensitive hyperscalers. More importantly, custom silicon from hyperscalers (Google TPU, AWS Trainium, Meta Artemis) is incrementally displacing NVIDIA in inference workloads. Google's TPU has evolved to perform competitively with NVIDIA's A100/H100 on specific workloads (LLM inference), and Google controls their own destiny on price optimization. This represents a structural headwind: over time, hyperscalers will develop custom silicon for 50-70% of compute workloads, with NVIDIA retained for training and specialized inference where custom silicon doesn't exist.

The company's ability to maintain 80%+ market share is contingent on continued execution at TSMC and ability to outpace competitors on architecture (Blackwell, Rubin, etc.). However, this is an engineering capability competition, not a moat. Competitors (AMD, Intel, custom silicon) are investing $10B+ annually in R&D and will incrementally close the gap. Consensus view is that NVIDIA's market share will decline to 60-70% by 2028, with incremental share loss to AMD and custom silicon.

## Key Investment Considerations

**Bull Case:** Data Center revenue will sustain 35-50% CAGR through 2027 as AI model training scales (GPT-5, Claude-2, Gemini-2 classes consuming 2-3x more compute than current generation) and inference workload migration accelerates. Gross margins will remain 72-75% through this period as supply remains constrained and pricing holds. NVIDIA will capture 75%+ of the $500B+ annual AI infrastructure TAM by 2028. Operating leverage will expand operating margins to 52-55%, supporting 30-40% free cash flow growth. The company will return $100B+ in buybacks and dividends through 2027, supporting 25-30% EPS CAGR despite slowing revenue growth in 2028+. At 55x NTM earnings and 0.03% dividend yield, the valuation is reasonable for a 35% hypergrowth story with 50%+ ROIC, but leaves minimal margin of safety.

**Bear Case / Primary Risks:** Data Center growth is decelerating from 117% YoY (FY2025) to 35-50% (our base case) to <20% by 2028 due to: (1) AI model scaling law diminishing returns (compute requirements growing 5-10x per year, but model performance gains declining); (2) hyperscaler capex rationalization (capex spending as % of revenue retreating from 25% toward 15-18%); (3) custom silicon displacement accelerating (hyperscalers deploying custom inference silicon at 30-40% of production by 2027). Competitive share loss to AMD and custom silicon could accelerate faster than expected; if hyperscalers deploy custom silicon at 50% of compute by 2027, NVIDIA's addressable market declines to $30B-40B vs. $100B+ consensus. Regulatory headwinds (US export controls to China, EU data sovereignty requirements) could reduce addressable market 10-20%. Gross margins could compress from 75% to 65-70% as competition intensifies and hyperscalers negotiate volume discounts. The stock is trading at 55x NTM earnings (6.5% implied FCF yield), leaving zero margin of safety if revenue growth disappoints or margin compression occurs.

**Due Diligence Focus Areas:**
- Data Center revenue growth trajectory by customer segment (hyperscaler, enterprise, government); verify sustained 35-50% growth through 2027
- Gross margin progression and competitive pricing dynamics; quantify AMD MI300 adoption and custom silicon displacement impact
- CUDA ecosystem stickiness; measure engineering sentiment on alternative platforms (ROCm, custom silicon) through developer surveys
- Hyperscaler capex trends and expectations; model time to capex normalization at 15% of revenue vs. current 20-25%
- Custom silicon development timelines and performance gaps; assess if hyperscalers will achieve cost parity with NVIDIA-based systems by 2027-2028

## Valuation Archetype: Hypergrowth / Emerging Platform

**Primary Metrics to Track:**
- Data Center revenue growth rate (target: 35-50% through 2027, decelerating to 15-20% by 2028)
- Data Center gross margin (target: 72-75% through 2027)
- Market share in GPU accelerators (target: 75%+ through 2027, declining to 60-70% by 2028)
- Average selling price (ASP) per GPU and per server; monitor pricing power vs. competition
- Revenue concentration by customer (top 5 customer % of revenue); assess customer concentration risk

---

## Material Change Footprint (SEC Keyword Detection)

- Leadership: 81 filings/snippets
- Capital Return: 58 filings/snippets
- Legal/Regulatory: 36 filings/snippets
- M&A: 29 filings/snippets
- Guidance/Results: 25 filings/snippets
- Financing: 2 filings/snippets

---

## Analyst Notes

- This brief combines SEC filing intelligence with fundamental analysis synthesis.
- Filing links above connect directly to SEC EDGAR — use alongside the Timeline and Filing Index for deep research.
- Cross-check legal/regulatory and accounting one-offs manually before committing to valuation assumptions.
- Review the Universe Model Archetypes file for the appropriate valuation framework for this company.
