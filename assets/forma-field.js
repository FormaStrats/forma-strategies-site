/*
 * Forma Field — resolution-independent hero renderer.
 *
 * Recreates the Forma banner (twisting light ribbon over a perspective grid
 * with drifting data points) natively at the device's pixel density, so it is
 * razor sharp at 1080p, 1440p and 4K instead of upscaling an 800px JPEG.
 *
 * Usage (ES module or classic script — exposes window.FormaField):
 *   const field = FormaField.create(canvas, { intensity: 1 });
 *   field.destroy();
 *
 * Options:
 *   strands      number of ribbon strands (default 72)
 *   intensity    global brightness multiplier (default 1)
 *   ribbonY      vertical position of the ribbon, 0..1 (default 0.56)
 *   grid         draw the perspective grid (default true)
 *   particles    number of data points (default 320)
 *   dprCap       max device-pixel-ratio to render at (default 2)
 *   still        render a single frame and stop (default: prefers-reduced-motion)
 *   time         seconds offset for the rendered frame (default 0)
 *   speed        animation speed multiplier (default 1)
 *   interactive  subtle mouse parallax (default true)
 */
(function (root) {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function smoothstep(e0, e1, x) {
    var t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  function create(canvas, options) {
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* noop */ }

    var o = Object.assign({
      strands: 72,
      intensity: 1,
      ribbonY: 0.56,
      grid: true,
      particles: 320,
      dprCap: 2,
      still: reduce,
      time: 0,
      speed: 1,
      interactive: true,
      seed: 20260601,
      background: true,
    }, options || {});

    var ctx = canvas.getContext('2d', { alpha: !o.background });
    var staticLayer = document.createElement('canvas');
    var sctx = staticLayer.getContext('2d');
    var W = 1, H = 1, dpr = 1, raf = 0, visible = true, destroyed = false;
    var start = performance.now();
    var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    var quality = 1; // adaptive: drops if frames are slow
    var slowFrames = 0;

    var rand = mulberry32(o.seed);
    var points = [];
    for (var i = 0; i < o.particles; i++) {
      points.push({
        x: rand(), y: rand(), z: 0.2 + rand() * 0.8,
        tw: rand() * Math.PI * 2, sp: 0.4 + rand() * 1.6,
        big: rand() < 0.06,
      });
    }

    function paintStatic() {
      staticLayer.width = W; staticLayer.height = H;
      var c = sctx;
      if (o.background) {
        var g = c.createRadialGradient(W * 0.52, H * 0.58, 0, W * 0.52, H * 0.58, Math.max(W, H) * 0.78);
        g.addColorStop(0, '#101b38');
        g.addColorStop(0.35, '#0a1124');
        g.addColorStop(0.7, '#060a16');
        g.addColorStop(1, '#03050b');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
      } else {
        c.clearRect(0, 0, W, H);
      }

      if (o.grid) {
        var hy = H * (o.ribbonY + 0.015);
        c.save();
        c.globalCompositeOperation = 'lighter';

        // Perspective floor — horizontal rungs, denser toward the horizon.
        for (var r = 1; r <= 34; r++) {
          var z = r / 34;
          var p = Math.pow(z, 2.35);
          var y = hy + (H - hy) * p;
          c.strokeStyle = 'rgba(110,145,225,' + (0.022 + 0.085 * p).toFixed(4) + ')';
          c.lineWidth = Math.max(1, dpr * (0.45 + 0.9 * p));
          c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
        }
        // Converging rails to a vanishing point.
        var vx = W * 0.5;
        for (var k = -30; k <= 30; k++) {
          var a = 0.05 * (1 - Math.abs(k) / 34);
          c.strokeStyle = 'rgba(110,145,225,' + Math.max(0.008, a).toFixed(4) + ')';
          c.lineWidth = Math.max(1, dpr * 0.6);
          c.beginPath();
          c.moveTo(vx + k * (W / 150), hy);
          c.lineTo(vx + k * (W / 13), H);
          c.stroke();
        }
        // Back wall — a fine ledger grid that fades upward, with node dots.
        var cell = Math.round(42 * dpr);
        for (var gx = (W / 2) % cell; gx < W; gx += cell) {
          var lg = c.createLinearGradient(0, 0, 0, hy);
          lg.addColorStop(0, 'rgba(110,145,225,0)');
          lg.addColorStop(1, 'rgba(110,145,225,0.05)');
          c.strokeStyle = lg; c.lineWidth = Math.max(1, dpr * 0.5);
          c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, hy); c.stroke();
        }
        for (var gy = hy; gy > 0; gy -= cell) {
          var fa = 0.045 * (gy / hy);
          c.strokeStyle = 'rgba(110,145,225,' + fa.toFixed(4) + ')';
          c.lineWidth = Math.max(1, dpr * 0.5);
          c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke();
        }
        var dotRand = mulberry32(o.seed + 99);
        for (var dx = (W / 2) % cell; dx < W; dx += cell) {
          for (var dy = hy; dy > 0; dy -= cell) {
            if (dotRand() < 0.12) {
              var da = 0.12 + 0.35 * dotRand() * (dy / hy);
              c.fillStyle = 'rgba(150,185,255,' + da.toFixed(3) + ')';
              var s = Math.max(1, Math.round(dpr * 1.2));
              c.fillRect(Math.round(dx - s / 2), Math.round(dy - s / 2), s, s);
            }
          }
        }
        c.restore();
      }

      if (o.background) {
        // Vignette
        var v = c.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.25, W * 0.5, H * 0.5, Math.max(W, H) * 0.75);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.55)');
        c.fillStyle = v;
        c.fillRect(0, 0, W, H);
      }
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, o.dprCap);
      W = Math.max(2, Math.round(rect.width * dpr));
      H = Math.max(2, Math.round(rect.height * dpr));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W; canvas.height = H;
      }
      gradCache = { key: '' };
      paintStatic();
    }

    var gradCache = { key: '', strands: [], core: null, coreGlow: null };
    function envelopeStops(g, rgb, peak) {
      // dim on the far left, full through the centre/right, soft on the far right
      var stops = [[0, 0.12], [0.18, 0.45], [0.42, 0.95], [0.66, 1], [0.88, 0.7], [1, 0.25]];
      for (var i = 0; i < stops.length; i++) {
        g.addColorStop(stops[i][0], 'rgba(' + rgb + ',' + (peak * stops[i][1]).toFixed(4) + ')');
      }
      return g;
    }
    function buildGradients(n, layer) {
      var key = W + 'x' + n + (layer ? 'L' : 'M') + o.intensity;
      if (gradCache[key]) return gradCache[key];
      var list = [];
      for (var i = 0; i < n; i++) {
        var u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
        var centerness = Math.exp(-Math.pow(u / 0.42, 2));
        var alpha = ((layer ? 0.05 : 0.085) + (layer ? 0.06 : 0.16) * centerness) * o.intensity;
        var rgb = Math.round(150 + 105 * centerness) + ',' + Math.round(185 + 70 * centerness) + ',255';
        list.push({ u: u, c: centerness, g: envelopeStops(ctx.createLinearGradient(0, 0, W, 0), rgb, alpha) });
      }
      gradCache[key] = list;
      return list;
    }

    // Ribbon geometry: a band of strands twisting around its own axis.
    // offset = u * width(x) * cos(theta(x)); strands converge where cos(theta)=0,
    // and additive blending turns those pinch points into bright filaments.
    function drawRibbon(t, layer) {
      var n = Math.max(12, Math.round(o.strands * quality * (layer ? 0.45 : 1)));
      var cy = H * (o.ribbonY + (layer ? 0.035 : 0));
      var stepPx = Math.max(3, 5 / quality) * dpr;
      var steps = Math.ceil(W / stepPx);
      var px = (mouse.x - 0.5) * 18 * dpr;
      var py = (mouse.y - 0.5) * 10 * dpr;
      var amp = H * (layer ? 0.035 : 0.055);
      var freq = layer ? 1.6 : 1.12;
      var tw = t * (layer ? 0.21 : 0.16);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      var grads = buildGradients(n, layer);
      for (var i = 0; i < n; i++) {
        var u = grads[i].u; // -1..1
        var centerness = grads[i].c;
        ctx.strokeStyle = grads[i].g;
        ctx.lineWidth = Math.max(1, dpr * (0.7 + 0.5 * centerness));

        ctx.beginPath();
        for (var s = 0; s <= steps; s++) {
          var xn = s / steps;
          var x = xn * W;
          var base =
            Math.sin(xn * Math.PI * 2 * 0.62 + 1.25 + t * 0.11) * amp +
            Math.sin(xn * Math.PI * 2 * 1.35 - 0.6 + t * 0.07) * amp * 0.32;
          var width = H * (layer ? 0.05 : 0.04 + 0.11 * smoothstep(0.25, 1.0, xn) + 0.03 * Math.sin(t * 0.3 + xn * 3.0));
          var theta = xn * Math.PI * 2 * freq + tw + u * 0.22;
          var off = u * width * Math.cos(theta);
          var depth = u * width * Math.sin(theta) * 0.18;
          var y = cy + base + off + depth + py * (0.4 + 0.6 * xn);
          var xx = x + px * (0.3 + 0.7 * Math.abs(u));
          if (s === 0) ctx.moveTo(xx, y); else ctx.lineTo(xx, y);
        }
        ctx.stroke();
      }

      if (!layer) {
        // Bright core filament with bloom.
        ctx.shadowColor = 'rgba(120,170,255,0.95)';
        ctx.shadowBlur = 22 * dpr;
        for (var c = 0; c < 3; c++) {
          ctx.strokeStyle = c === 0
            ? envelopeStops(ctx.createLinearGradient(0, 0, W, 0), '255,255,255', 0.7 * o.intensity)
            : envelopeStops(ctx.createLinearGradient(0, 0, W, 0), '170,205,255', 0.28 * o.intensity);
          ctx.lineWidth = dpr * (c === 0 ? 1.6 : 3.5 + c * 2);
          ctx.beginPath();
          for (var s2 = 0; s2 <= steps; s2++) {
            var xn2 = s2 / steps;
            var base2 =
              Math.sin(xn2 * Math.PI * 2 * 0.62 + 1.25 + t * 0.11) * amp +
              Math.sin(xn2 * Math.PI * 2 * 1.35 - 0.6 + t * 0.07) * amp * 0.32;
            var y2 = cy + base2 + py * (0.4 + 0.6 * xn2);
            // fade the filament toward the edges
            if (s2 === 0) ctx.moveTo(xn2 * W + px * 0.3, y2); else ctx.lineTo(xn2 * W + px * 0.3, y2);
          }
          ctx.globalAlpha = 0.9;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      }
      ctx.restore();
    }

    function drawPoints(t) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var px = (mouse.x - 0.5) * 30 * dpr;
      var py = (mouse.y - 0.5) * 18 * dpr;
      for (var i = 0; i < points.length; i++) {
        var p = points[i];
        var tw = 0.45 + 0.55 * Math.sin(t * p.sp + p.tw);
        var a = (0.15 + 0.55 * p.z) * tw * o.intensity;
        var x = ((p.x + t * 0.0025 * p.z) % 1) * W + px * p.z;
        var y = p.y * H + py * p.z;
        var s = Math.max(1, dpr * (p.big ? 1.8 : 1.0) * p.z);
        ctx.fillStyle = 'rgba(170,200,255,' + Math.min(1, a).toFixed(3) + ')';
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
        if (p.big && tw > 0.8) {
          ctx.fillStyle = 'rgba(200,220,255,' + (0.35 * a).toFixed(3) + ')';
          var f = s * 4;
          ctx.fillRect(x - f, y - 0.5 * dpr, f * 2, 1 * dpr);
          ctx.fillRect(x - 0.5 * dpr, y - f, 1 * dpr, f * 2);
        }
      }
      ctx.restore();
    }

    function frame(now) {
      if (destroyed) return;
      var t0 = performance.now();
      var t = o.time + ((now || t0) - start) / 1000 * o.speed;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      if (o.background) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(staticLayer, 0, 0);
      } else {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(staticLayer, 0, 0);
      }
      drawPoints(t);
      drawRibbon(t, true);
      drawRibbon(t, false);

      // adaptive quality for slower GPUs
      var cost = performance.now() - t0;
      if (cost > 14) { slowFrames++; if (slowFrames > 20 && quality > 0.5) { quality -= 0.1; slowFrames = 0; } }
      else slowFrames = Math.max(0, slowFrames - 1);

      if (!o.still && visible) raf = requestAnimationFrame(frame);
    }

    function onMove(e) {
      if (!o.interactive) return;
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    }

    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () { resize(); if (o.still) frame(start); }) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', resize);

    var io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(function (entries) {
      var v = entries[0] && entries[0].isIntersecting;
      if (v && !visible && !o.still) { visible = true; raf = requestAnimationFrame(frame); }
      else if (!v) { visible = false; cancelAnimationFrame(raf); }
    }) : null;
    if (io) io.observe(canvas);

    function onVis() {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (!o.still && visible) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointermove', onMove, { passive: true });

    resize();
    if (o.still) frame(start); else raf = requestAnimationFrame(frame);

    return {
      destroy: function () {
        destroyed = true;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        if (io) io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
        window.removeEventListener('pointermove', onMove);
      },
      renderStill: function (time) { o.still = true; o.time = time || 0; start = performance.now(); frame(start); },
    };
  }

  var api = { create: create };
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.FormaField = api;
})(typeof window !== 'undefined' ? window : this);
