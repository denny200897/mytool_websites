import { lazy, Suspense } from 'react'
import { createBrowserRouter, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import History from './pages/History'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import ComingSoon from './pages/ComingSoon'
import { findTool } from './lib/tools'

// Map each tool slug to a lazily-loaded component so heavy libs
// (ffmpeg, tesseract, pdf-lib…) only load when their tool is opened.
const toolModules: Record<string, () => Promise<{ default: React.ComponentType }>> = {
  'pdf-merge': () => import('./tools/PdfMerge'),
  'pdf-split': () => import('./tools/PdfSplit'),
  'pdf-compress': () => import('./tools/PdfCompress'),
  'pdf-encrypt': () => import('./tools/PdfEncrypt'),
  'pdf-decrypt': () => import('./tools/PdfDecrypt'),
  'pdf-images': () => import('./tools/PdfToImages'),
  'img-convert': () => import('./tools/ImgConvert'),
  'img-resize': () => import('./tools/ImgResize'),
  'img-crop': () => import('./tools/ImgCrop'),
  'img-compress': () => import('./tools/ImgCompress'),
  'img-remove-bg': () => import('./tools/ImgRemoveBg'),
  'img-remove-bg-ai': () => import('./tools/ImgRemoveBgAi'),
  'img-watermark': () => import('./tools/ImgWatermark'),
  'img-to-pdf': () => import('./tools/ImgToPdf'),
  'doc-ocr': () => import('./tools/DocOcr'),
  'doc-md': () => import('./tools/DocMarkdown'),
  'doc-md-pdf': () => import('./tools/MarkdownToPdf'),
  'zip-extract': () => import('./tools/ZipExtract'),
  'zip-create': () => import('./tools/ZipCreate'),
  'data-csv-excel': () => import('./tools/DataCsvExcel'),
  'data-json': () => import('./tools/DataJson'),
  'data-xml-json': () => import('./tools/DataXmlJson'),
  'video-convert': () => import('./tools/VideoConvert'),
  'video-trim': () => import('./tools/VideoTrim'),
  'video-mute': () => import('./tools/VideoMute'),
}

function ToolLoader() {
  const { slug = '' } = useParams()
  const found = findTool(slug)
  if (!found) return <NotFound />
  if (found.tool.status === 'soon') return <ComingSoon name={found.tool.name} />
  const loader = toolModules[slug]
  if (!loader) return <NotFound />
  const Component = lazy(loader)
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center text-secondary font-body-sm">載入工具中…</div>
      }
    >
      <Component />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tool/:slug', element: <ToolLoader /> },
      { path: 'history', element: <History /> },
      { path: 'settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
