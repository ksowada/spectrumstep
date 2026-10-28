# TODO

## tasks
- error: at load, cols get updated (only in RGB but not in HSL (test with S=0,L=0 => Hue is not remembered))
- HSL-accuracy: 100 ticks for S, L is less, but it appears easy as percent is handy
- HSL, HSV, RBG output at gradient: write values next to rgb-hexstring
- swap C1 & C2 button

## code
- var rgb, rgbh, hsl are redundant use input inp_cmx_arr instead

## bug
- calcform_cmx_dyna invoked multiple times
- rgb=#000000 & #ffffff lead to loss of hue info at colModeSwitch, also at save&load

## visu
- input for numbers with fixed-width font
- mark edge colors as in overdrive it is unvisible, f.e. a frame around base gradient

## ChatGPT
- HEX-Werte direkt anklickbar machen - Schnelleres Arbeiten
- „Copy CSS“-Button direkt am Gradient - Bessere Bedienbarkeit
- Presets für Pastell-, Neon- und Erdtöne	- Schnellere Ergebnisse
- Farbwerte als CSS-Variablen exportieren	- Praktisch für Entwickler
- Paletten als JSON exportieren	- Sicherung und Wiederverwendung
- Undo/Redo	- Einfaches Experimentieren
- Aktive Auswahl deutlich markieren	- Bessere Orientierung
- Kurze Animation beim Wechsel der Farben	- Lebendigere Bedienung

## repeatly work tasks
- merge sources with spare-benzin.de/src

## marketing
- github public repository