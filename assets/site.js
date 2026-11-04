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
  var state = { strategies: null, prices: {}, tokens: {} };

  function effectiveMultiplier(cfg) {
    if (!cfg) return 1;
    var eff = cfg.newMultiplierEffectiveAt ? Date.parse(cfg.newMultiplierEffectiveAt) : NaN;
    var m = isFinite(eff) && Date.now() >= eff ? Number(cfg.newMultiplier) : Number(cfg.multiplier);
    return isFinite(m) && m > 0 ? m : 1;
  }

  function loadStrategies() {
    return getJSON('terminal/data/strategies.json').catch(function () { return null; });
  }

  function loadPrices(mints) {
    return Promise.all(chunk(mints, 50).map(function (g) { return getJSON(JUP + '/price/v3?ids=' + g.join(',')).catch(function () { return {}; }); }))
      .then(function (parts) { var out = {}; parts.forEach(function (p) { Object.keys(p || {}).forEach(function (k) { out[k] = p[k]; }); }); return out; });
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
  function priceOf(mint) {
    var p = state.prices[mint];
    if (!p) return null;
    return p.stockData && typeof p.stockData.price === 'number' ? p.stockData.price : p.usdPrice;
  }
  function iconOf(mint) { var t = state.tokens[mint]; return t && t.icon; }

  function constituents(s) {
    var inc = [], exc = [];
    s.targets.forEach(function (t) {
      var price = priceOf(t.mint);
      if (!price) { exc.push(t); return; }
      if (s.construction === 'equal-weight-screened' && s.screen && t.mint !== SOL) {
        if (liquidityOf(t.mint) < s.screen.minLiquidityUsd && volumeOf(t.mint) < s.screen.minVolume24hUsd) { exc.push(t); return; }
      }
      inc.push({ symbol: t.symbol, mint: t.mint, weightBps: t.weightBps });
    });
    if (s.construction === 'equal-weight-screened' && inc.length) {
      var base = Math.floor(10000 / inc.length), rem = 10000 - base * inc.length;
      inc.forEach(function (c) { c.weightBps = base + (rem-- > 0 ? 1 : 0); });
    } else {
      var sum = inc.reduce(function (a, c) { return a + c.weightBps; }, 0);
      if (sum && sum !== 10000) inc.forEach(function (c) { c.weightBps = Math.round(c.weightBps * 10000 / sum); });
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
    var uni = state.strategies && state.strategies.find(function (s) { return s.construction === 'equal-weight-screened'; });
    if (uni) {
      var tracked = uni.targets.filter(function (t) { return priceOf(t.mint); }).length;
      var c = constituents(uni);
      var liq = uni.targets.reduce(function (a, t) { return a + liquidityOf(t.mint); }, 0);
      setLive('tracked', String(tracked));
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
    var rows = Object.keys(mints).filter(function (m) { return priceOf(m); })
      .sort(function (a, b) { return liquidityOf(b) - liquidityOf(a); })
      .slice(0, 36)
      .map(function (m) {
        var ch = changeOf(m);
        var icon = iconOf(m);
        return '<span class="tick">' +
          (icon ? '<img src="' + esc(icon) + '" alt="" width="26" height="26" loading="lazy" decoding="async" />' : '') +
          '<b>' + esc(mints[m]) + '</b><span class="px">' + usd(priceOf(m)) + '</span>' +
          (ch == null ? '' : '<span class="ch ' + (ch >= 0 ? 'up' : 'down') + '">' + pct(ch) + '</span>') + '</span>';
      }).join('');
    if (!rows) return;
    track.innerHTML = rows + rows; // duplicated for a seamless loop
  }

  function renderStrategies() {
    if (!state.strategies) return;
    $all('[data-strategy]').forEach(function (card) {
      var s = state.strategies.find(function (x) { return x.id === card.getAttribute('data-strategy'); });
      if (!s) return;
      var c = constituents(s);
      var screened = s.construction === 'equal-weight-screened';
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
      if (rows.length > 6) html += '<div class="bars__more">+' + (rows.length - 6) + ' more' + (screened && c.excluded.length ? ' · ' + c.excluded.length + ' on watchlist' : '') + '</div>';
      bars.innerHTML = html;
    });
  }

  function renderMonitor() {
    var grid = $('#monitor');
    var uni = state.strategies && state.strategies.find(function (s) { return s.construction === 'equal-weight-screened'; });
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
      Object.keys(p).forEach(function (k) {
        var v = p[k]; if (v && typeof v.usdPrice === 'number') { v.multiplier = effectiveMultiplier(v.scaledUiConfig); state.prices[k] = v; }
      });
      renderAll();
    });
  }

  function allMints() {
    var set = {}; set[SOL] = 1; set[USDC] = 1;
    (state.strategies || []).forEach(function (s) { if (s.status === 'active') s.targets.forEach(function (t) { set[t.mint] = 1; }); });
    return Object.keys(set);
  }

  loadStrategies().then(function (s) {
    if (!s) return;
    state.strategies = s;
    var mints = allMints();
    return Promise.all([loadPrices(mints), loadTokens(mints.filter(function (m) { return m !== SOL && m !== USDC; }))]).then(function (res) {
      Object.keys(res[0]).forEach(function (k) { var v = res[0][k]; if (v && typeof v.usdPrice === 'number') state.prices[k] = v; });
      state.tokens = res[1];
      renderAll();
      setInterval(refreshPrices, 60000);
    });
  }).catch(function () { /* the static page still works without live data */ });
})();
