import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

// Self-hosted ffmpeg core (copied into public/ffmpeg). No third-party CDN.
const BASE = `${import.meta.env.BASE_URL}ffmpeg`

let instance: FFmpeg | null = null
let loading: Promise<FFmpeg> | null = null

/** Lazily create + load a single shared ffmpeg.wasm instance. */
export async function getFFmpeg(onLog?: (line: string) => void): Promise<FFmpeg> {
  if (instance) return instance
  if (!loading) {
    const ff = new FFmpeg()
    if (onLog) ff.on('log', ({ message }) => onLog(message))
    loading = ff
      .load({
        coreURL: await toBlobURL(`${BASE}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${BASE}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      .then(() => {
        instance = ff
        return ff
      })
  }
  return loading
}

export { fetchFile }
