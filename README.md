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

## Side-stone shapes

In Layout, Three-stone, Five-stone, and Graduated offer Round, Oval, Emerald,
Pear, Marquise, Princess, Cushion, Radiant, Asscher, Baguette, Tapered baguette,
Trillion, Trapezoid, and Half-moon side stones. The same shape is used for
matched pairs, with smaller outer stones in multi-stone layouts. Holders,
orientation, and shoulder clearance adapt to the selected shape. Halo and
band melee remain round. Shape selections persist in drafts, saves, shares,
and specification exports; older designs default to Round.
These are approximate visual outlines rather than certified cut/facet models.
Fancy side-stone pricing currently uses the existing round lab-diamond benchmark.

Shape references:
- https://4cs.gia.edu/en-us/blog/how-to-buy-three-stone-engagement-ring/
- https://4cs.gia.edu/en-us/blog/how-to-build-your-own-engagement-ring/
- https://www.vrai.com/configure/setting-to-diamond/three-stone/cushion-platinum-41296899571805

## Band seam refinement

Band shading removes cross-section cap faces embedded inside exported closed
bands before welding and computing surface normals. Genuine open endpoints
keep their caps. Procedural closed bands now wrap their indices directly,
without duplicate endpoints or internal caps; open endpoint caps have separate
normals. This cleanup also applies to band meshes in the reference gallery.

Run node --test tests/bandSeams.test.mjs to check every plain/fitted exported
profile and the procedural bands. For before/after viewer-normal close-ups,
run node tests/exportBandSeamChecks.mjs, then run Blender with
blender/scripts/render_band_seams.py. The export comparison uses the current
Git HEAD as the before version. Inspection renders stay in the ignored
blender/renders/band-seams folder.

The 3D viewer uses free trackball rotation, allowing repeated vertical and
horizontal turns through the poles. Scroll/pinch zoom and panning remain
available. Front, Top, Side, and Reset restore a consistent upright camera
orientation after free rotation.
Fast drags carry rotation momentum that gradually decays after release. Selecting a preset view clears momentum so the chosen view stays still.

## Gemstones and colors

Choose gemstone type and color independently for the center, layout / halo
stones, and band accents. Available visual types include Diamond, Moissanite,
Cubic zirconia (CZ), Sapphire, Ruby, Emerald, Amethyst, Aquamarine, Topaz,
Garnet, Peridot, and Spinel. Each type has a representative color palette and
optical preset; black choices use an opaque appearance. Existing stone records
supply shape and millimeter dimensions as templates.

Gemstone and color selections persist in saves, drafts, share links, and
specification exports. Old designs default to colorless Diamond.
Non-default gemstone/color choices require a quote: catalog diamond prices,
diamond carat estimates, certification, and grades do not transfer to another
gemstone. The preview does not establish natural/lab origin or availability.

References:
- https://www.gia.edu/gem-encyclopedia
- https://4cs.gia.edu/en-us/blog/diamond-alternatives-engagement-rings/
- https://www.gia.edu/doc/Winter-1997-Gems-Gemology-Synthetic-Moissanite-Diamond-Substitute.pdf

## Setting spacing

Side settings use projected crown and upper-holder bounds at their actual
raised height, with 0.18 mm visual clearance between adjacent holders.
Left/right placement is solved independently for asymmetric center shapes,
all three center holders, and each side-stone shape. Fit checks and band
attachment positions use the same solved angles. Halo melee target a
1.00 mm pitch for 0.85 mm stones, with a minimum-distance check around corners.
These are visualization clearances, not manufacturing tolerances.

Run node --test tests/settingSpacing.test.mjs for the complete placement matrix.
Inspection: node tests/exportSettingSpacing.mjs, then run Blender with
blender/scripts/render_setting_spacing.py.

## Mobile builder

The preview stays sticky above selections on phones/tablets and beside controls
on desktop. Its height adapts to the viewport so controls remain accessible.
Step navigation scrolls horizontally on small screens; touch controls and form
text remain usable without browser input zoom. Saved-design tools follow the
selection controls. Trackball bounds refresh at gesture start so scrolling
does not shift the rotation coordinates.
The builder now has separate preview and selection regions within the viewport. Only selections scroll, so they never pass beneath the preview. Save, share, image download, design JSON, and specification export are grouped in the Save / export dialog. Price breakdown and stone metadata are collapsed by default.
