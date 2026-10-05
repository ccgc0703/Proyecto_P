#!/usr/bin/env node
/**
 * Load test de la API (sin dependencias externas).
 *
 *   node scripts/load-test.js --scenario listado --concurrency 25 --duration 15
 *
 * Escenarios:
 *   health      GET /health                      (sin auth)
 *   listado     GET /jovenes?page=1&limit=20     (auth) — el read más pesado
 *   busqueda    GET /jovenes?q=a&limit=20        (auth) — LIKE sobre 1004 filas
 *   stats       GET /jovenes/stats               (auth) — agregados por unidad
 *   progresion  GET /progresion/unidades/:id/jovenes (auth) — N+1 histórico
 *   login       POST /auth/login (clave mala)    — contra el rate limit de login
 *   mixto       50% listado / 30% stats / 20% progresion
 *
 * Nota: el rate limit global (600 req/min por IP) está pensado para cortar
 * abusos; para medir capacidad pura arranca el servidor con RATE_LIMIT_GLOBAL
 * alto, p.ej.  RATE_LIMIT_GLOBAL=1000000 node dist/src/main.js
 */
const http = require('node:http');
const { performance } = require('node:perf_hooks');

function parseArgs() {
  const argv = process.argv.slice(2);
  const out = {
    base: 'http://localhost:3000/api/v1',
    scenario: 'listado',
    concurrency: 25,
    duration: 15,
    email: process.env.LOAD_EMAIL || 'admin@poseidon.com',
    password: process.env.LOAD_PASSWORD || 'admin123',
    timeout: 20000,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--base') out.base = argv[++i];
    else if (a === '--scenario') out.scenario = argv[++i];
    else if (a === '--concurrency' || a === '-c') out.concurrency = Number(argv[++i]);
    else if (a === '--duration' || a === '-d') out.duration = Number(argv[++i]);
    else if (a === '--email') out.email = argv[++i];
    else if (a === '--password') out.password = argv[++i];
  }
  return out;
}

function request(agent, spec, timeoutMs) {
  return new Promise((resolve) => {
    const u = new URL(spec.url);
    const started = performance.now();
    const headers = { ...(spec.headers || {}) };
    if (spec.body) headers['Content-Length'] = Buffer.byteLength(spec.body);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname + u.search,
        method: spec.method || 'GET',
        headers,
        agent,
      },
      (res) => {
        let bytes = 0;
        res.on('data', (c) => (bytes += c.length));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            ms: performance.now() - started,
            bytes,
            retryAfter: res.headers['retry-after'],
            limit: res.headers['x-ratelimit-limit'],
          }),
        );
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
    req.on('error', (e) =>
      resolve({ status: 0, ms: performance.now() - started, bytes: 0, error: e.code || e.message }),
    );
    if (spec.body) req.write(spec.body);
    req.end();
  });
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function summarize(results, elapsedSec) {
  const byStatus = new Map();
  let transport = 0;
  let bytes = 0;
  const lat = [];
  for (const r of results) {
    if (r.status === 0) transport++;
    else byStatus.set(r.status, (byStatus.get(r.status) || 0) + 1);
    bytes += r.bytes;
    if (r.status >= 200 && r.status < 300) lat.push(r.ms);
  }
  lat.sort((a, b) => a - b);
  const ok = lat.length;
  return {
    total: results.length,
    rps: elapsedSec > 0 ? results.length / elapsedSec : 0,
    byStatus: Object.fromEntries([...byStatus.entries()].sort((a, b) => a[0] - b[0])),
    transport,
    ok,
    mbps: elapsedSec > 0 ? bytes / 1024 / 1024 / elapsedSec : 0,
    p50: percentile(lat, 50),
    p95: percentile(lat, 95),
    p99: percentile(lat, 99),
    max: lat.length ? lat[lat.length - 1] : 0,
    avg: ok ? lat.reduce((a, b) => a + b, 0) / ok : 0,
  };
}

async function loginToken(cfg) {
  const agent = new http.Agent({ keepAlive: true, maxSockets: 4 });
  const body = await new Promise((resolve, reject) => {
    const u = new URL(`${cfg.base}/auth/login`);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        agent,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          if (res.statusCode !== 200) reject(new Error(`login ${res.statusCode}: ${raw.slice(0, 200)}`));
          else resolve(raw);
        });
      },
    );
    req.on('error', reject);
    req.write(JSON.stringify({ email: cfg.email, password: cfg.password }));
    req.end();
  });
  agent.destroy();
  return JSON.parse(body).data.access_token;
}

async function resolveUnidad(cfg, token) {
  const agent = new http.Agent({ keepAlive: true, maxSockets: 4 });
  const raw = await new Promise((resolve, reject) => {
    const u = new URL(`${cfg.base}/unidades`);
    const req = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        agent,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve(raw));
      },
    );
    req.on('error', reject);
    req.end();
  });
  agent.destroy();
  const data = JSON.parse(raw).data || [];
  const com = data.find((u) => u.nombre === 'Comunidad') || data[0];
  return com ? com.id : null;
}

function makeSpecs(cfg, token, unidadId) {
  const auth = { Authorization: `Bearer ${token}` };
  const json = { 'Content-Type': 'application/json', ...auth };
  const specs = {
    health: { url: `${cfg.base}/health` },
    listado: { url: `${cfg.base}/jovenes?page=1&limit=20`, headers: auth },
    page100: { url: `${cfg.base}/jovenes?page=100&limit=20`, headers: auth },
    busqueda: { url: `${cfg.base}/jovenes?q=a&limit=20`, headers: auth },
    stats: { url: `${cfg.base}/jovenes/stats`, headers: auth },
    progresion: { url: `${cfg.base}/progresion/unidades/${unidadId}/jovenes`, headers: auth },
    login: {
      method: 'POST',
      url: `${cfg.base}/auth/login`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cfg.email, password: 'clave-equivocada' }),
    },
    mixto: null, // se resuelve en run()
  };
  return specs;
}

async function run(label, pick, cfg, concurrency) {
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency * 2 });
  const results = [];
  const deadline = Date.now() + cfg.duration * 1000;
  const worker = async () => {
    while (Date.now() < deadline) {
      results.push(await request(agent, pick(), cfg.timeout));
    }
  };
  const t0 = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const elapsed = (performance.now() - t0) / 1000;
  agent.destroy();
  const s = summarize(results, elapsed);
  const estados = Object.entries(s.byStatus)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ');
  console.log(
    [
      `  ${label.padEnd(26)}`,
      `${String(s.total).padStart(7)} req`,
      `${s.rps.toFixed(1).padStart(7)} req/s`,
      `p50=${s.p50.toFixed(1).padStart(6)}ms`,
      `p95=${s.p95.toFixed(1).padStart(6)}ms`,
      `p99=${s.p99.toFixed(1).padStart(6)}ms`,
      `max=${s.max.toFixed(0).padStart(5)}ms`,
      `| ${estados || 'sin respuestas'}`,
      s.transport ? `| transport_err=${s.transport}` : '',
      s.mbps > 0.01 ? `| ${s.mbps.toFixed(2)} MB/s` : '',
    ]
      .filter(Boolean)
      .join(' '),
  );
  return s;
}

async function main() {
  const cfg = parseArgs();
  if (cfg.help) {
    console.log(require('node:fs').readFileSync(__filename, 'utf8').split('*/')[0] + '*/');
    process.exit(0);
  }

  const todos = ['health', 'listado', 'page100', 'busqueda', 'stats', 'progresion', 'login', 'mixto'];
  if (!todos.includes(cfg.scenario)) {
    console.error(`Escenario desconocido: ${cfg.scenario}. Opciones: ${todos.join(', ')}`);
    process.exit(2);
  }

  console.log(
    `Load test · scenario=${cfg.scenario} · concurrency=${cfg.concurrency} · duration=${cfg.duration}s · base=${cfg.base}`,
  );

  const token = cfg.scenario === 'health' ? null : await loginToken(cfg).catch((e) => {
    console.error(`No se pudo obtener token: ${e.message}`);
    process.exit(2);
  });
  const unidadId = ['progresion', 'mixto'].includes(cfg.scenario) ? await resolveUnidad(cfg, token) : null;
  if (['progresion', 'mixto'].includes(cfg.scenario) && !unidadId) {
    console.error('No se encontró ninguna unidad para el escenario');
    process.exit(2);
  }

  const specs = makeSpecs(cfg, token, unidadId);
  const pick =
    cfg.scenario === 'mixto'
      ? () => {
          const r = Math.random();
          if (r < 0.5) return specs.listado;
          if (r < 0.8) return specs.stats;
          return specs.progresion;
        }
      : () => specs[cfg.scenario];

  const s = await run(`scenario=${cfg.scenario}`, pick, cfg, cfg.concurrency);
  console.log(
    `\n  resumen: ${s.total} peticiones en ${cfg.duration}s · ${s.ok} OK · ${s.transport} errores de transporte · ` +
      `latencia media ${s.avg.toFixed(1)}ms`,
  );
  if (s.byStatus[429]) {
    console.log(`  rate limit: ${s.byStatus[429]} respuestas 429 (esperado si el límite global está activo)`);
  }
  process.exit(s.transport > 0 && s.ok === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
