const KOFI_URL = 'https://ko-fi.com/Y6S721SXOC'
const GITHUB_URL = 'https://github.com/denny200897/mytool_websites'

/** Ko-fi cup logo (inline so we don't pull in their widget script). */
function KofiCup({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.716zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011-.077 4.311zm6.555-1.591c-.5.045-.908.046-.908.046V8.030h1.025s1.137.330 1.137 1.430c0 .851-.673 1.305-1.254 1.408z"/>
    </svg>
  )
}

/** GitHub mark. */
function GithubMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.598 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer className="bg-background border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-md px-lg py-lg w-full mt-auto">
      <span className="font-label-xs text-label-xs font-bold text-on-background">© 2026 denny.li</span>
      <div className="flex items-center gap-md">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="在 GitHub 上查看原始碼"
          aria-label="GitHub"
          className="text-on-background opacity-70 transition-all hover:opacity-100 hover:text-primary"
        >
          <GithubMark size={24} />
        </a>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Support me on Ko-fi"
          className="flex items-center gap-xs rounded-full bg-[#3f4348] px-4 py-2 font-label-md text-label-md text-white shadow-sm transition-transform hover:scale-105"
        >
          <KofiCup size={20} />
          <span className="whitespace-nowrap">贊助我</span>
        </a>
      </div>
    </footer>
  )
}
