# TODO

## tasks
- HSL, HSV, RBG output at gradient: write values next to rgb-hexstring, f.e. `hsl(30deg 82% 43%)`
- what API may help to identify colors or more?
- how to handle 3 slides at the same time/movement
- what about fixed color palettes like RAL
- create html in index.html instead in JS dynamically only use ids : for SEO, including default parameter and tooltip
- color plane should open at double click
- theme selection may pick a individual background-color from extra color input or from existing 2 colors (may be introduce transparency)
- fullscreen mode for both gradient swatch and linear (without labels)
- swatch export mode, for swatch copy function. f.e. hsl() & various formats
- **recent color view**: a list of most recent colors
  - may be tagged and retain in storage, may be exported
- swatch form: instead of default appearance, choose quadratic or circles
- swap C1 & C2 button (gradientDirection does similar)

### extension: user defined swatch pos in gradient
- show gradient as colored bar, styled similar as given input range, but with multiple selectable pos-points, the pos determines the swatch interpolation input
  - show extend of overdrive in this bar, and highlight color 1 & 2, for easy export of a found color
  - if overdrive gets saturated remove the points
  - points count origins from count & overdrive rangeselect, but may be extended dynamically by user add + and x (how this looks like?)
- gradient may be in middle of 2 endpoints. Or 1 endpoint is middle-point. So gradient extends symetrically around 1 endpoint. potentially C1 is middle-point

## code
- var rgb, rgbh, hsl are redundant use input inp_cmx_arr instead

## bug
- calcform_cmx_dyna invoked multiple times

## visu
- mark edge colors as in overdrive it is invisible, f.e. a frame around base gradient
- header is cut at broad width display, it shall be full-width
- docu as extra tab, not below gradient, there should be nothing
  - in docu use icons for explain
- selection for textContrast etc. shall be monochromatic and more visible
- all buttons and esp. the color inputs have small borders, they should be plain 
- seperate fieldset for steps and overdrive to have consistent UI
- use always the available viewport, for extending color experience, in height & width

## ChatGPT
- HEX-Werte direkt anklickbar machen - Schnelleres Arbeiten
- Presets für Pastell-, Neon- und Erdtöne	- Schnellere Ergebnisse
- Farbwerte als CSS-Variablen exportieren	- Praktisch für Entwickler
- Paletten als JSON exportieren	- Sicherung und Wiederverwendung
- Undo/Redo	- Einfaches Experimentieren
- Aktive Auswahl deutlich markieren	- Bessere Orientierung
- Kurze Animation beim Wechsel der Farben	- Lebendigere Bedienung

## marketing
- github public repository 
  - make comments all English
- subdomain spectrumstep.ardoid.eu: Google supports distinct site names for domains and subdomains, but not for individual subdirectories. Therefore, a dedicated subdomain could eventually give SpectrumStep a more independent identity in Google Search.
- JSON-LD

## docu-page
- make externally reference
- add articles 
- create task diagrams with napkin

## not usable ideas
- monochromatic, triadic color manipulations (mostly build 3 color, that don't fit in concept)