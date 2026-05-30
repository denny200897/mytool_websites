import * as pdfjsLib from 'pdfjs-dist'
// Vite resolves this to a hashed URL for the worker bundle.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

export { pdfjsLib }
