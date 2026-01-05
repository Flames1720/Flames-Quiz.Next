#!/usr/bin/env node
// Usage: VERCEL_TOKEN=xxx node scripts/set-vercel-env.js <projectIdOrName> .env.vercel
// This script reads key=value lines from a file and upserts them to Vercel Project Environment Variables.

const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.env.VERCEL_TOKEN;
if (!token) {
  console.error('Set VERCEL_TOKEN environment variable with a Vercel Personal Token.');
  process.exit(1);
}

const project = process.argv[2];
const file = process.argv[3] || '.env.vercel';
if (!project) {
  console.error('Usage: VERCEL_TOKEN=... node scripts/set-vercel-env.js <projectIdOrName> [file]');
  process.exit(1);
}

const raw = fs.readFileSync(path.resolve(file), 'utf8');
const lines = raw.split(/\n/).map(l=>l.trim()).filter(Boolean).filter(l=>!l.startsWith('#'));
const vars = lines.map(l => {
  const idx = l.indexOf('='); if (idx === -1) return null;
  const k = l.substring(0, idx).trim();
  const v = l.substring(idx+1).trim();
  return { key: k, value: v };
}).filter(Boolean);

if (!vars.length) { console.error('No variables found in', file); process.exit(1); }

async function upsertEnv(k, v) {
  const payload = JSON.stringify({ key: k, value: v, target: ['production','preview','development'] });
  const options = {
    hostname: 'api.vercel.com',
    port: 443,
    path: `/v9/projects/${encodeURIComponent(project)}/env`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(JSON.parse(body));
        else reject(new Error(`Failed ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async () => {
  for (const v of vars) {
    try {
      console.log('Upserting', v.key);
      const res = await upsertEnv(v.key, v.value);
      console.log('OK', res.uid || res.key || 'created');
    } catch (e) {
      console.error('Error setting', v.key, e.message);
    }
  }
  console.log('Done. Note: If a variable exists, use the Vercel API to update or delete first.');
})();
