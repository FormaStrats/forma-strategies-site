# Deploy the Terminal into the website

The Terminal is built from `FormaStrats/Forma-Strategies-Landing-Terminal` (`dapp/`) and served from
`terminal/` in this repo. It uses relative paths (`base: './'`), so it works under the GitHub Pages sub-path.

```bash
# in the Terminal repo
./scripts/deploy-terminal.sh /path/to/forma-strategies-site
```

The script type-checks, runs the tests, builds (which also regenerates `data/strategies.json`), replaces
`terminal/assets` + `terminal/index.html`, and copies the rest of `dist/` over `terminal/` while keeping
website-only pages (`terminal/activity/`, `terminal/equity/index.html`).

Then commit and push this repo; Pages redeploys in about a minute.
