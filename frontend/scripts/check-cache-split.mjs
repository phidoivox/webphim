// Assert-based self-check: public cached helpers tách khỏi request token.
// Chạy: pnpm --dir frontend exec node scripts/check-cache-split.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(frontend, p), "utf8");

const failures = [];
const check = (name, fn) => {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (e) {
    failures.push(name);
    console.error(`FAIL - ${name}: ${e.message.split("\n")[0]}`);
  }
};

const CACHED_FNS = [
  "getCachedHome",
  "getCachedMovieDetail",
  "getCachedGenres",
  "getCachedCountries",
  "getCachedWeeklySchedule",
];
const PRUNED_FNS = [
  "getHomeData",
  "getMovieDetail",
  "getGenres",
  "getCountries",
  "getWeeklyScheduleApi",
];

check("cached-content.ts dùng 'use cache' + cacheLife + cacheTag, không token", () => {
  const src = read("src/lib/cached-content.ts");
  assert.match(src, /'use cache'/);
  assert.match(src, /cacheLife\(/);
  assert.match(src, /cacheTag\(/);
  assert.doesNotMatch(src.replace(/Không auth.*/g, ""), /token/i);
});

for (const fn of CACHED_FNS) {
  check(`export ${fn}`, () => {
    assert.match(read("src/lib/cached-content.ts"), new RegExp(`export async function ${fn}`));
  });
}

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return p.endsWith(".ts") || p.endsWith(".tsx") ? [p] : [];
  });

check("không caller nào import helper public cũ từ @/lib/api", () => {
  const bad = walk(path.join(frontend, "src"))
    .filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return (
        /from ["']@\/lib\/api["']/.test(src) &&
        new RegExp(`\\b(${PRUNED_FNS.join("|")})\\b`).test(src)
      );
    })
    .map((f) => path.relative(frontend, f));
  assert.deepEqual(bad, []);
});

check("api.ts đã prune helper public cũ", () => {
  const src = read("src/lib/api.ts");
  for (const fn of PRUNED_FNS) {
    assert.doesNotMatch(src, new RegExp(`export async function ${fn}`));
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nAll cache-split checks passed");
