/* Forma Strategies — website runtime (no build step, no dependencies).
   Live data comes straight from Jupiter's public APIs in the visitor's browser. */
(function () {
  'use strict';

  var JUP = 'https://api.jup.ag';
  var USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  var SOL = 'So11111111111111111111111111111111111111112';

  // ── Nav state ──────────────────────────────────────────────────────────
  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Phone menu ─────────────────────────────────────────────────────────
  var menuBtn = document.querySelector('.nav__menu'), sheet = document.getElementById('navSheet');
  function setMenu(open, refocus) {
    if (!menuBtn || !sheet) return;
    sheet.hidden = !open;
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.textContent = open ? 'Close' : 'Menu';
    if (nav) nav.classList.toggle('is-open', open);
    if (!open && refocus) menuBtn.focus();
  }
  if (menuBtn && sheet) {
    menuBtn.addEventListener('click', function () { setMenu(sheet.hidden); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) setMenu(false, true); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 768 && !sheet.hidden) setMenu(false); });
  }

  // ── Reveal on scroll ───────────────────────────────────────────────────
  var revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // The hero's chrome mark is a separate module (assets/forma-chrome.js), started from index.html.

  // ── Helpers ────────────────────────────────────────────────────────────
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function usd(n, d) {
    if (!isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }).format(n);
  }
  function compactUsd(n) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  function pct(n) { return (n >= 0 ? '+' : '−') + Math.abs(n).toFixed(2) + '%'; }
  // A market move, shown in steel with an arrow rather than in red or green.
  function move(n) {
    if (n == null || !isFinite(n)) return '—';
    var up = n >= 0;
    return '<span class="mv ' + (up ? 'mv--up' : 'mv--down') + '"><span aria-hidden="true">' + (up ? '▲' : '▼') + '</span><span class="sr-only">' + (up ? 'up ' : 'down ') + '</span>' + Math.abs(n).toFixed(2) + '%</span>';
  }
  function setLive(key, html) { $all('[data-live="' + key + '"]').forEach(function (el) { if (el.innerHTML !== html) el.innerHTML = html; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // Retries rate limits and server errors (honouring Retry-After) and times out hung requests, so a busy API
  // never turns into missing numbers. Callers treat a final failure as "no data", never as zero.
  function getJSON(url, attempt) {
    attempt = attempt || 0;
    var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : 0;
    function retry(after) { return delay(after).then(function () { return getJSON(url, attempt + 1); }); }
    return fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined }).then(function (r) {
      clearTimeout(timer);
      if ((r.status === 429 || r.status >= 500) && attempt < 3) {
        var ra = Number(r.headers.get('Retry-After'));
        return retry((isFinite(ra) && ra > 0 ? ra * 1000 : [1000, 2500, 5000][attempt]) + Math.random() * 400);
      }
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    }, function (err) {
      clearTimeout(timer);
      if (attempt < 2) return retry(1200 * (attempt + 1));
      throw err;
    });
  }
  function chunk(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

  // ── US market session (America/New_York) ───────────────────────────────
  var HOLIDAYS = ['2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24'];
  // 1:00pm ET early closes, as in the Terminal (dapp/src/lib/market.ts).
  var EARLY_CLOSE = ['2026-11-27', '2026-12-24', '2027-11-26'];
  function session() {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
    var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var key = p.year + '-' + p.month + '-' + p.day;
    var h = Number(p.hour) % 24, m = Number(p.minute), mins = h * 60 + m;
    var close = EARLY_CLOSE.indexOf(key) !== -1 ? 780 : 960;
    if (p.weekday === 'Sat' || p.weekday === 'Sun') return 'Weekend';
    if (HOLIDAYS.indexOf(key) !== -1) return 'Holiday';
    if (mins >= 570 && mins < close) return '<span class="session-dot" aria-hidden="true"></span>Open';
    if (mins >= 240 && mins < 570) return 'Pre-market';
    if (mins >= close && mins < 1200) return 'After hours';
    return 'Overnight';
  }
  setLive('session', session());
  setInterval(function () { setLive('session', session()); }, 60000);

  // ── Data ───────────────────────────────────────────────────────────────
  var state = { strategies: null, universe: null, prices: {}, tokens: {} };

  function loadStrategies() {
    return getJSON('terminal/data/strategies.json').catch(function () { return null; });
  }
  // Every token in the Terminal's registry (dapp/src/strategies/universe.ts), exported with strategies.json.
  function loadUniverse() {
    return getJSON('terminal/data/universe.json').then(function (u) { return Array.isArray(u) && u.length ? u : null; }).catch(function () { return null; });
  }

  // All or nothing: if any chunk still fails after retries, the whole load fails and the page keeps its last good
  // state. A partial price set would make strategies look like they hold one or two names.
  function loadPrices(mints) {
    return Promise.all(chunk(mints, 50).map(function (g) { return getJSON(JUP + '/price/v3?ids=' + g.join(',')); }))
      .then(function (parts) { var out = {}; parts.forEach(function (p) { Object.keys(p || {}).forEach(function (k) { out[k] = p[k]; }); }); return out; });
  }

  // Keeps the entries the engine keeps (getPrices in jupiter.ts): a positive onchain price or a positive stock price.
  function storePrices(p) {
    Object.keys(p || {}).forEach(function (k) {
      var v = p[k];
      if (v && ((typeof v.usdPrice === 'number' && v.usdPrice > 0) || (v.stockData && typeof v.stockData.price === 'number' && v.stockData.price > 0))) state.prices[k] = v;
    });
  }

  function loadTokens(mints) {
    return Promise.all(chunk(mints, 100).map(function (g) { return getJSON(JUP + '/tokens/v2/search?query=' + g.join(',')); }))
      .then(function (parts) {
        var out = {};
        parts.forEach(function (list) { (list || []).forEach(function (t) { if (t && t.id) out[t.id] = t; }); });
        return out;
      });
  }

  function liquidityOf(mint) {
    var p = state.prices[mint], t = state.tokens[mint];
    return (p && typeof p.liquidity === 'number' ? p.liquidity : (t && t.liquidity) || 0);
  }
  function volumeOf(mint) {
    var t = state.tokens[mint]; var s = t && t.stats24h;
    return s ? (Number(s.buyVolume) || 0) + (Number(s.sellVolume) || 0) : 0;
  }
  function changeOf(mint) {
    var p = state.prices[mint];
    if (p && typeof p.priceChange24h === 'number') return p.priceChange24h;
    var t = state.tokens[mint]; return t && t.stats24h && typeof t.stats24h.priceChange === 'number' ? t.stats24h.priceChange : null;
  }

  var TOKEN_2022 = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
  var FIVE_DAYS = 5 * 24 * 3600 * 1000, MAX_REFERENCE_DIVERGENCE = 0.25, THIN_BOOK_LIQUIDITY_USD = 5000;
  // Mirrors parseTime() in the Terminal engine: ISO strings and numeric epochs (seconds or ms); NaN when unknown.
  function parseTime(v) {
    if (typeof v === 'number' && isFinite(v)) return v < 1e12 ? v * 1000 : v;
    if (typeof v === 'string' && v.trim()) { var n = Number(v); return isFinite(n) ? (n < 1e12 ? n * 1000 : n) : Date.parse(v); }
    return NaN;
  }
  // Mirrors effectiveMultiplier() in dapp/src/lib/jupiter.ts: Jupiter's implied multiplier, else the schedule; undefined when unknown.
  function effectiveMultiplier(v) {
    var cfg = v && v.scaledUiConfig;
    if (!cfg) return 1;
    var pre = Number(cfg.usdPricePrescaled), ui = Number(v.usdPrice);
    if (isFinite(pre) && pre > 0 && isFinite(ui) && ui > 0 && pre / ui > 0.01 && pre / ui < 100) return pre / ui;
    var eff = cfg.newMultiplierEffectiveAt != null ? parseTime(cfg.newMultiplierEffectiveAt) : NaN;
    var m = isFinite(eff) && Date.now() >= eff ? Number(cfg.newMultiplier) : Number(cfg.multiplier);
    return isFinite(m) && m > 0 ? m : undefined;
  }
  // Mirrors inSplitWindow() in jupiter.ts: within 72h of a split-class multiplier change, reference prices are unreliable.
  function inSplitWindow(cfg) {
    if (!cfg) return false;
    var a = Number(cfg.multiplier), b = Number(cfg.newMultiplier);
    var eff = cfg.newMultiplierEffectiveAt != null ? parseTime(cfg.newMultiplierEffectiveAt) : NaN;
    if (!(a > 0) || !(b > 0) || !isFinite(eff) || (b / a > 0.9 && b / a < 1.1)) return false;
    return Math.abs(Date.now() - eff) < 72 * 3600 * 1000;
  }
  // Mirrors fairPrice() in the Terminal engine (dapp/src/lib/engine.ts): the underlying stock price when fresh, else the
  // onchain price. Null when the multiplier is unknown, in a split window, or when a deep book ($5k+) and the underlying
  // disagree by more than 25%: the Terminal won't buy those names, so the website doesn't weight them either.
  function priceOf(mint) {
    var p = state.prices[mint];
    if (!p) { var t = state.tokens[mint]; return t && t.tokenProgram !== TOKEN_2022 && t.usdPrice > 0 ? t.usdPrice : null; }
    if (effectiveMultiplier(p) == null || inSplitWindow(p.scaledUiConfig)) return null;
    var onchain = typeof p.usdPrice === 'number' && p.usdPrice > 0 ? p.usdPrice : null;
    var stock = p.stockData && typeof p.stockData.price === 'number' && p.stockData.price > 0 ? p.stockData : null;
    if (stock) {
      var updated = parseTime(stock.updatedAt);
      if (isFinite(updated) && Date.now() - updated < FIVE_DAYS) {
        var deep = (typeof p.liquidity === 'number' ? p.liquidity : 0) >= THIN_BOOK_LIQUIDITY_USD;
        if (deep && onchain && Math.abs(stock.price / onchain - 1) > MAX_REFERENCE_DIVERGENCE) return null;
        return stock.price;
      }
    }
    return onchain;
  }
  // Display price (engine markPrice): the fair price when trustworthy, otherwise the onchain price.
  function markOf(mint) {
    var fair = priceOf(mint), p = state.prices[mint];
    if (fair != null) return fair;
    return p && effectiveMultiplier(p) != null && p.usdPrice > 0 ? p.usdPrice : null;
  }
  function iconOf(mint) { var t = state.tokens[mint]; return t && t.icon; }

  function mcapOf(mint) {
    var p = state.prices[mint];
    var sd = p && p.stockData;
    return sd && typeof sd.price === 'number' && sd.price > 0 && typeof sd.mcap === 'number' && isFinite(sd.mcap) && sd.mcap > 0 ? sd.mcap : 0;
  }
  function normalize(xs) {
    var sum = xs.reduce(function (a, x) { return a + (x > 0 ? x : 0); }, 0);
    return xs.map(function (x) { return sum > 0 && x > 0 ? x / sum : 0; });
  }
  // Mirrors cappedWeights() in the Terminal engine (dapp/src/lib/weighting.ts): company/sector caps redistribute
  // pro rata; thin-name caps send their excess to the liquidity sleeve first.
  function cappedWeights(items, rules) {
    var n = items.length, EPS = 1e-12, MAX_PASSES = 500, i;
    if (!n) return { weights: [], sleeve: 0, unplaced: 0 };
    var issuerCap = rules.issuerCap || 1, sectorCap = rules.sectorCap || 1, thinCap = rules.thinNameCap || 1;
    var thinTotal = rules.thinTotalCap || 1, sleeveCap = Math.max(0, rules.sleeveCap || 0);
    var w = normalize(items.map(function (x) { return x.weight; }));
    var sleeve = 0, unplaced = 0, bySector = {}, thinIdx = [];
    items.forEach(function (x, k) { (bySector[x.sector] = bySector[x.sector] || []).push(k); if (x.thin) thinIdx.push(k); });
    for (var pass = 0; pass < MAX_PASSES; pass++) {
      var conc = 0, liq = 0, full = items.map(function () { return false; });
      for (i = 0; i < n; i++) {
        var ceiling = Math.min(issuerCap, items[i].thin ? thinCap : 1);
        if (w[i] > ceiling + EPS) { var ex = w[i] - ceiling; if (items[i].thin && thinCap < issuerCap) liq += ex; else conc += ex; w[i] = ceiling; }
        if (w[i] >= ceiling - EPS) full[i] = true;
      }
      var thinSum = thinIdx.reduce(function (a, k) { return a + w[k]; }, 0);
      if (thinSum > thinTotal + EPS) { var f0 = thinTotal / thinSum; thinIdx.forEach(function (k) { liq += w[k] * (1 - f0); w[k] *= f0; full[k] = true; }); }
      else if (thinIdx.length && thinSum >= thinTotal - EPS) thinIdx.forEach(function (k) { full[k] = true; });
      Object.keys(bySector).forEach(function (sec) {
        var idx = bySector[sec], s = idx.reduce(function (a, k) { return a + w[k]; }, 0);
        if (s > sectorCap + EPS) { var f1 = sectorCap / s; idx.forEach(function (k) { conc += w[k] * (1 - f1); w[k] *= f1; full[k] = true; }); }
        else if (s >= sectorCap - EPS) idx.forEach(function (k) { full[k] = true; });
      });
      if (liq > EPS && sleeveCap > sleeve) { var take = Math.min(sleeveCap - sleeve, liq); sleeve += take; liq -= take; }
      var excess = conc + liq;
      if (excess <= EPS) break;
      var base = 0, recv = [];
      for (i = 0; i < n; i++) if (!full[i] && w[i] > 0) { recv.push(i); base += w[i]; }
      // Caps that can't all hold (no convergence by the last pass) leave the excess unplaced instead of breaking them.
      if (base <= EPS || pass === MAX_PASSES - 1) { unplaced += excess; break; }
      recv.forEach(function (k) { w[k] += excess * (w[k] / base); });
    }
    return { weights: w, sleeve: sleeve, unplaced: unplaced };
  }
  // Mirrors capWeights() in weighting.ts: cap every weight, hand the excess to the uncapped names pro rata.
  function capWeights(weights, cap) {
    var n = weights.length, i;
    if (!n || !(cap > 0) || cap >= 1) return weights.slice();
    if (cap * n < 1) return weights.map(function () { return 1 / n; });
    var w = normalize(weights), capped = weights.map(function () { return false; });
    for (var iter = 0; iter < n + 1; iter++) {
      var excess = 0, freeSum = 0;
      for (i = 0; i < n; i++) if (!capped[i] && w[i] > cap + 1e-12) { excess += w[i] - cap; w[i] = cap; capped[i] = true; }
      if (excess <= 1e-12) break;
      for (i = 0; i < n; i++) if (!capped[i]) freeSum += w[i];
      if (freeSum <= 0) break;
      for (i = 0; i < n; i++) if (!capped[i]) w[i] += excess * (w[i] / freeSum);
    }
    return w;
  }
  // Mirrors toBps() in weighting.ts: integer basis points summing to exactly 10,000 (largest-remainder rounding).
  function toBps(weights) {
    var w = normalize(weights);
    if (!w.length || w.every(function (x) { return x === 0; })) return w.map(function () { return 0; });
    var raw = w.map(function (x) { return x * 10000; }), bps = raw.map(function (x) { return Math.floor(x); });
    var rem = 10000 - bps.reduce(function (a, b) { return a + b; }, 0);
    var order = raw.map(function (x, k) { return { i: k, frac: x - Math.floor(x) }; }).sort(function (a, b) { return b.frac - a.frac || a.i - b.i; });
    for (var k = 0; rem > 0 && k < order.length; k++, rem--) bps[order[k].i] += 1;
    return bps;
  }

  function constituents(s) {
    var inc = [], exc = [];
    var screened = s.construction === 'equal-weight-screened' || s.construction === 'market-cap-screened';
    var byCap = s.construction === 'market-cap-screened';
    s.targets.forEach(function (t) {
      var price = priceOf(t.mint);
      if (!price) { exc.push(t); return; }
      if (screened && s.screen && t.mint !== SOL) {
        if (liquidityOf(t.mint) < s.screen.minLiquidityUsd && volumeOf(t.mint) < s.screen.minVolume24hUsd) { exc.push(t); return; }
      }
      if (byCap && !mcapOf(t.mint)) { exc.push(t); return; }
      inc.push({ symbol: t.symbol, mint: t.mint, weightBps: t.weightBps, sector: t.sector || '' });
    });
    if (byCap && inc.length) {
      // Mirrors marketCapWeights() in the engine.
      var wt = s.weighting || {}, thin = wt.thin, sl = wt.sleeve, slMint = sl && sl.mint, slPx = slMint && state.prices[slMint];
      var names = inc.filter(function (c) { return c.mint !== slMint; }).sort(function (a, b) { return mcapOf(b.mint) - mcapOf(a.mint); });
      exc = exc.concat(names.splice(typeof s.maxPositions === 'number' ? Math.max(1, s.maxPositions) : names.length));
      var isThin = function (c) { return !!thin && !(liquidityOf(c.mint) >= thin.minLiquidityUsd && volumeOf(c.mint) >= thin.minVolume24hUsd); };
      var sleeveLive = !!(slMint && priceOf(slMint)) &&
        (!s.screen || (slPx && typeof slPx.liquidity === 'number' ? slPx.liquidity : 0) >= s.screen.minLiquidityUsd || volumeOf(slMint) >= s.screen.minVolume24hUsd);
      var rules = {
        issuerCap: (wt.maxWeightBps || 10000) / 10000, sectorCap: (wt.maxSectorBps || 10000) / 10000,
        thinNameCap: thin ? thin.maxNameBps / 10000 : 1, thinTotalCap: thin ? thin.maxTotalBps / 10000 : 1,
        sleeveCap: sleeveLive ? sl.maxBps / 10000 : 0,
      };
      var floor = (wt.minWeightBps || 0) / 10000, res = { weights: [], sleeve: 0, unplaced: names.length ? 0 : 1 };
      // Each round drops at least one name below the floor. If every name is dust, none of their weight is placed.
      while (names.length) {
        res = cappedWeights(names.map(function (c) { return { weight: mcapOf(c.mint), sector: c.sector, thin: isThin(c) }; }), rules);
        var below = names.filter(function (_, i) { return res.weights[i] < floor - 1e-12; });
        if (!below.length) break;
        exc = exc.concat(below);
        if (below.length === names.length) {
          res = { weights: [], sleeve: res.sleeve, unplaced: res.unplaced + res.weights.reduce(function (a, x) { return a + x; }, 0) };
          names = [];
          break;
        }
        names = names.filter(function (c) { return below.indexOf(c) === -1; });
      }
      // The sleeve takes what the caps can't place only up to its own cap. The rest stays unplaced (the Terminal blocks
      // deploys then) and is never re-normalised into the names, so these weights can total under 100%.
      var toSleeve = Math.min(res.unplaced, Math.max(0, rules.sleeveCap - res.sleeve));
      var sleeveW = res.sleeve + toSleeve, fractions = res.weights.slice();
      if (sleeveLive && sleeveW > 1e-9) { names.push({ symbol: sl.symbol, mint: slMint, weightBps: 0 }); fractions.push(sleeveW); }
      var bps = toBps(fractions.concat([Math.max(0, res.unplaced - toSleeve)]));
      names.forEach(function (c, j) { c.weightBps = bps[j]; });
      return { included: names.filter(function (c) { return c.weightBps > 0; }), excluded: exc };
    }
    if (s.construction === 'equal-weight-screened' && inc.length) {
      var base = Math.floor(10000 / inc.length), rem = 10000 - base * inc.length;
      inc.forEach(function (c) { c.weightBps = base + (rem-- > 0 ? 1 : 0); });
    } else {
      var sum = inc.reduce(function (a, c) { return a + c.weightBps; }, 0), acc = 0;
      if (sum > 0 && sum !== 10000) {
        inc.forEach(function (c, i) { c.weightBps = i === inc.length - 1 ? 10000 - acc : Math.floor(c.weightBps * 10000 / sum); acc += c.weightBps; });
        // As in the engine: re-normalising after a name drops out must not break the category's single-name limit.
        var capBps = s.maxSingleNameBps;
        if (capBps && inc.some(function (c) { return c.weightBps > capBps; })) {
          var capped = toBps(capWeights(normalize(inc.map(function (c) { return c.weightBps; })), capBps / 10000));
          inc.forEach(function (c, i) { c.weightBps = capped[i]; });
        }
      }
    }
    return { included: inc, excluded: exc };
  }

  // ── Renderers ──────────────────────────────────────────────────────────
  // The homepage picks its own showcase (the Terminal's `featured` flags drive the Terminal's ordering).
  var SITE_FEATURED = ['total-tokenized-stock-index', 'core-etf-portfolio', 'magnificent-7', 'crypto-economy'];
  var BAR_SCALE_BPS = 2500; // every card's bars share one scale: a full bar is a 25% weight
  var CADENCE = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', 'event-driven': 'Event-driven' };
  var WEIGHT_LABEL = { 'equal-weight-screened': 'Equal weight · investable today', 'market-cap-screened': 'Market-cap weight · largest holdings', conviction: 'Top positions · conviction weight', fixed: 'Top positions · model weight' };
  var SKELETONS = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';

  function liveStrategies() { return (state.strategies || []).filter(function (s) { return s.status === 'active'; }); }
  function universeStrategy() {
    return state.strategies && (state.strategies.find(function (s) { return s.id === 'tokenized-stocks-index'; })
      || state.strategies.find(function (s) { return s.construction === 'equal-weight-screened'; }));
  }

  // Strategies that reference a person or a third-party label say they are not affiliated, on every surface.
  // Mirrors affiliationNotes() in the Terminal (lib/strategyStats.ts): short disclosures whole, long ones cut to
  // the sentence that says so (split only after a lowercase letter or digit, so "U.S. House" stays intact).
  function affiliationNotes(s) {
    var re = /not affiliated/i;
    return (s.disclosures || []).filter(function (d) { return re.test(d); }).map(function (d) {
      if (d.length <= 160) return d;
      var hit = d.replace(/([a-z0-9]\.)\s+(?=[A-Z])/g, '$1\n').split('\n').filter(function (x) { return re.test(x); })[0];
      return hit || d;
    });
  }

  // Facts from the catalog itself render as soon as strategies.json arrives, before any market data.
  function renderCatalogFacts() {
    var live = liveStrategies();
    if (!live.length) return;
    setLive('strategyCount', String(live.length));
    var mins = live.map(function (s) { return Number(s.minDeployUsd); }).filter(function (n) { return n > 0; });
    if (mins.length) setLive('minDeploy', usd(Math.min.apply(null, mins), 0));
  }

  function renderStatbar() {
    var uni = universeStrategy();
    if (!uni) return;
    var n = constituents(uni).included.length;
    setLive('investableOf', n + '<small> of ' + uni.targets.length + '</small>');
    setLive('investable', String(n));
    setLive('universeSize', String(uni.targets.length));
  }

  var tapeBand = document.getElementById('tapeBand');
  var pauseBtn = tapeBand && tapeBand.querySelector('.tape__pause');
  if (pauseBtn) pauseBtn.addEventListener('click', function () {
    var paused = !tapeBand.classList.contains('is-paused');
    tapeBand.classList.toggle('is-paused', paused);
    pauseBtn.setAttribute('aria-label', paused ? 'Play live prices' : 'Pause live prices');
  });

  function renderTape() {
    var track = $('#tape');
    if (!track || !state.strategies) return;
    var mints = {};
    liveStrategies().forEach(function (s) { s.targets.forEach(function (t) { if (t.mint !== SOL) mints[t.mint] = t.symbol; }); });
    var rows = Object.keys(mints).filter(function (m) { return markOf(m) != null; })
      .sort(function (a, b) { return liquidityOf(b) - liquidityOf(a); })
      .slice(0, 36)
      .map(function (m) {
        var ch = changeOf(m);
        return '<span class="tick"><b>' + esc(mints[m]) + '</b><span class="px">' + usd(markOf(m)) + '</span>' + (ch == null ? '' : move(ch)) + '</span>';
      }).join('');
    if (!rows) return;
    // The second copy only makes the loop seamless, so assistive technology skips it.
    track.innerHTML = '<div class="tape__set">' + rows + '</div><div class="tape__set" aria-hidden="true">' + rows + '</div>';
    if (tapeBand) tapeBand.hidden = false;
  }

  function tagsFor(s) {
    return (s.code ? '<span class="tag tag--code">' + esc(s.code) + '</span>' : '') +
      '<span class="tag">' + esc(s.category || s.type) + '</span>' +
      (s.labels || []).map(function (l) { return '<span class="tag tag--risk">' + esc(l) + '</span>'; }).join('') +
      '<span class="tag">' + esc(CADENCE[s.cadence] || s.cadence) + ' rebalance</span>';
  }

  function cardHTML(s) {
    var href = 'terminal/?tab=deploy&strategy=' + encodeURIComponent(s.id);
    return '<article class="strat reveal" data-strategy="' + esc(s.id) + '">' +
      '<div class="strat__top">' + tagsFor(s) + '</div>' +
      '<h3 id="st-' + esc(s.id) + '">' + esc(s.name) + '</h3>' +
      '<p class="strat__tag">' + esc(s.tagline || '') + '</p>' +
      '<div class="strat__stats">' +
        '<div><div class="k">Positions</div><div class="v" data-field="positions">—</div></div>' +
        '<div><div class="k">24h move</div><div class="v" data-field="move">—</div></div>' +
        '<div><div class="k">Risk</div><div class="v">' + esc(s.riskLevel) + '/5</div></div>' +
        '<div><div class="k">Minimum</div><div class="v">' + usd(Number(s.minDeployUsd), 0) + '</div></div>' +
      '</div>' +
      '<div class="strat__label">' + esc(WEIGHT_LABEL[s.construction] || 'Top positions') + '</div>' +
      '<div class="bars" data-field="bars">' + SKELETONS + '</div>' +
      '<div class="strat__notes">' + affiliationNotes(s).map(function (n) { return '<p class="strat__note">' + esc(n) + '</p>'; }).join('') + '</div>' +
      '<a class="strat__link" href="' + href + '">Open <span class="sr-only">' + esc(s.name) + ' </span>in the Terminal <span aria-hidden="true">→</span></a></article>';
  }

  function buildCatalog() {
    var grid = $('#strats');
    if (!grid || grid.__built || !state.strategies) return;
    var live = liveStrategies();
    if (!live.length) return;
    grid.__built = true;
    var featured = SITE_FEATURED.map(function (id) { return live.find(function (s) { return s.id === id; }); }).filter(Boolean);
    if (featured.length < 2) featured = live.slice(0, 4);
    grid.innerHTML = featured.map(cardHTML).join('');
    $all('.strat', grid).forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-visible'); });

    // Live strategies only; strategies in committee review get one line, and drafts stay off the public site.
    var rest = live.filter(function (s) { return featured.indexOf(s) === -1; });
    var review = state.strategies.filter(function (s) { return s.status === 'in-review'; });
    var box = $('#catalog'), list = $('#catalogList'), rv = $('#catalogReview');
    if (!box || !list) return;
    list.innerHTML = rest.map(function (s) {
      var meta = [s.category, 'Risk ' + s.riskLevel + '/5'].concat(s.labels || []).concat(['From ' + usd(Number(s.minDeployUsd), 0)]);
      return '<a class="catalog__row" href="terminal/?tab=deploy&strategy=' + encodeURIComponent(s.id) + '">' +
        '<span class="catalog__code">' + esc(s.code || '') + '</span>' +
        '<span class="catalog__main"><span class="catalog__name">' + esc(s.name) + '</span><span class="catalog__meta">' + esc(meta.join(' · ')) + '</span>' +
        affiliationNotes(s).map(function (n) { return '<span class="catalog__note">' + esc(n) + '</span>'; }).join('') + '</span>' +
        '<span class="catalog__go" aria-hidden="true">Open →</span></a>';
    }).join('');
    if (rv && review.length) {
      rv.innerHTML = '<b>In committee review</b>' + esc(review.map(function (s) { return s.name.replace(/ Strategy$/, ''); }).join(', '));
      rv.hidden = false;
    }
    box.hidden = !(rest.length || review.length);
  }

  function basketMove(s) {
    var c = constituents(s), acc = 0, w = 0;
    c.included.forEach(function (x) { var ch = changeOf(x.mint); if (ch != null) { acc += ch * x.weightBps; w += x.weightBps; } });
    return w ? acc / w : null;
  }

  function renderStrategies() {
    if (!state.strategies) return;
    buildCatalog();
    $all('[data-strategy]').forEach(function (card) {
      var s = state.strategies.find(function (x) { return x.id === card.getAttribute('data-strategy'); });
      if (!s) return;
      var c = constituents(s);
      var screened = s.construction === 'equal-weight-screened' || s.construction === 'market-cap-screened';
      var pos = card.querySelector('[data-field="positions"]');
      if (pos) pos.textContent = String(c.included.length);
      var mv = card.querySelector('[data-field="move"]');
      var v = basketMove(s);
      if (mv && v != null) mv.innerHTML = move(v);
      var bars = card.querySelector('[data-field="bars"]');
      if (!bars) return;
      var rows = c.included.slice().sort(function (a, b) { return b.weightBps - a.weightBps; });
      var shown = rows.length <= 7 ? rows : rows.slice(0, 6);
      var html = shown.map(function (r) {
        return '<div class="bar"><span class="bar__sym">' + esc(r.symbol) + '</span>' +
          '<span class="bar__track"><span class="bar__fill" style="width:' + Math.min(100, r.weightBps / BAR_SCALE_BPS * 100).toFixed(2) + '%"></span></span>' +
          '<span class="bar__w">' + (r.weightBps / 100).toFixed(r.weightBps < 1000 ? 2 : 1) + '%</span></div>';
      }).join('');
      if (rows.length > shown.length) html += '<div class="bars__more">+' + (rows.length - shown.length) + ' more' + (screened ? ' · screened from ' + s.targets.length + ' names' : '') + '</div>';
      else if (screened) html += '<div class="bars__more">Screened from ' + s.targets.length + ' names</div>';
      bars.innerHTML = html;
    });
  }

  function renderMonitor() {
    var grid = $('#monitor'), strip = $('#monitorStrip'), toggle = $('#monitorToggle');
    var uni = universeStrategy();
    if (!grid || !uni) return;
    var inc = {};
    constituents(uni).included.forEach(function (c) { inc[c.mint] = true; });
    var cells = uni.targets.slice().sort(function (a, b) {
      var ia = inc[a.mint] ? 1 : 0, ib = inc[b.mint] ? 1 : 0;
      return ib - ia || liquidityOf(b.mint) - liquidityOf(a.mint);
    });
    if (strip) {
      var s = cells.map(function (t) { return '<span' + (inc[t.mint] ? ' class="is-in"' : '') + '></span>'; }).join('');
      if (strip.__html !== s) { strip.innerHTML = s; strip.__html = s; }
    }
    if (toggle && toggle.hidden) {
      toggle.hidden = false;
      toggle.textContent = 'Show all ' + cells.length + ' names';
      toggle.addEventListener('click', function () {
        var open = grid.hidden;
        grid.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Hide the names' : 'Show all ' + uni.targets.length + ' names';
      });
    }
    if (!grid.__tipAlign) {
      grid.__tipAlign = true;
      grid.addEventListener('mouseover', function (e) {
        var cell = e.target.closest && e.target.closest('.cell');
        if (!cell) return;
        var g = grid.getBoundingClientRect(), r = cell.getBoundingClientRect();
        var x = (r.left + r.width / 2 - g.left) / g.width;
        cell.classList.toggle('tip-left', x < 0.3);
        cell.classList.toggle('tip-right', x > 0.7);
      });
    }
    // Rewritten only when something changed; cells are plain list items, so no focus or live region is disturbed.
    var html = cells.map(function (t) {
      var on = !!inc[t.mint];
      var tip = esc(t.symbol) + ' · liquidity ' + compactUsd(liquidityOf(t.mint)) + ' · 24h vol ' + compactUsd(volumeOf(t.mint)) + (on ? ' · investable' : ' · watchlist');
      return '<li class="cell' + (on ? ' is-in' : '') + '">' + esc(t.symbol.replace(/x$/, '')) + '<span class="cell__tip">' + tip + '</span></li>';
    }).join('');
    if (grid.__html !== html) { grid.innerHTML = html; grid.__html = html; }
  }

  // Homepage tiles: the live holding count and a slim weight bar (one grey ramp, largest holding lightest).
  function renderTiles() {
    $all('[data-tile]').forEach(function (tile) {
      var s = state.strategies && state.strategies.find(function (x) { return x.id === tile.getAttribute('data-tile'); });
      if (!s) return;
      var rows = constituents(s).included.slice().sort(function (a, b) { return b.weightBps - a.weightBps; });
      if (!rows.length) return;
      var count = tile.querySelector('[data-field="count"]');
      if (count) count.textContent = String(rows.length);
      var bar = tile.querySelector('[data-field="bar"]');
      if (!bar) return;
      var top = rows.slice(0, 10), rest = rows.slice(10).reduce(function (a, r) { return a + r.weightBps; }, 0);
      var segs = top.map(function (r) { return r.weightBps; });
      if (rest > 0) segs.push(rest);
      var light = [228, 228, 232], dark = [74, 74, 80];
      bar.innerHTML = segs.map(function (w, i) {
        var k = segs.length > 1 ? i / (segs.length - 1) : 0;
        var c = light.map(function (v, j) { return Math.round(v + (dark[j] - v) * k); });
        return '<i style="flex:' + w + ';background:rgb(' + c.join(',') + ')"></i>';
      }).join('');
    });
  }

  function renderAll() {
    renderStatbar();
    renderTape();
    renderStrategies();
    renderMonitor();
    renderTiles();
  }

  // A read-only view of a strategy's live allocation, used by the homepage simulation (assets/forma-sim.js).
  // Null until a complete market data set has loaded, so the simulation never shows partial holdings.
  window.FormaSite = {
    allocation: function (id) {
      if (!hasLive || !state.strategies) return null;
      var s = state.strategies.find(function (x) { return x.id === id; });
      if (!s) return null;
      var rows = constituents(s).included
        .map(function (c) { return { symbol: c.symbol, weightBps: c.weightBps, price: markOf(c.mint) }; })
        .filter(function (r) { return r.weightBps > 0 && r.price > 0; })
        .sort(function (a, b) { return b.weightBps - a.weightBps; });
      return rows.length ? rows : null;
    },
  };

  function showDataStatus(msg) {
    var el = document.getElementById('dataStatus');
    if (!el && msg) {
      el = document.createElement('p');
      el.id = 'dataStatus';
      el.className = 'data-status';
      el.setAttribute('role', 'status');
      var anchor = $('.strats__note') || $('#tiles'); // How it works, or the homepage's tiles
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor.nextSibling);
    }
    if (el) { el.textContent = msg || ''; el.hidden = !msg; }
  }

  function allMints() {
    var set = {}; set[SOL] = 1; set[USDC] = 1;
    liveStrategies().forEach(function (s) {
      s.targets.forEach(function (t) { set[t.mint] = 1; });
      if (s.weighting && s.weighting.sleeve && s.weighting.sleeve.mint) set[s.weighting.sleeve.mint] = 1;
    });
    (state.universe || []).forEach(function (t) { if (t && t.mint) set[t.mint] = 1; });
    return Object.keys(set);
  }

  // Market data renders only from a complete set: prices for every chunk and token stats (the liquidity screen
  // and the index weights need both). Otherwise the page keeps its last good figures, or its placeholders.
  var hasLive = false, refreshDelay = 60000, refreshTimer = 0;
  function loadMarket() {
    var mints = allMints();
    var needTokens = !Object.keys(state.tokens).length;
    return Promise.all([loadPrices(mints), needTokens ? loadTokens(mints.filter(function (m) { return m !== USDC; })) : Promise.resolve(null)])
      .then(function (res) {
        if (res[1]) state.tokens = res[1];
        storePrices(res[0]);
        hasLive = true;
        showDataStatus('');
        renderAll();
        document.dispatchEvent(new CustomEvent('forma:live'));
      });
  }
  function scheduleRefresh(ms) {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(function tick() {
      if (document.hidden) { refreshTimer = setTimeout(tick, 15000); return; }
      loadMarket().then(function () { refreshDelay = 60000; scheduleRefresh(refreshDelay); }, function () {
        refreshDelay = Math.min(refreshDelay * 2, 300000);
        if (!hasLive) showDataStatus('Live prices are unavailable right now. The Terminal has the latest.');
        scheduleRefresh(refreshDelay);
      });
    }, ms);
  }

  Promise.all([loadStrategies(), loadUniverse()]).then(function (loaded) {
    var s = loaded[0];
    if (!s) return;
    state.strategies = s;
    state.universe = loaded[1];
    renderCatalogFacts();
    buildCatalog();
    return loadMarket().then(function () { scheduleRefresh(60000); }, function () {
      showDataStatus('Live prices are unavailable right now. Retrying shortly; the Terminal has the latest.');
      scheduleRefresh(20000);
    });
  }).catch(function () { /* the static page still works without live data */ });
})();
