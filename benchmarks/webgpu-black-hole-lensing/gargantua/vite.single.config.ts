import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { wgslVitePlugin } from '@vgpu/wgsl/loader-vite'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, sep } from 'node:path'

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function singleHtmlPlugin(): Plugin {
  return {
    name: 'gargantua-single-html',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlAsset = Object.values(bundle).find(
        (item) => item.type === 'asset' && item.fileName === 'index.html',
      )
      if (!htmlAsset || htmlAsset.type !== 'asset') {
        throw new Error('单文件构建未生成 index.html。')
      }

      let html = String(htmlAsset.source)
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type === 'chunk') {
          const escapedName = escapeRegExp(fileName)
          const scriptPattern = new RegExp(
            `<script([^>]*?)\\s+src=["'][^"']*${escapedName}["']([^>]*)><\\/script>`,
          )
          // This plugin consumes the chunk during generateBundle, before Vite's
          // import-analysis hook gets its final chance to replace this marker.
          // A single-file build has no external chunks to preload, so `void 0`
          // is the same no-dependency value Vite would normally emit.
          const safeCode = item.code
            .replace(/__VITE_PRELOAD__/g, 'void 0')
            .replace(/<\/script/gi, '<\\/script')
          html = html.replace(
            scriptPattern,
            (_match, beforeAttributes: string, afterAttributes: string) =>
              `<script${beforeAttributes}${afterAttributes}>${safeCode}</script>`,
          )
          delete bundle[fileName]
        } else if (item.type === 'asset' && fileName.endsWith('.css')) {
          const escapedName = escapeRegExp(fileName)
          const stylePattern = new RegExp(
            `<link([^>]*?)href=["'][^"']*${escapedName}["']([^>]*)>`,
          )
          html = html.replace(stylePattern, () => `<style>${String(item.source)}</style>`)
          delete bundle[fileName]
        }
      }
      htmlAsset.source = html
    },
    async closeBundle() {
      const projectRoot = resolve(process.cwd())
      const temporaryDirectory = resolve(projectRoot, 'single-html-dist')
      const generatedFile = resolve(temporaryDirectory, 'index.html')
      const standaloneFile = resolve(projectRoot, 'standalone-black-hole.html')
      if (!temporaryDirectory.startsWith(projectRoot + sep)) {
        throw new Error('单文件临时目录超出项目范围。')
      }
      await writeFile(standaloneFile, await readFile(generatedFile))
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    wgslVitePlugin({ minify: true }),
    singleHtmlPlugin(),
  ],
  build: {
    outDir: 'single-html-dist',
    emptyOutDir: true,
    assetsInlineLimit: Number.POSITIVE_INFINITY,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
})
