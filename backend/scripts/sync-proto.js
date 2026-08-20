#!/usr/bin/env node
/**
 * Copies the operator_agent proto and its transitive imports out of a mono
 * checkout into backend/src/grpc/proto/, preserving the import paths so
 * proto-loader can resolve them with a single includeDir.
 *
 * Only files that exist under mono's proto/ are copied — google/protobuf/*
 * well-knowns ship with @grpc/proto-loader.
 *
 *   npm run sync-proto
 *   MONO_DIR=/path/to/mono npm run sync-proto
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT_PROTO = 'services/operator_agent/v1/operator_agent.proto';
const MONO_DIR =
  process.env.MONO_DIR || path.join(os.homedir(), 'tkhq/code/mono');
const SRC_DIR = path.join(MONO_DIR, 'proto');
const DEST_DIR = path.join(__dirname, '..', 'src', 'grpc', 'proto');

if (!fs.existsSync(path.join(SRC_DIR, ROOT_PROTO))) {
  console.error(
    `Could not find ${ROOT_PROTO} under ${SRC_DIR}.\n` +
      `Set MONO_DIR to your mono checkout, e.g. MONO_DIR=~/tkhq/code/mono npm run sync-proto`
  );
  process.exit(1);
}

// Walk imports breadth-first to build the closure.
const IMPORT_RE = /^import\s+(?:public\s+)?"([^"]+)"/gm;
const closure = new Set();
const skipped = new Set();
const queue = [ROOT_PROTO];

while (queue.length) {
  const rel = queue.shift();
  if (closure.has(rel) || skipped.has(rel)) continue;

  const abs = path.join(SRC_DIR, rel);
  if (!fs.existsSync(abs)) {
    // Well-known types resolved by proto-loader itself.
    skipped.add(rel);
    continue;
  }

  closure.add(rel);
  const source = fs.readFileSync(abs, 'utf8');
  for (const match of source.matchAll(IMPORT_RE)) queue.push(match[1]);
}

// Replace the vendored tree wholesale so deleted upstream files don't linger.
fs.rmSync(DEST_DIR, { recursive: true, force: true });
for (const rel of closure) {
  const dest = path.join(DEST_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(SRC_DIR, rel), dest);
}

console.log(`Synced ${closure.size} proto files from ${SRC_DIR}`);
console.log(`  → ${path.relative(process.cwd(), DEST_DIR)}`);
if (skipped.size) {
  console.log(`  (${skipped.size} well-known imports left to proto-loader)`);
}
