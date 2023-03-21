import fs from 'fs-extra'
import path from 'path'
import pug from 'pug'
import { PurgeCSS } from 'purgecss'
import sass from 'sass'

import * as packageJson from './package.json'

const INPUT_DIR = path.join(__dirname, 'src')
const OUTPUT_DIR = path.join(__dirname, 'dist')

const sheetJson = {
  html: `${packageJson.name}.html`,
  css: `${packageJson.name}.css`,
  authors: packageJson.author,
  roll20userid: packageJson.description,
  preview: `${packageJson.name}.png`,
  instructions: fs.readFileSync(path.join(INPUT_DIR, 'sheet.md')),
  legacy: false,
}

// Optional local variables for HTML
const locals: any = fs.readJSONSync(path.join(INPUT_DIR, 'variables.json'))

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
