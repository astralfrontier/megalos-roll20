import fs from 'fs-extra'
import path from 'path'
import pug from 'pug'
import { PurgeCSS } from 'purgecss'
import sass from 'sass'

const sheetJson = {
  html: 'megalos.html',
  css: 'megalos.css',
  authors: 'Bill Garrett <garrett@astralfrontier.org>',
  roll20userid: '118980',
  preview: 'megalos.png',
  instructions:
    '**This is a test**\n\nYou can put Markdown-formatted instructions here for how to use your sheet. Please try to keep it moderately-short (500 characters or less is preferred).',
  legacy: false,
}

const INPUT_DIR = path.join(__dirname, 'sheet')
const OUTPUT_DIR = path.join(__dirname, 'dist')

// Optional local variables for HTML
const locals: any = fs.readJSONSync(path.join(INPUT_DIR, 'config.json'))

const html = pug.compileFile(path.join(INPUT_DIR, 'sheet.pug'))(locals)
const css = sass.compile(path.join(INPUT_DIR, 'sheet.sass'), {
  style: 'compressed',
}).css

new PurgeCSS()
  .purge({
    content: [{ raw: html, extension: 'html' }],
    css: [{ raw: css }],
  })
  .then((output) => {
    fs.ensureDirSync(OUTPUT_DIR)
    fs.writeJSONSync(path.join(OUTPUT_DIR, 'sheet.json'), sheetJson)
    fs.writeFileSync(path.join(OUTPUT_DIR, sheetJson.html), html)
    fs.writeFileSync(path.join(OUTPUT_DIR, sheetJson.css), output[0].css)
  })
  .catch(console.error)
