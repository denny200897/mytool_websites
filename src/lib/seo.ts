import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Production origin — used for canonical URLs and Open Graph. */
export const SITE_URL = 'https://tool.denny.li'
export const SITE_NAME = '檔案工具箱 · FileUtil'

/** Upsert a <meta> tag identified by name or property. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Upsert the canonical <link>. */
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

interface SeoOptions {
  title: string
  description: string
}

/**
 * Per-route SEO: keeps the document title, meta description, canonical link
 * and Open Graph / Twitter tags in sync with the current page. This is a SPA
 * so these update on navigation rather than being server-rendered.
 */
export function useSeo({ title, description }: SeoOptions) {
  const { pathname } = useLocation()
  useEffect(() => {
    const fullTitle = title ? `${title}｜${SITE_NAME}` : SITE_NAME
    const url = `${SITE_URL}${pathname}`
    document.title = fullTitle
    setMeta('name', 'description', description)
    setCanonical(url)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
  }, [title, description, pathname])
}
