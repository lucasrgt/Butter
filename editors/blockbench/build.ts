import { join } from 'node:path'

const result = await Bun.build({
  entrypoints: [join(import.meta.dir, 'src/index.ts')],
  outdir: join(import.meta.dir, 'dist'),
  naming: 'blockbench_butter.js',
  target: 'browser',
  format: 'iife',
  minify: true,
  plugins: [{
    name: 'inline-css',
    setup(build) {
      build.onLoad({ filter: /\.css$/ }, async ({ path }) => ({
        contents: `export default ${JSON.stringify(await Bun.file(path).text())}`,
        loader: 'js',
      }))
    },
  }],
})
if (!result.success) throw new Error(result.logs.join('\n'))
console.log(`Built ${result.outputs[0].path}`)
