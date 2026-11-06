// Render the homepage simulation as video, as the share card, or as stills, frame by frame through FormaSim.seek(t).
//   node tools/film/film.mjs wide brand/film/forma-film-16x9.mp4 [base]
//   node tools/film/film.mjs tall brand/film/forma-film-9x16.mp4 [base]
//   node tools/film/film.mjs og brand/og-film-1200x630.jpg [base]
//   node tools/film/film.mjs wide /tmp/stills [base] 1,9.5,21     (PNG stills at those seconds of the film)
// base: where the site is served (default http://127.0.0.1:8000/forma-strategies-site/). Needs Chrome, ffmpeg and
// puppeteer-core (cd tools/film && npm install --no-save puppeteer-core@23). CHROME_PATH overrides Chrome's path.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const [, , mode = 'wide', out, base = 'http://127.0.0.1:8000/forma-strategies-site/', stills] = process.argv;
if (!out || !['wide', 'tall', 'og'].includes(mode)) {
  console.error('usage: node film.mjs <wide|tall|og> <out.mp4 | out.jpg | stills dir> [base] [seconds,...]');
  process.exit(1);
}
const [W, H] = { wide: [1920, 1080], tall: [1080, 1920], og: [1920, 1008] }[mode];
const FPS = 30, END = 8; // END: seconds from the sim's last frame to the end of the film, mostly the end card (time to read it)

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new', args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const problems = [];
page.on('pageerror', (e) => problems.push(String(e)));
page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('favicon.ico') && problems.push(r.status() + ' ' + r.url()));
await page.goto(new URL('tools/film/film.html?v=' + mode, base).href, { waitUntil: 'networkidle0' });
await page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 15000 });
await page.evaluate(async () => { await document.fonts.ready; });
const M = await page.evaluate(() => Object.assign({ T: window.FormaSim.duration }, window.FormaSim.marks));

await page.evaluate(() => {
  const film = document.getElementById('film'), end = document.getElementById('end');
  const device = document.querySelector('.f-sim .sim__device');
  const parts = Array.from(film.children).filter((n) => n !== end);
  const born = new Map();
  // s: the sim's clock; t: the film's clock, which also drives CSS transitions and the spinner, so frames are deterministic.
  window.filmFrame = (s, t, cam, dip, card, settle) => {
    window.FormaSim.seek(Math.min(s, window.FormaSim.duration - 0.001));
    device.style.transform = cam === 1 ? '' : 'scale(' + cam.toFixed(4) + ')';
    for (const n of parts) n.style.opacity = String(1 - dip);
    end.style.opacity = String(card);
    for (const a of document.getAnimations()) {
      a.pause();
      if (a instanceof CSSTransition) {
        if (settle) { a.finish(); continue; }
        if (!born.has(a)) born.set(a, t);
        a.currentTime = Math.max(0, (t - born.get(a)) * 1000);
      } else a.currentTime = t * 1000;
    }
  };
});

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
// Film time to sim time: open on the full $1,000 wallet and hold it, and give the finished delivery a beat.
const HOLDS = [[M.before, 1.2], [M.lastDone, 0.5]];
const HELD = HOLDS.reduce((a, h) => a + h[1], 0);
const simAt = (t) => {
  let shift = 0;
  for (const [at, d] of HOLDS) { if (t - shift < at) break; if (t - shift < at + d) return at; shift += d; }
  return Math.max(t - shift, M.before);
};
// The camera: in on the $1,000 wallet, out for the steps, in again on the delivered holdings (not for the share card).
const CAM = { wide: [1.5, 1.6], tall: [1.22, 1.3], og: [1, 1] }[mode];
const camAt = (s) => (s < M.wallet ? CAM[0] + (1 - CAM[0]) * smooth((s - 1.2) / 0.6) : 1 + (CAM[1] - 1) * smooth((s - M.wallet) / 0.7));
// The ending: everything dips to black, then the end card comes up.
const filmEnd = M.end + HELD;
const dipAt = (t) => smooth((t - filmEnd) / 0.35);
const cardAt = (t) => smooth((t - filmEnd - 0.35) / 0.4);
const frameAt = (t, settle) => {
  const s = simAt(t);
  return page.evaluate((a) => window.filmFrame(a.s, a.t, a.cam, a.dip, a.card, a.settle), { s, t, cam: camAt(s), dip: dipAt(t), card: cardAt(t), settle });
};

let seconds;
if (mode === 'og') {
  const s = M.full + 0.5;
  await page.evaluate((a) => window.filmFrame(a.s, a.s, 1, 0, 0, true), { s });
  const png = await page.screenshot({ type: 'png' });
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'png', '-i', '-', '-vf', 'scale=1200:630:flags=lanczos', '-q:v', '3', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  ff.stdin.end(png);
  await new Promise((r) => ff.on('close', r));
  seconds = 0;
} else if (stills) {
  mkdirSync(out, { recursive: true });
  for (const t of stills.split(',').map(Number)) {
    await frameAt(t, true);
    writeFileSync(`${out}/${mode}-${String(t).replace('.', '_')}.png`, await page.screenshot({ type: 'png' }));
  }
  seconds = 0;
} else {
  const ffmpeg = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-level:v', '4.1', '-movflags', '+faststart', out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  seconds = M.T + HELD + END;
  const frames = Math.round(seconds * FPS);
  await frameAt(0, true); // settle the page's opening state, so frame 0 has nothing mid-transition
  for (let i = 0; i < frames; i++) {
    await frameAt(i / FPS, false);
    const png = await page.screenshot({ type: 'png', optimizeForSpeed: true });
    if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once('drain', r));
  }
  ffmpeg.stdin.end();
  await new Promise((r) => ffmpeg.on('close', r));
}
console.log(JSON.stringify({ mode, size: `${W}x${H}`, seconds: Math.round(seconds * 100) / 100, marks: M, problems }));
await browser.close();
process.exit(0); // Chrome can linger after close; the work is done
