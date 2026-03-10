# Deploy Terminal into Website (Static Hosting / GitHub Pages friendly)

## Goal
Make the Forma landing site and the Forma Terminal work when hosted from a static site under a subpath (e.g. GitHub Pages `/<repo>/`).

Key rule: **the terminal must be self-contained under `website/terminal/`** and must use **relative paths** for assets + data.

## Current implementation notes
- `dapp/vite.config.ts` sets `base: './'` ✅
- Terminal fetches use relative paths:
  - `./availability/...`
  - `./equity/...`
- Terminal hero background uses `url(./forma-bg.jpeg)`

So we must copy the related assets **into `website/terminal/`**.

## One-command deploy (manual)
From the repo root:

```bash
cd "~/Desktop/Forma Strategies Giga File/dapp"
npm run build

# Deploy dist -> website/terminal (archive old build)
cd "~/Desktop/Forma Strategies Giga File"
TS=$(date +%Y%m%d-%H%M%S)
mkdir -p website/_legacy
[ -d website/terminal ] && mv website/terminal website/_legacy/terminal-$TS
cp -R dapp/dist website/terminal

# Copy terminal-required assets INTO terminal/
cp website/forma-bg.jpeg website/terminal/forma-bg.jpeg
cp website/forma-banner.jpeg website/terminal/forma-banner.jpeg
mkdir -p website/terminal/availability website/terminal/equity
cp -R website/availability/* website/terminal/availability/
cp -R website/equity/* website/terminal/equity/
```

## Local test
Serve the website:

```bash
cd "~/Desktop/Forma Strategies Giga File/website"
python3 -m http.server 8080 --bind 0.0.0.0
```

Open:
- Landing: `http://localhost:8080/`
- Terminal: `http://localhost:8080/terminal/`

## GitHub Pages notes
- GitHub Pages usually serves at `https://<user>.github.io/<repo>/`
- The landing link should be relative: `terminal/`
- Because terminal uses relative assets, it will load under `/terminal/` correctly.
