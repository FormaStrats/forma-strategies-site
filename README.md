# Forma Strategies: website

Live: https://formastrats.github.io/forma-strategies-site/ (GitHub Pages, `main` branch, root).

## What's here

| Path | What it is |
|---|---|
| `index.html`, `assets/site.css`, `assets/site.js` | The landing site. No build step, no framework. Live prices, strategy compositions and the investability monitor load from Jupiter's public APIs in the visitor's browser. |
| `assets/forma-field.js` | The hero light-ribbon renderer. Draws at the device's pixel density, so it is sharp at 1080p, 1440p and 4K. |
| `brand/` | Vector Forma mark (`forma-mark.svg`, `forma-mark-flat.svg`), 1920×1080 and 3840×2160 renders, social card, app icons. |
| `terminal/` | The built Forma Terminal (source: `FormaStrats/Forma-Strategies-Landing-Terminal/dapp`). `terminal/data/strategies.json` is generated from the Terminal's strategy definitions and read by the landing page. |
| `terminal/equity/`, `terminal/activity/` | Standalone research / activity pages kept alongside the app. |
| `product-guide-flipbook.html` | v1 catalog flipbook. |
| `experience-2026.html` | The previous landing page, kept for reference. |
| `FormaStrategiesBanner4k.jpeg` etc. | Legacy filenames, now holding true 4K / 1080p renders so older pages stay sharp. |

## Update the Terminal

From the Terminal repo:

```bash
./scripts/deploy-terminal.sh ../forma-strategies-site
```

Then commit and push this repo.

## Edit the landing page

Edit `index.html` / `assets/site.css` directly. To preview locally with correct paths, serve the
**parent** folder and open `/forma-strategies-site/` (GitHub Pages serves the site under that sub-path).
