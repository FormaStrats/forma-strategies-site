# Forma Strategies: website

Live: https://formastrats.github.io/forma-strategies-site/ (GitHub Pages, `main` branch, root).

## What's here

| Path | What it is |
|---|---|
| `index.html`, `assets/site.css`, `assets/site.js` | The homepage: a headline, a film and four portfolios, in as few words as possible. No build step, no framework. Live prices, strategy compositions and the investability monitor load from Jupiter's public APIs in the visitor's browser. Market data renders only from a complete set (retries with backoff on rate limits), never as partial or zero figures. |
| `how-it-works.html` | The full walkthrough (strategies, steps, platform, custody, governance) that used to be the homepage. |
| `assets/forma-sim.js` | The homepage film: a wallet holding 1,000 USDC connects, chooses the Total Tokenized Stock Index, approves in the wallet and receives the holdings. Visitors land on the delivery, and the loop then shows how. Plain HTML driven by one clock, so it stays sharp at any size. Like the engine, it asks for one approval per 20 positions and delivers each batch before the next, so its length follows the count (up to the index's 50). It uses the strategy's live weights once `site.js` has a complete data set, and a dated snapshot (`SNAPSHOT`, `AS_OF`) until then. It pauses off-screen and on request; with reduced motion it shows the finished wallet. |
| `assets/forma-chrome.js` | The 3D chrome Forma mark beside the governance line, rendered live on the visitor's GPU with three.js (vendored in `assets/vendor/`, MIT). A transparent poster (`brand/forma-chrome-1200.webp`) shows until it is ready, and stays for reduced-motion, Save-Data and low-memory devices. |
| `assets/fonts/` | Self-hosted brand fonts: Noto Serif Display, Hanken Grotesk and IBM Plex Mono (SIL Open Font License 1.1, see `LICENSE.txt`). No third-party font requests. |
| `brand/` | The Sterling brand: vector marks (`forma-mark.svg`, `forma-mark-flat.svg`, `forma-glyph.svg`), 1920×1080 and 3840×2160 chrome renders, the share card, app icons. Renders come from the same scene as the hero. |
| `brand/film/` | The film as video for posts: `forma-film-9x16.mp4` (1080×1920, for X, LinkedIn, TikTok, Reels and Shorts; it keeps clear of their on-screen controls) and `forma-film-16x9.mp4` (1920×1080, for desktop and YouTube). About 27 s each, ending on a card with the address and the eligibility, not-advice and tokenized-stock lines; repeat those lines in the post text. |
| `tools/film/` | The film's video layout (`film.html`, which borrows the phone from `index.html`) and its frame-by-frame renderer (`film.mjs`), which also renders the share card `brand/og-1200x630.jpg`. |
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
**parent** folder and open `/forma-strategies-site/` (GitHub Pages serves the site under that sub-path):

```bash
cd .. && python3 -m http.server 8000
```

Then open http://127.0.0.1:8000/forma-strategies-site/.

## Re-render the film

With the site served as above, from this repo (needs Chrome, ffmpeg and Node 18+):

```bash
(cd tools/film && npm install --no-save puppeteer-core@23)
```

```bash
node tools/film/film.mjs wide brand/film/forma-film-16x9.mp4
```

```bash
node tools/film/film.mjs tall brand/film/forma-film-9x16.mp4
```

```bash
node tools/film/film.mjs og brand/og-1200x630.jpg
```

The films and the share card use the snapshot in `assets/forma-sim.js`. When you refresh `SNAPSHOT` and `AS_OF`, re-render all three.
