# SpectrumStep

## Development

Available scripts:

- `npm start` — serve the project locally at `http://127.0.0.1:3000` using Python 3.
- `npm run build` — create a deployable `dist/` folder containing the app, documentation, styles, scripts, and assets.

## features
- besides HSL, use RGB, HSV, Oklab, and Oklch mixing and input spaces
- gamut mapping via chroma reduction when converting out-of-gamut Oklab/Oklch colors to sRGB HEX
- native CSS Color 4 linear-gradient interpolation (`in oklab`, `in oklch shorter|longer hue`, `in hsl shorter|longer hue`)
- interactive multi-pos gradient slider: thin colored bar with draggable circle knobs (same size and color as range slider thumbs) for each swatch, slidable across the full extent (0%–100%) with overtaking, real-time percentage tooltip, and live swatch color interpolation
- overdrive extrapolation with automatic pruning of duplicate saturated/clamped points
- dedicated indicator line under the gradient swatches with small monochromatic Color 1 & Color 2 markers, indicating the gradient belonging to the corner colors for instant recognition and easy HEX export
- C2 to C1 copy color and vice versa
- store in details to hide if unused
- header background controls for pure black, pure white, or a custom color; the UI automatically chooses a contrasting light or dark theme
- custom background color can be selected with the color picker or taken from Color 1 / Color 2, and is retained in the current session, shareable URL, named localStorage presets, and JSON export/import
- random color button
- RGB text input
  - expands 3-digit hex colors
  - **onkey event:** At each key, it check for valid color, then update color and gradient. If  value is invalid then don't display color (keep the last), warn with tooltip, "invalid entry". also when user leaves input with a invalid color, f.e.  5 digits instead of 6
- gradientDirection in all 4 direction
- enhanced accuracy for HSV, HSL, Oklab, and Oklch modes, no loss of RGB value
- each color in gradient holds contrast info including WCAG AA / AAA badges (Pass/Fail)
  - contrast info and the gradient rating always be visible
  - contrast info can be disabled
- copy function with visual feedback at gradient swatches & CSS linear gradient
- hue allows 2 gradients, longer and shorter way (HSL, HSV, Oklch)
- use tooltips to clarify exactly what utility does
- URL search params with color and gradientsetting to make share of colors easy
- use storage to retain information, when switching to docu and back
- documentation in header as link with same header with app and theme switch
- 2D color plane popup for each fixed color component (H/S/L, R/G/B, H/S/V, l/a/b, l/c/h) to pick the remaining 2 components (X/Y) with real-time gradient updates (opened via channel button or double-clicking the range slider)

## UI
- icon: make icons light in dark theme
- icon: every button has icon
- split Color1 and Color2 to 2 equal inputs, flex-wrap horizontally
- Steps & Overdrive without text input next to each other, for mobile with flex-wrap 
- text/back-color eliminate radio buttons and use colored-empty-buttons just as color
- HSL/RGB/HSV/Oklab/Oklch-gradient eliminate radio buttons and use single-selection-buttons
- input for numbers with monospace font
- channel identifier buttons in first column (`H/S/L`, `R/G/B`, `H/S/V`, `l/a/b`, `l/c/h`) and double-clicking channel range sliders open a floating 2D color plane aligned to the range slider width without overlapping gradient swatches

## infrastructure
- use npm package for
  - serve (it is needed for having clean links without index.html between docu and app)
