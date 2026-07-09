/**
 * `plotly.js-basic-dist-min` es el bundle UMD ligero (~1 MB, solo 2D) y no trae
 * tipos propios. Reusamos los de `@types/plotly.js` (devDependency) para no caer
 * en `any` (regla del repo). El runtime es un objeto CommonJS/UMD → `export =`.
 * Los tipos puros (`Data`, `Layout`…) se importan directo de 'plotly.js' como
 * type-only, así no arrastran el bundle full al build.
 */
declare module 'plotly.js-basic-dist-min' {
  import * as Plotly from 'plotly.js'
  export = Plotly
}
