/* Forma homepage simulation: a wallet holding 1,000 USDC connects to Forma, chooses the Total Tokenized Stock Index,
   approves in the wallet, and receives the portfolio. One clock drives every element (render(t)), so the film stays
   crisp at any size and exports to video frame by frame through window.FormaSim.seek(t). It uses the strategy's live
   weights once the page has a complete market data set (assets/site.js), and a dated snapshot until then.
   Like the engine, it asks for one wallet approval per 20 positions and delivers each batch before asking for the
   next, so the film's length follows the number of holdings. Visitors land on the delivery; the loop then shows how. */
(function () {
  'use strict';
  var root = document.getElementById('sim');
  var screen = document.getElementById('simScreen');
  if (!root || !screen) return;

  var STRATEGY = 'total-tokenized-stock-index';
  var DEPOSIT = 1000;
  var AFTER = 997.3; // illustrative trading costs (routing fees and spread); network fees are paid in SOL
  var MAX_PER_APPROVAL = 20; // the engine signs up to 20 positions per wallet approval
  var LEGS_IN_VIEW = 21; // delivery rows that fit on the engine screen
  // [symbol, weight in basis points, price in USD]: the Total Index on AS_OF, used until live data arrives.
  var AS_OF = '5 Nov 2026';
  var SNAPSHOT = [['AAPLx', 1579, 344.13], ['NVDAx', 1503, 183.39], ['MSFTx', 1283, 537.57], ['GOOGLx', 1105, 284.35],
    ['AMZNx', 894, 260.06], ['SPYx', 861, 737.16], ['METAx', 501, 605.13], ['TSLAx', 473, 343.15], ['BRK.Bx', 385, 574.84],
    ['AVGOx', 160, 297.88], ['LLYx', 160, 1386.54], ['WMTx', 160, 128.97], ['XOMx', 160, 168.63], ['PLTRx', 129, 155.17],
    ['KOx', 128, 95.83], ['CVXx', 105, 216.48], ['PGx', 96, 167], ['INTCx', 96, 54.04], ['UNHx', 91, 397.45],
    ['NFLXx', 69, 65.15], ['MCDx', 62, 276.72]];

  // Screen coordinates (the phone screen is laid out at 360 x 760; see .sim__screen in site.css).
  var AT = {
    rest: [300, 700], select: [180, 446], phantom: [150, 516], card0: [180, 208], field: [180, 456],
    deploy: [180, 534], approve: [263, 711],
  };
  // Taps before the first approval: [finger starts moving, arrives, target]. The press lands just after arrival.
  var TAPS = [[2.0, 2.5, 'select'], [3.1, 3.5, 'phantom'], [6.0, 6.45, 'card0'], [6.8, 7.1, 'field'], [8.35, 8.7, 'deploy']];
  var KEYS = [7.45, 7.7, 7.95, 8.2]; // typing 1, 0, 0, 0
  var SHEET0 = 9.1; // the first approval sheet starts to rise
  var LEG_TIME = 0.35; // one delivery, from start to tick

  function $(sel) { return screen.querySelector('[data-x="' + sel + '"]'); }
  var el = {};
  ['wallet', 'dapp', 'bal', 'balnote', 'rows', 'pill', 'intro', 'select', 'choose', 'card0', 'card1', 'card2', 'card0meta', 'mini',
    'field', 'amount', 'caret', 'deploy', 'engine', 'done', 'total', 'prog', 'legs', 'picker', 'phantom', 'phstate', 'sheet',
    'sheetTitle', 'sheetMeta', 'sheetRows', 'tap', 'check', 'checkN'].forEach(function (k) { el[k] = $(k); });
  var stepItems = Array.prototype.slice.call(document.querySelectorAll('#simSteps [data-step]'));
  var toggle = document.getElementById('simToggle');
  var device = root.querySelector('.sim__device');
  var phone = root.querySelector('.sim__phone');
  var src = root.querySelector('[data-sim="src"]');

  // ── Helpers ────────────────────────────────────────────────────────────
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function ease(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function seg(t, a, b) { return ease(clamp((t - a) / (b - a), 0, 1)); }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function qty(n) { return n.toLocaleString('en-US', { minimumFractionDigits: n < 1 ? 4 : 3, maximumFractionDigits: n < 1 ? 4 : 3 }); }
  function mono(sym) { return sym.replace(/x$/, '').replace(/[^A-Z]/g, '').slice(0, 2); }
  function style(node, opacity, transform) {
    if (!node) return;
    var o = String(Math.round(opacity * 1000) / 1000);
    if (node.__o !== o) { node.style.opacity = o; node.style.visibility = opacity <= 0.001 ? 'hidden' : 'visible'; node.__o = o; }
    if (transform != null && node.__t !== transform) { node.style.transform = transform; node.__t = transform; }
  }

  // ── Data ───────────────────────────────────────────────────────────────
  var data = null, plan = null, pending = null;
  function build(rows, live) {
    var total = rows.reduce(function (a, r) { return a + r.weightBps; }, 0) || 1;
    var list = rows.map(function (r) {
      var w = r.weightBps / total;
      return { symbol: r.symbol, w: w, buy: DEPOSIT * w, value: AFTER * w, qty: (AFTER * w) / r.price };
    });
    return { live: !!live, list: list, n: list.length };
  }
  function fromSnapshot() { return build(SNAPSHOT.map(function (r) { return { symbol: r[0], weightBps: r[1], price: r[2] }; })); }

  // ── Timeline: fixed beats to connect and choose; the approvals, deliveries and ending follow the count ──
  function schedule(n) {
    var batches = [], b;
    for (b = 0; b * MAX_PER_APPROVAL < n; b++) batches.push(Math.min(MAX_PER_APPROVAL, n - b * MAX_PER_APPROVAL));
    var gap = n > 1 ? clamp(2.9 / (n - 1), 0.06, 0.15) : 0.15; // bigger portfolios deliver faster
    var sheets = [], legs = [], taps = TAPS.slice(), at = SHEET0, from = 0;
    for (b = 0; b < batches.length; b++) {
      var sheet = { from: from, count: batches[b], open: at, close: at + 1.55 };
      taps.push([at + 0.7, at + 1.15, 'approve']); // pressed at about +1.2 to +1.5; the sheet closes after
      sheets.push(sheet);
      var first = sheet.close + (b === 0 ? 0.55 : 0.25); // the engine screen comes in after the first approval
      for (var k = 0; k < batches[b]; k++) legs.push(first + k * gap);
      from += batches[b];
      at = legs[legs.length - 1] + LEG_TIME + 0.15; // the next approval once this batch is delivered
    }
    var p = { sheets: sheets, legs: legs, taps: taps };
    p.lastDone = legs[legs.length - 1] + LEG_TIME;
    p.dip = p.lastDone + 0.5; // hold on n / n, then dip to the wallet
    p.wallet = p.dip + 0.25; // the wallet starts to come back
    p.full = p.wallet + 1.45; // every holding is in
    p.end = p.wallet + 4.9; // the screen starts to fade out
    p.T = p.end + 0.5;
    p.start = p.lastDone - 0.3; // where visitors land: the last delivery
    p.rest = p.full + 0.4; // the still frame for reduced motion
    p.steps = [0, 5.3, SHEET0 - 0.1, legs[0]];
    return p;
  }

  var rowEls = [], legEls = [], usdcRow = null;
  function paint() {
    // Wallet rows: USDC first (it empties), then the delivered positions.
    var h = '<div class="sx-row sx-row--usdc" data-row="usdc"><i>$</i><span class="sx-sym">USDC<small>' + qty(DEPOSIT) + '</small></span><span class="sx-val">' + money(DEPOSIT) + '</span></div>';
    data.list.forEach(function (r) {
      h += '<div class="sx-row"><i>' + mono(r.symbol) + '</i><span class="sx-sym">' + r.symbol + '<small>' + qty(r.qty) + '</small></span><span class="sx-val">' + money(r.value) + '</span></div>';
    });
    el.rows.innerHTML = h;
    usdcRow = el.rows.querySelector('[data-row="usdc"]');
    rowEls = Array.prototype.slice.call(el.rows.querySelectorAll('.sx-row:not(.sx-row--usdc)'));
    el.legs.innerHTML = data.list.map(function (r) {
      return '<div class="sx-leg"><span>' + r.symbol + '</span><span class="sx-leg-amt">' + money(r.buy) + '</span><i class="sx-leg-st"></i></div>';
    }).join('');
    legEls = Array.prototype.slice.call(el.legs.querySelectorAll('.sx-leg'));
    el.legs.__t = null;
    el.legs.parentNode.classList.toggle('is-scroll', legEls.length > LEGS_IN_VIEW); // soft edges when the list scrolls
    el.total.textContent = String(data.n);
    el.card0meta.textContent = data.n + ' holdings · Risk 3/5';
    el.balnote.innerHTML = data.n + ' holdings <span>· after trading costs</span>';
    if (el.checkN) el.checkN.textContent = String(data.n);
    // A miniature of the weights for the strategy card.
    el.mini.innerHTML = data.list.slice(0, 12).map(function (r) { return '<i style="flex:' + Math.max(0.6, r.w * 100).toFixed(2) + '"></i>'; }).join('');
    for (var k = 0; k < legEls.length; k++) legEls[k].__s = null;
    if (src) src.textContent = data.live ? 'Live weights of the Total Tokenized Stock Index.' : 'Total Tokenized Stock Index weights as of ' + AS_OF + '.';
  }
  function apply(d) { data = d; plan = schedule(d.n); paint(); sheetIdx = -1; }

  function sheetContent(b) {
    var sheet = plan.sheets[b], count = sheet.count;
    el.sheetTitle.textContent = count + (count === 1 ? ' transaction' : ' transactions');
    el.sheetMeta.textContent = 'Forma · Total Tokenized Stock Index' + (plan.sheets.length > 1 ? ' · ' + (b + 1) + ' of ' + plan.sheets.length : '');
    var slice = data.list.slice(sheet.from, sheet.from + count);
    var rows = slice.slice(0, 3).map(function (r) { return '<p><span>Swap USDC → ' + r.symbol + '</span><span>' + money(r.buy) + '</span></p>'; }).join('');
    if (slice.length > 3) rows += '<p class="sx-more">+' + (slice.length - 3) + ' more</p>';
    el.sheetRows.innerHTML = rows;
  }

  // ── Render one moment ──────────────────────────────────────────────────
  var sheetIdx = -1;
  function render(t) {
    var p = plan;
    t = clamp(t, 0, p.T);
    var screenIn = seg(t, 0, 0.35) * (1 - seg(t, p.end, p.end + 0.5));
    screen.style.opacity = String(Math.round(screenIn * 1000) / 1000);

    // Layers: the wallet, then Forma in the wallet's browser, then (after a short dip) the wallet again.
    var back = t >= p.dip;
    var walletOp = back ? seg(t, p.wallet, p.wallet + 0.25) : 1 - seg(t, 1.3, 1.8);
    style(el.wallet, walletOp, 'scale(' + (1 - 0.02 * (1 - walletOp)).toFixed(4) + ')');
    var dappOp = seg(t, 1.3, 1.8) * (1 - seg(t, p.dip, p.dip + 0.25));
    style(el.dapp, dappOp, 'scale(' + (0.98 + 0.02 * seg(t, 1.3, 1.8)).toFixed(4) + ')');

    // Wallet contents: the USDC leaves, the balance shows the after-cost value, and the holdings arrive.
    var usdcOut = back ? seg(t, p.wallet + 0.35, p.wallet + 0.75) : 0;
    var balText = money(back && t >= p.wallet + 0.45 ? AFTER : DEPOSIT);
    if (el.bal.textContent !== balText) el.bal.textContent = balText;
    style(el.balnote, back ? seg(t, p.wallet + 1.1, p.wallet + 1.5) : 0, null);
    style(usdcRow, 1 - usdcOut, 'translateX(' + (-24 * usdcOut).toFixed(1) + 'px)');
    if (usdcRow) usdcRow.style.height = (60 * (1 - usdcOut)).toFixed(1) + 'px';
    for (var i = 0; i < rowEls.length; i++) {
      var r0 = p.wallet + 0.5 + Math.min(i, 9) * 0.05; // rows below the fold arrive with the tenth
      var q = back ? seg(t, r0, r0 + 0.45) : 0;
      style(rowEls[i], q, 'translateY(' + (14 * (1 - q)).toFixed(1) + 'px)');
    }
    var scrollMax = Math.max(0, rowEls.length * 60 - 500);
    var scroll = back ? scrollMax * seg(t, p.wallet + 2.2, p.wallet + 3.8) : 0;
    el.rows.style.transform = 'translateY(' + (-scroll).toFixed(1) + 'px)';
    var toastIn = back ? seg(t, p.wallet + 1.35, p.wallet + 1.75) : 0;
    style(el.check, toastIn * (1 - seg(t, p.end - 0.5, p.end - 0.1)), 'translate(-50%,' + (10 * (1 - toastIn)).toFixed(1) + 'px)');

    // Forma: intro and connect.
    style(el.intro, 1 - seg(t, 5.3, 5.7), 'translateY(' + (-10 * seg(t, 5.3, 5.7)).toFixed(1) + 'px)');
    style(el.select, 1 - seg(t, 2.75, 3.1), null); // hidden by the wallet list, and not needed once connected
    var pickIn = seg(t, 2.75, 3.1) * (1 - seg(t, 4.7, 5.1));
    style(el.picker, pickIn > 0 ? 1 : 0, 'translateY(' + (100 * (1 - pickIn)).toFixed(2) + '%)');
    el.phantom.classList.toggle('is-on', t >= 3.6);
    var ph = t < 3.7 ? '' : t < 4.5 ? 'Connecting…' : 'Connected';
    if (el.phstate.textContent !== ph) el.phstate.textContent = ph;
    style(el.pill, seg(t, 4.5, 4.8), null);

    // Forma: choose, then deliver.
    var s0 = p.sheets[0];
    style(el.choose, seg(t, 5.4, 6.0) * (1 - seg(t, s0.close, s0.close + 0.3)), null);
    [el.card0, el.card1, el.card2].forEach(function (c, k) { var e = seg(t, 5.4 + 0.1 * k, 5.9 + 0.1 * k); style(c, e, 'translateY(' + (12 * (1 - e)).toFixed(1) + 'px)'); });
    el.card0.classList.toggle('is-on', t >= 6.5);
    var focus = t >= 7.15 && t < 8.75;
    el.field.classList.toggle('is-focus', focus);
    var typed = KEYS.filter(function (k) { return t >= k; }).length;
    var amt = ['', '1', '10', '100', '1,000'][typed];
    if (el.amount.textContent !== amt) el.amount.textContent = amt;
    el.caret.style.opacity = focus && Math.floor(t * 2.4) % 2 === 0 ? '1' : '0';
    el.deploy.classList.toggle('is-ready', typed === 4);
    style(el.engine, seg(t, s0.close + 0.1, s0.close + 0.5), null);

    // The wallet's approval sheets: one per 20 positions, each after the previous batch is delivered.
    var open = 0, idx = 0;
    for (var b = 0; b < p.sheets.length; b++) {
      var sheet = p.sheets[b];
      if (t >= sheet.open - 0.05) idx = b;
      open = Math.max(open, seg(t, sheet.open, sheet.open + 0.4) * (1 - seg(t, sheet.close, sheet.close + 0.35)));
    }
    if (idx !== sheetIdx) { sheetContent(idx); sheetIdx = idx; }
    style(el.sheet, open > 0 ? 1 : 0, 'translateY(' + (100 * (1 - open)).toFixed(2) + '%)');

    // The engine: each delivery ticks in turn, and the list keeps the newest in view.
    var done = 0, started = 0;
    for (var j = 0; j < legEls.length; j++) {
      var a = p.legs[j], st = t < a ? 'wait' : t < a + LEG_TIME ? 'run' : 'done';
      if (t >= a) started = j + 1;
      if (st === 'done') done++;
      if (legEls[j].__s !== st) { legEls[j].className = 'sx-leg is-' + st; legEls[j].__s = st; }
    }
    var doneText = String(done);
    if (el.done.textContent !== doneText) el.done.textContent = doneText;
    el.prog.style.transform = 'scaleX(' + (done / Math.max(1, legEls.length)).toFixed(4) + ')';
    var off = 0;
    if (legEls.length > LEGS_IN_VIEW) {
      var prevA = started > 0 ? p.legs[started - 1] : null, nextA = started < p.legs.length ? p.legs[started] : null;
      var frac = prevA != null && nextA != null ? clamp((t - prevA) / Math.max(0.01, nextA - prevA), 0, 1) : 0;
      off = clamp(started + frac - (LEGS_IN_VIEW - 4), 0, legEls.length - LEGS_IN_VIEW) * 20;
    }
    var legT = off ? 'translateY(' + (-off).toFixed(1) + 'px)' : '';
    if (el.legs.__t !== legT) { el.legs.style.transform = legT; el.legs.__t = legT; }

    // The finger. A quick next tap keeps it on the glass and glides it over.
    var taps = p.taps, pos = AT.rest, vis = 0, press = 0;
    for (var k = taps.length - 1; k >= 0; k--) {
      var tp = taps[k], nx = taps[k + 1], pv = taps[k - 1];
      var glideIn = pv && tp[0] - pv[1] < 0.6, glideOn = nx && nx[0] - tp[1] < 0.6;
      if (t < (glideIn ? tp[0] : tp[0] - 0.15)) continue;
      if (t > (glideOn ? nx[0] : tp[1] + 0.45)) break;
      var origin = pv ? AT[pv[2]] : AT.rest, target = AT[tp[2]], m = seg(t, tp[0], tp[1]);
      pos = [origin[0] + (target[0] - origin[0]) * m, origin[1] + (target[1] - origin[1]) * m];
      vis = Math.min(glideIn ? 1 : seg(t, tp[0] - 0.15, tp[0] + 0.05), glideOn ? 1 : 1 - seg(t, tp[1] + 0.25, tp[1] + 0.45));
      var pt = t - (tp[1] + 0.05);
      press = pt > 0 && pt < 0.3 ? Math.sin((pt / 0.3) * Math.PI) : 0;
      break;
    }
    style(el.tap, vis, 'translate(' + (pos[0] - 18).toFixed(1) + 'px,' + (pos[1] - 18).toFixed(1) + 'px) scale(' + (1 - 0.18 * press).toFixed(3) + ')');
    el.tap.style.setProperty('--ring', press.toFixed(3));

    // The four steps beside the phone.
    var step = 0;
    for (var s = 0; s < p.steps.length; s++) if (t >= p.steps[s]) step = s;
    for (var n = 0; n < stepItems.length; n++) {
      stepItems[n].classList.toggle('is-on', n === step);
      stepItems[n].classList.toggle('is-done', n < step);
    }
  }

  // ── Clock ──────────────────────────────────────────────────────────────
  var motion = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  var still = !!(motion && motion.matches);
  var t = 0, begun = false, playing = false, userPaused = false, visible = false, raf = 0, last = 0;
  function tick(ts) {
    raf = 0;
    if (!playing) return;
    var dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    begun = true;
    t += dt;
    if (t >= plan.T) {
      t -= plan.T;
      if (pending) { apply(pending); pending = null; }
      if (t >= plan.T) t = 0;
    }
    render(t);
    raf = requestAnimationFrame(tick);
  }
  function play() { if (playing || still) return; playing = true; last = 0; raf = requestAnimationFrame(tick); setToggle(); }
  function pause() { playing = false; if (raf) cancelAnimationFrame(raf); raf = 0; setToggle(); }
  function setToggle() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', playing ? 'Pause the simulation' : 'Play the simulation');
    root.classList.toggle('is-paused', !playing);
  }
  function sync() { if (visible && !userPaused && !document.hidden) play(); else pause(); }
  function markDone() { stepItems.forEach(function (li) { li.classList.add('is-done'); li.classList.remove('is-on'); }); }
  function rest() { pause(); render(plan.rest); markDone(); if (toggle) toggle.hidden = true; }

  // ── Scale the phone to its slot ───────────────────────────────────────
  function fit() { if (device && phone) phone.style.transform = 'scale(' + (device.clientWidth / 384).toFixed(4) + ')'; }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(device); else window.addEventListener('resize', fit);
  fit();

  // ── Start ──────────────────────────────────────────────────────────────
  apply(fromSnapshot());
  t = plan.start;
  function takeLive() {
    var rows = window.FormaSite && window.FormaSite.allocation(STRATEGY);
    if (!rows || rows.length < 5) return;
    var next = build(rows, true);
    if (playing) { pending = next; return; } // swapped in at the loop's end, never mid-scene
    apply(next);
    if (still) { render(plan.rest); markDone(); return; }
    t = begun ? Math.min(t, plan.T - 0.001) : plan.start;
    render(t);
  }
  document.addEventListener('forma:live', takeLive);
  takeLive();

  if (still) rest();
  else render(t);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { visible = es.some(function (e) { return e.isIntersecting; }); sync(); }, { threshold: 0 }).observe(root);
  } else { visible = true; sync(); }
  document.addEventListener('visibilitychange', sync);
  if (toggle) toggle.addEventListener('click', function () { userPaused = playing; sync(); if (!playing) setToggle(); });
  if (motion && motion.addEventListener) motion.addEventListener('change', function (e) {
    still = e.matches;
    if (still) rest();
    else { if (toggle) toggle.hidden = false; render(t); sync(); }
  });
  root.classList.add('is-ready');

  // For exporting the film frame by frame (tools/film/film.mjs).
  window.FormaSim = {
    get duration() { return plan.T; },
    get marks() { return { before: 0.35, lastDone: plan.lastDone, wallet: plan.wallet, full: plan.full, end: plan.end, start: plan.start }; },
    asOf: AS_OF,
    seek: function (s) { userPaused = true; pause(); t = s; render(s); },
    play: function () { userPaused = false; visible = true; sync(); },
  };
})();
