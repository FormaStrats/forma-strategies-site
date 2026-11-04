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

  // ── Hero field (native resolution) ─────────────────────────────────────
  var canvas = document.getElementById('heroField');
  if (canvas && window.FormaField) {
    try {
      window.FormaField.create(canvas, { ribbonY: 0.7, intensity: 1, strands: 76, particles: 340 });
      requestAnimationFrame(function () { setTimeout(function () { canvas.classList.add('is-live'); }, 120); });
    } catch (e) { /* poster image stays visible */ }
  }

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
  function pct(n) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }
  function setLive(key, html) { $all('[data-live="' + key + '"]').forEach(function (el) { el.innerHTML = html; }); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function getJSON(url) {
    return fetch(url, { headers: { Accept: 'application/json' } }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.json();
    });
  }
  function chunk(arr, n) { var out = []; for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; }

  // ── US market session (America/New_York) ───────────────────────────────
  var HOLIDAYS = ['2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25',
    '2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24'];
  function session() {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short' });
    var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    var key = p.year + '-' + p.month + '-' + p.day;
    var h = Number(p.hour) % 24, m = Number(p.minute), mins = h * 60 + m;
    if (p.weekday === 'Sat' || p.weekday === 'Sun') return 'Weekend';
    if (HOLIDAYS.indexOf(key) !== -1) return 'Holiday';
    if (mins >= 570 && mins < 960) return '<span class="up">Open</span>';
    if (mins >= 240 && mins < 570) return 'Pre-market';
    if (mins >= 960 && mins < 1200) return 'After hours';
    return 'Overnight';
  }
  setLive('session', session());

  // ── Data ───────────────────────────────────────────────────────────────
  var state = { strategies: null, universe: null, prices: {}, tokens: {} };

  function loadStrategies() {
    return getJSON('terminal/data/strategies.json').catch(function () { return null; });
  }
  // Every token in the Terminal's registry (dapp/src/strategies/universe.ts), exported with strategies.json.
  function loadUniverse() {
    return getJSON('terminal/data/universe.json').then(function (u) { return Array.isArray(u) && u.length ? u : null; }).catch(function () { return null; });
  }

  function loadPrices(mints) {
    return Promise.all(chunk(mints, 50).map(function (g) { return getJSON(JUP + '/price/v3?ids=' + g.join(',')).catch(function () { return {}; }); }))
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
    return Promise.all(chunk(mints, 100).map(function (g) { return getJSON(JUP + '/tokens/v2/search?query=' + g.join(',')).catch(function () { return []; }); }))
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
  function renderStatbar() {
    var sol = state.prices[SOL];
    if (sol) {
      var ch = sol.priceChange24h || 0;
      setLive('sol', usd(sol.usdPrice) + '<small class="' + (ch >= 0 ? 'up' : 'down') + '">' + pct(ch) + '</small>');
    }
    // xStocks live: every xStock in the Terminal's registry with a market price (the Universe strategy's targets if the
    // registry file is missing), so names a strategy leaves out by mandate still count.
    var uni = universeStrategy();
    var xs = state.universe ? state.universe.filter(function (t) { return t.mint !== SOL && t.assetClass !== 'digital-asset'; }) : uni && uni.targets;
    if (xs) setLive('tracked', String(xs.filter(function (t) { return markOf(t.mint) != null; }).length));
    if (uni) {
      var c = constituents(uni);
      var liq = uni.targets.reduce(function (a, t) { return a + liquidityOf(t.mint); }, 0);
      setLive('investable', String(c.included.length));
      setLive('universeSize', String(uni.targets.length));
      setLive('liquidity', compactUsd(liq));
    }
  }

  function renderTape() {
    var track = $('#tape');
    if (!track || !state.strategies) return;
    var mints = {};
    state.strategies.forEach(function (s) {
      if (s.status !== 'active') return; // live products only
      s.targets.forEach(function (t) { if (t.mint !== SOL) mints[t.mint] = t.symbol; });
    });
    var rows = Object.keys(mints).filter(function (m) { return markOf(m) != null; })
      .sort(function (a, b) { return liquidityOf(b) - liquidityOf(a); })
      .slice(0, 36)
      .map(function (m) {
        var ch = changeOf(m);
        var icon = iconOf(m);
        return '<span class="tick">' +
          (icon ? '<img src="' + esc(icon) + '" alt="" width="26" height="26" loading="lazy" decoding="async" />' : '') +
          '<b>' + esc(mints[m]) + '</b><span class="px">' + usd(markOf(m)) + '</span>' +
          (ch == null ? '' : '<span class="ch ' + (ch >= 0 ? 'up' : 'down') + '">' + pct(ch) + '</span>') + '</span>';
      }).join('');
    if (!rows) return;
    track.innerHTML = rows + rows; // duplicated for a seamless loop
  }

  function universeStrategy() {
    return state.strategies && (state.strategies.find(function (s) { return s.id === 'tokenized-stocks-index'; })
      || state.strategies.find(function (s) { return s.construction === 'equal-weight-screened'; }));
  }

  var CADENCE = { weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly', 'event-driven': 'Event-driven' };
  var WEIGHT_LABEL = { 'equal-weight-screened': 'Equal weight · investable today', 'market-cap-screened': 'Market-cap weight · largest holdings', conviction: 'Top positions · conviction weight', fixed: 'Top positions · model weight' };
  var SKELETONS = '<div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div><div class="skel"></div>';

  function liveStrategies() { return (state.strategies || []).filter(function (s) { return s.status === 'active'; }); }

  function buildCatalog() {
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
    var grid = $('#strats');
    if (!grid || grid.__built || !state.strategies) return;
    var live = liveStrategies();
    if (!live.length) return;
    grid.__built = true;
    var featured = live.filter(function (s) { return s.featured; });
    if (featured.length < 2) featured = live.slice(0, 4);
    featured = featured.slice(0, 4);
    grid.innerHTML = featured.map(function (s) {
      var href = 'terminal/?tab=deploy&strategy=' + encodeURIComponent(s.id);
      return '<article class="strat reveal" data-strategy="' + esc(s.id) + '">' +
        '<div class="strat__top"><span class="tag tag--accent">' + esc(s.category || s.type) + '</span><span class="tag">' + esc(CADENCE[s.cadence] || s.cadence) + ' rebalance</span>' + (s.code ? '<span class="tag tag--code">' + esc(s.code) + '</span>' : '') + '</div>' +
        '<h3>' + esc(s.name) + '</h3>' +
        '<p class="strat__tag">' + esc(s.tagline || '') + '</p>' +
        affiliationNotes(s).map(function (n) { return '<p class="strat__note">' + esc(n) + '</p>'; }).join('') +
        '<div class="strat__stats"><div><div class="k">Positions</div><div class="v" data-field="positions">—</div></div><div><div class="k">24h basket</div><div class="v" data-field="move">—</div></div><div><div class="k">Deploy fee</div><div class="v">' + usd(s.fees.deployUsd) + '</div></div></div>' +
        '<div class="strat__label">' + esc(WEIGHT_LABEL[s.construction] || 'Top positions') + '</div>' +
        '<div class="bars" data-field="bars">' + SKELETONS + '</div>' +
        '<a class="btn btn--metal btn--block" href="' + href + '">Deploy ' + esc(s.shortName) + ' →</a></article>';
    }).join('');
    // The generated cards reveal like the static ones did: the weight bars only fill once a card is .is-visible.
    $all('.strat', grid).forEach(function (el) { if (io) io.observe(el); else el.classList.add('is-visible'); });

    var rest = live.filter(function (s) { return featured.indexOf(s) === -1; });
    var review = (state.strategies || []).filter(function (s) { return s.status === 'in-review' || s.status === 'draft'; });
    var box = $('#catalog'), list = $('#catalogList');
    setLive('strategyCount', String(live.length));
    if (!box || !list || (!rest.length && !review.length)) return;
    list.innerHTML = rest.map(function (s) {
      return '<a class="catalog__row" data-row="' + esc(s.id) + '" href="terminal/?tab=deploy&strategy=' + encodeURIComponent(s.id) + '">' +
        '<span class="catalog__code">' + esc(s.code || '') + '</span>' +
        '<span class="catalog__main"><span class="catalog__name">' + esc(s.name) + '</span><span class="catalog__meta">' + esc(s.category) + ' · Risk ' + esc(s.riskLevel) + '/5 · ' + esc(s.tagline || '') + '</span></span>' +
        '<span class="catalog__move" data-field="move">—</span></a>';
    }).join('') + review.map(function (s) {
      return '<div class="catalog__row catalog__row--review"><span class="catalog__code">' + esc(s.code || '') + '</span>' +
        '<span class="catalog__main"><span class="catalog__name">' + esc(s.name) + '</span><span class="catalog__meta">' + (s.status === 'draft' ? 'Draft' : 'In committee review') + ' · ' + esc(s.category) + '</span></span><span class="catalog__move"></span></div>';
    }).join('');
    box.hidden = false;
  }

  function basketMove(s) {
    var c = constituents(s), acc = 0, w = 0;
    c.included.forEach(function (x) { var ch = changeOf(x.mint); if (ch != null) { acc += ch * x.weightBps; w += x.weightBps; } });
    return w ? acc / w : null;
  }

  function renderStrategies() {
    if (!state.strategies) return;
    buildCatalog();
    $all('[data-row]').forEach(function (row) {
      var s = state.strategies.find(function (x) { return x.id === row.getAttribute('data-row'); });
      var mv = s && row.querySelector('[data-field="move"]');
      var v = s ? basketMove(s) : null;
      if (mv && v != null) { mv.textContent = pct(v); mv.className = 'catalog__move ' + (v >= 0 ? 'up' : 'down'); }
    });
    $all('[data-strategy]').forEach(function (card) {
      var s = state.strategies.find(function (x) { return x.id === card.getAttribute('data-strategy'); });
      if (!s) return;
      var c = constituents(s);
      var screened = s.construction === 'equal-weight-screened' || s.construction === 'market-cap-screened';
      var pos = card.querySelector('[data-field="positions"]');
      if (pos) pos.textContent = screened ? c.included.length + '/' + s.targets.length : String(c.included.length);
      var acc = 0, w = 0;
      c.included.forEach(function (x) { var ch = changeOf(x.mint); if (ch != null) { acc += ch * x.weightBps; w += x.weightBps; } });
      var mv = card.querySelector('[data-field="move"]');
      if (mv && w) { var v = acc / w; mv.textContent = pct(v); mv.className = 'v ' + (v >= 0 ? 'up' : 'down'); }
      var bars = card.querySelector('[data-field="bars"]');
      if (!bars) return;
      var rows = c.included.slice().sort(function (a, b) { return b.weightBps - a.weightBps; });
      var peak = rows.length ? rows[0].weightBps : 1;
      var html = rows.slice(0, 6).map(function (r) {
        var icon = iconOf(r.mint);
        return '<div class="bar">' +
          (icon ? '<img src="' + esc(icon) + '" alt="" width="24" height="24" loading="lazy" decoding="async" />' : '<span></span>') +
          '<span class="bar__sym">' + esc(r.symbol) + '</span>' +
          '<span class="bar__track"><span class="bar__fill" style="width:' + (r.weightBps / peak * 100).toFixed(2) + '%"></span></span>' +
          '<span class="bar__w">' + (r.weightBps / 100).toFixed(r.weightBps < 1000 ? 2 : 1) + '%</span></div>';
      }).join('');
      if (rows.length > 6) html += '<div class="bars__more">+' + (rows.length - 6) + ' more' + (screened && c.excluded.length ? ' · ' + c.excluded.length + ' not held today' : '') + '</div>';
      bars.innerHTML = html;
    });
  }

  function renderMonitor() {
    var grid = $('#monitor');
    var uni = universeStrategy();
    if (!grid || !uni) return;
    var inc = {};
    constituents(uni).included.forEach(function (c) { inc[c.mint] = true; });
    var cells = uni.targets.slice().sort(function (a, b) {
      var ia = inc[a.mint] ? 1 : 0, ib = inc[b.mint] ? 1 : 0;
      return ib - ia || liquidityOf(b.mint) - liquidityOf(a.mint);
    });
    if (!grid.__tipAlign) {
      grid.__tipAlign = true;
      var align = function (e) {
        var cell = e.target.closest && e.target.closest('.cell');
        if (!cell) return;
        var g = grid.getBoundingClientRect(), r = cell.getBoundingClientRect();
        var x = (r.left + r.width / 2 - g.left) / g.width;
        cell.classList.toggle('tip-left', x < 0.3);
        cell.classList.toggle('tip-right', x > 0.7);
      };
      grid.addEventListener('mouseover', align);
      grid.addEventListener('focusin', align);
    }
    grid.innerHTML = cells.map(function (t) {
      var on = !!inc[t.mint];
      var tip = esc(t.symbol) + ' · liquidity ' + compactUsd(liquidityOf(t.mint)) + ' · 24h vol ' + compactUsd(volumeOf(t.mint)) + (on ? ' · investable' : ' · watchlist');
      return '<div class="cell' + (on ? ' is-in' : '') + '" tabindex="0" aria-label="' + tip + '">' + esc(t.symbol.replace(/x$/, '')) + '<span class="cell__tip">' + tip + '</span></div>';
    }).join('');
  }

  function renderAll() {
    renderStatbar();
    renderTape();
    renderStrategies();
    renderMonitor();
  }

  function refreshPrices() {
    if (!state.strategies || document.hidden) return Promise.resolve();
    var mints = allMints();
    return loadPrices(mints).then(function (p) {
      storePrices(p);
      renderAll();
    });
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

  Promise.all([loadStrategies(), loadUniverse()]).then(function (loaded) {
    var s = loaded[0];
    if (!s) return;
    state.strategies = s;
    state.universe = loaded[1];
    var mints = allMints();
    // SOL is included so its icon shows in cards that hold it (the screens and the tape skip SOL).
    return Promise.all([loadPrices(mints), loadTokens(mints.filter(function (m) { return m !== USDC; }))]).then(function (res) {
      storePrices(res[0]);
      state.tokens = res[1];
      renderAll();
      setInterval(refreshPrices, 60000);
    });
  }).catch(function () { /* the static page still works without live data */ });
})();
