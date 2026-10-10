# Dukaan Ring Builder

Standalone React + Vite + Three.js prototype, alongside `site`.

## Run

```sh
npm install
npm run dev
```

`npm run build` creates a production bundle.

## Current scope

Staged Blender GLB builder: select a band, metal, accents, layout, then center setting and sample stone. Includes 14 band profiles, adjustable plain-band dimensions, eight fitted accent styles on seven compatible profiles, seven assembly layouts, four/six-prong and bezel center settings, three metal colors, and four synthetic stones. Accent seats have closed metal floors; selecting accents uses fixed matched band dimensions. Prices are illustrative. Camera position persists across selections.

## Integration

`src/BlenderRingViewer.jsx` exports the active reusable React component. `src/catalog.js` separates sample stone records and pricing from rendering. Current GLBs are prebuilt for the four sample stones; arbitrary provider dimensions still require a parameterized fitting/generation layer. Final quotes must be calculated and verified on the server.

## Rebuild Blender assets

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --python blender/scripts/build_models.py
```

Outputs: `public/models` for component GLBs, `blender/projects/ring-library.blend` for editable meshes, and `blender/renders` for two inspection images. Blender coordinates use numeric millimeters, exported to the viewer's millimeter convention. The .blend library contains hidden alternative components and a visible sample assembly.

## Next milestones

Refine component joins and gemstone geometry; turn the complete-ring variations into interchangeable components with fit rules; add saved configurations and server quotes; integrate the external stone provider and the existing site's cart.

## Variation library

Open `/references` in the running app to inspect 54 representative complete rings: 15 setting examples, 17 layouts, 8 accent-setting examples, and 14 band styles. `/` and `/library` show the staged component builder. Each reference has a standalone GLB, editable Blender project, and rendered PNG. This is a base design catalog, not every cross-product of styles or continuous options. Tension-style designs represent appearance only.

Accent refinement details and source references are documented in `blender/ACCENT_REFINEMENT.md`. `build_fitted_bands.py` creates 56 matching recessed bands; `check_solid_seats.py` checks metal beneath representative seats. Run `node --test tests/assembly.test.mjs` for assembly and exported-material regression checks.

Generate the catalog with `blender/scripts/build_variations.py` using the same Blender command above. Optional arguments after `--` limit regeneration to named model IDs, for example `-- settings-full-bezel layouts-halo`. Run `blender/scripts/contact_sheets.py` with Python and Pillow after generation to create labeled comparison sheets and copy thumbnails into `public/previews`.

The catalog manifest lives at `public/models/variations/manifest.json`. Editable files are in `blender/projects/variations` and screenshots/comparison sheets are in `blender/renders/variations`.

## GitHub Pages

The build uses relative asset URLs, so it works at both a local root URL and
https://<username>.github.io/<repository>/ without changing configuration.
Navigation uses #/references and #/ so refreshing either view works on static hosting.
The old /references path remains supported by the local development server.

Create a GitHub repository, push this project to its main branch, then select
Settings > Pages > Build and deployment > Source > GitHub Actions.
The included workflow runs the tests, builds the app, and publishes dist on each
push to main. You can also run it manually from the Actions tab.
Blender is only needed to regenerate models; the deployed app uses public's prebuilt assets.

Local development: npm run dev.
Local production preview: npm run build, then npm run preview.
Design saves stay in the current browser; share links work on the deployed URL.
