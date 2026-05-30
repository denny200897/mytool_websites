# 檔案工具箱 · FileUtil

個人檔案處理工具站。**所有處理都在瀏覽器本地完成**（WebAssembly / Canvas），檔案不會上傳到任何伺服器 —— 對應原始設計稿「檔案將於本地處理或在轉換後立即刪除」的隱私訴求。

## 技術

- React 18 + TypeScript + Vite
- Tailwind CSS（design tokens 直接取自 `DESIGN.md`）
- React Router（每個工具獨立 lazy-load chunk）

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 產出 dist/
npm run preview  # 預覽 build 結果
```

> 影片工具使用 ffmpeg.wasm 的**單執行緒** core（`@ffmpeg/core`），不需要 `SharedArrayBuffer`／跨來源隔離，
> 因此不需要 COOP/COEP 標頭。若日後改用多執行緒 core（`@ffmpeg/core-mt`），才需另外設定 COOP/COEP。
> 部署用的安全標頭見 `public/_headers` 與 `vercel.json`（詳見下方「資安」）。

## 工具清單與實作

| 分類 | 工具 | 實作 |
|---|---|---|
| PDF | 合併 / 分割 / 壓縮(最佳化) / PDF→圖片 | `@cantoo/pdf-lib`、`pdfjs-dist` |
| PDF | 加密(AES-256) / 解鎖 | `@cantoo/pdf-lib`（pdf-lib 的加密 fork） |
| 圖片 | 轉換 / 調整大小 / 裁剪 / 壓縮 / 浮水印 / 圖片→PDF | Canvas API、`@cantoo/pdf-lib` |
| 文件 | OCR 擷取文字 / Markdown→HTML / Markdown→PDF | `tesseract.js`（自行 host 模型）、`marked`+`DOMPurify`、瀏覽器列印 |
| 壓縮檔 | 解壓縮 ZIP / 建立 ZIP | `jszip` |
| 數據 | CSV→Excel / JSON 格式化 / XML→JSON | `xlsx` (SheetJS)、`fast-xml-parser` |
| 影片 | 轉換 / 剪輯 / 靜音 | `@ffmpeg/ffmpeg` (ffmpeg.wasm) |

歷史紀錄存放在瀏覽器 `localStorage`，只記檔名與時間，可在「設定」清除。

## 資安

因為**全部處理都在瀏覽器本地**、沒有伺服器收檔，威脅模型是：惡意檔案攻擊使用者自己的瀏覽器解析器、XSS、以及部署/傳輸層的標頭。已實作的防護：

- **檔案內容驗證（不只看副檔名）**：`src/lib/validate.ts` 讀取檔頭 magic bytes，比對宣稱的類型（PDF `%PDF-`、PNG/JPEG/GIF/WebP/BMP、ZIP `PK`、MP4 `ftyp`/WebM EBML/AVI…）。改名的執行檔、宣稱 PDF 的 HTML 都會在進入任何解析器前被擋下。文字類（CSV/MD）則檢查非二進位。
- **檔案大小上限**：每種類型有上限（圖片 64MB、PDF 200MB、影片 1GB…），避免分頁 OOM／凍結。
- **XSS 防護**：Markdown 經 `marked` 轉出的 HTML 一律用 **DOMPurify** 清洗後才渲染／下載／列印（`marked` 本身不做消毒）。
- **下載檔名消毒**：`sanitizeFilename()` 去除路徑分隔符與控制字元，ZIP 解壓的項目名稱也經此處理，防止路徑穿越。
- **壓縮炸彈防護**：ZIP 解壓限制項目數（2000）與解壓後總大小（1GB），超過即中止。
- **全部資產自行 host、零第三方來源**：字型（Geist Sans、Material Symbols）、ffmpeg core、tesseract worker/core、OCR 語言資料全部放在本站（`public/ffmpeg`、`public/tesseract`、由 `@fontsource` / `material-symbols` 打包的字型）。不再連任何 CDN／Google Fonts。
- **CSP 收斂成只剩 `'self'`**：`public/_headers`（Netlify / Cloudflare Pages）與 `vercel.json` 內含此 CSP，加上 `nosniff`、`X-Frame-Options: DENY`、`Referrer-Policy`、`Permissions-Policy`。`vite preview` 套用同一組（dev 因 HMR 不套 CSP）。
  - CSP 中除了 `'self'`，只保留 WebAssembly／Canvas 本身必需的平台 primitive：`'wasm-unsafe-eval'`（執行 wasm）、`blob:`（wasm/worker URL）、`data:`（canvas 匯出圖片）、`style-src 'unsafe-inline'`（列印視窗的 inline style）。這些都不是第三方網域。
  - OCR 採用 **tessdata_fast** 快速模型（eng / chi_tra / chi_sim / jpn，共約 11MB）。
  - 備註：打包後的 tesseract / ffmpeg 函式庫內仍含有它們預設的 CDN 字串常數，但執行時都被我們傳入的本地路徑覆蓋，且 `connect-src 'self'` 也會擋掉任何意外的外連，因此實際上不會對外連線。

## 專案結構

```
src/
  components/   共用 UI（TopNav、Footer、Dropzone、ToolFrame…）
  pages/        Home / History / Settings / ComingSoon / NotFound
  tools/        每個工具一個檔案
  lib/          tools.ts(工具註冊表)、history、canvas、pdfjs、ffmpeg、utils
```

要新增工具：在 `src/lib/tools.ts` 加一筆，在 `src/tools/` 建元件，於 `src/App.tsx` 的 `toolModules` 註冊路由即可。
