// Downloads the @imgly/background-removal model + wasm assets into public/imgly/
// so the "AI 自動去背" tool serves them same-origin instead of hitting the
// staticimgly.com CDN at runtime (avoids NetworkError / CORS / ad-blockers and
// keeps everything on-device, matching the rest of the toolbox).
//
// Runs automatically on `npm run build` (see prebuild). Only the assets needed
// for device=cpu + model=isnet_quint8 are fetched (~54MB). Already-downloaded
// files are skipped, so re-runs are cheap.
import { mkdir, writeFile, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '1.7.0'
const BASE = `https://staticimgly.com/@imgly/background-removal-data/${VERSION}/dist/`
// Keys from resources.json that we serve locally (cpu + quantised model only).
const WANTED = [
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs',
  '/models/isnet_quint8',
]

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'imgly')

const exists = (p) =>
  access(p)
    .then(() => true)
    .catch(() => false)

async function fetchBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  await mkdir(outDir, { recursive: true })

  const resPath = join(outDir, 'resources.json')
  const resJson = await fetchBuffer(BASE + 'resources.json')
  await writeFile(resPath, resJson)
  const resources = JSON.parse(resJson.toString())

  // Collect every chunk hash referenced by the wanted resources.
  const chunks = new Set()
  for (const key of WANTED) {
    const entry = resources[key]
    if (!entry) throw new Error(`Missing resource "${key}" in resources.json`)
    for (const c of entry.chunks) chunks.add(c.name)
  }

  let downloaded = 0
  let skipped = 0
  for (const name of chunks) {
    const dest = join(outDir, name)
    if (await exists(dest)) {
      skipped++
      continue
    }
    const buf = await fetchBuffer(BASE + name)
    await writeFile(dest, buf)
    downloaded++
    process.stdout.write(`\r  imgly assets: ${downloaded} downloaded, ${skipped} cached…`)
  }
  console.log(`\n✓ imgly assets ready in public/imgly (${downloaded} downloaded, ${skipped} cached)`)
}

main().catch((e) => {
  console.error('\n✗ Failed to fetch imgly assets:', e.message)
  process.exit(1)
})
