# India Road Accidents Map

An interactive choropleth of reported road accidents across Indian states and union territories in 2022. Built with SvelteKit and MapLibre GL JS and deployed to GitHub Pages.

## Features

- Select or click a state to zoom and view its accident count and national rank.
- Reset to the full India extent.
- Self-hosted boundary and accident data with no runtime dependency on another Git branch.
- Loading, data-error, map-error, and non-WebGL fallback states.
- Keyboard-accessible state selection and reduced-motion support.

## Local development

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run check
npm run lint
npm run build
```

## Data

The UI reads `static/total_accidents.csv` and joins those records to the optimized state boundaries in `static/geoBoundaries-IND-ADM1_simplified.geojson` by normalized state name.

`static/india-states.geojson` is retained as a higher-resolution source. Regenerate the web boundary file with Mapshaper when that source changes:

```bash
npx mapshaper static/india-states.geojson \
  -simplify 12% keep-shapes -clean \
  -o precision=0.0001 format=geojson static/geoBoundaries-IND-ADM1_simplified.geojson
```
