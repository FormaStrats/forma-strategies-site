# Forma Strategies: website

Live: https://formastrats.github.io/forma-strategies-site/ (GitHub Pages, `main` branch, root).

## What's here

| Path | What it is |
|---|---|
| `index.html`, `assets/site.css`, `assets/site.js` | The landing site. No build step, no framework. Live prices, strategy compositions and the investability monitor load from Jupiter's public APIs in the visitor's browser. Market data renders only from a complete set (retries with backoff on rate limits), never as partial or zero figures. |
| `assets/forma-chrome.js` | The hero's 3D chrome Forma mark, rendered live on the visitor's GPU with three.js (vendored in `assets/vendor/`, MIT). A transparent poster (`brand/forma-chrome-1200.webp`) shows until it is ready, and stays for reduced-motion, Save-Data and low-memory devices. |
| `assets/fonts/` | Self-hosted brand fonts: Noto Serif Display, Hanken Grotesk and IBM Plex Mono (SIL Open Font License 1.1, see `LICENSE.txt`). No third-party font requests. |
| `brand/` | The Sterling brand: vector marks (`forma-mark.svg`, `forma-mark-flat.svg`, `forma-glyph.svg`), 1920×1080 and 3840×2160 chrome renders, the share card, app icons. Renders come from the same scene as the hero. |
| `terminal/` | The built Forma Terminal (source: `FormaStrats/Forma-Strategies-Landing-Terminal/dapp`). `terminal/data/strategies.json` is generated from the Terminal's strategy definitions and read by the landing page. |
| `terminal/equity/`, `terminal/activity/` | Standalone research / activity pages kept alongside the app. |
| `product-guide-flipbook.html` | v1 catalog flipbook. |
| `experience-2026.html` | The previous landing page, kept for reference. |
| `FormaStrategiesBanner4k.jpeg` etc. | Legacy filenames, now holding the Sterling renders so older pages match the brand. |

## Update the Terminal

From the Terminal repo:

```bash
./scripts/deploy-terminal.sh ../forma-strategies-site
```

Then commit and push this repo.

## Edit the landing page

Edit `index.html` / `assets/site.css` directly. To preview locally with correct paths, serve the
**parent** folder and open `/forma-strategies-site/` (GitHub Pages serves the site under that sub-path).
