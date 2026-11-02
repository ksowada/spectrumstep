var hslInit = false; // hsl initialition possible
var params_cmx = {
	c: {
		name: 'RGB', type: 'color', unit: 'hex', callbackName: 'calcform_cmx_rgb',
		tooltip: {
			range: 'Native sRGB color picker: visually select endpoint color',
			input: 'Hexadecimal sRGB color code (#RRGGBB or 3-digit #RGB shorthand)'
		}
	},
	h: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, max: 360, round: -1, step: 'any', rangeStep: '0.1', callbackName: 'calcform_cmx_hsl', class:'colorrange'},
	s: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: -1, step: 'any', rangeStep: '0.1', callbackName: 'calcform_cmx_hsl', class:'colorrange'},
	l: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: -1, step: 'any', rangeStep: '0.1', callbackName: 'calcform_cmx_hsl', class:'colorrange'},
};
const channelTooltipsForMode = {
	HSL: [
		{
			name: 'Hue (H): angular position on the color wheel (0°–360°)',
			range: 'Hue angle slider (0° Red, 120° Green, 240° Blue, 360° Red)',
			input: 'Hue angle in degrees (0–360°, 0.1° resolution)'
		},
		{
			name: 'Saturation (S): chromatic purity in HSL space (0%–100%)',
			range: 'HSL Saturation slider (0% achromatic gray to 100% pure chroma)',
			input: 'HSL Saturation percentage (0–100%, 0.1% resolution)'
		},
		{
			name: 'Lightness (L): relative lightness (0% black, 50% pure hue, 100% white)',
			range: 'HSL Lightness slider (0% black through 50% pure color to 100% white)',
			input: 'HSL Lightness percentage (0–100%, 0.1% resolution)'
		}
	],
	RGB: [
		{
			name: 'Red (R): 8-bit additive sRGB red primary channel (0–255)',
			range: 'Red channel slider (0–255)',
			input: 'Red channel 8-bit integer value (0–255)'
		},
		{
			name: 'Green (G): 8-bit additive sRGB green primary channel (0–255)',
			range: 'Green channel slider (0–255)',
			input: 'Green channel 8-bit integer value (0–255)'
		},
		{
			name: 'Blue (B): 8-bit additive sRGB blue primary channel (0–255)',
			range: 'Blue channel slider (0–255)',
			input: 'Blue channel 8-bit integer value (0–255)'
		}
	],
	HSV: [
		{
			name: 'Hue (H): angular position on the color wheel (0°–360°)',
			range: 'Hue angle slider (0° Red, 120° Green, 240° Blue, 360° Red)',
			input: 'Hue angle in degrees (0–360°, 0.1° resolution)'
		},
		{
			name: 'Saturation (S): tint purity in HSV space (0% white/gray to 100% pure hue)',
			range: 'HSV Saturation slider (0%–100%)',
			input: 'HSV Saturation percentage (0–100%, 0.1% resolution)'
		},
		{
			name: 'Value (V): illumination brightness (0% black to 100% full brightness)',
			range: 'HSV Value / Brightness slider (0%–100%)',
			input: 'HSV Value / Brightness percentage (0–100%, 0.1% resolution)'
		}
	],
	Oklab: [
		{
			name: 'Perceptual Lightness (l): OKLab perceived lightness (0% black to 100% white)',
			range: 'OKLab Lightness slider (0% black to 100% white)',
			input: 'OKLab Lightness percentage (0–100%, 0.1% resolution)'
		},
		{
			name: 'Green–Red opponent axis (a): OKLab Cartesian a-coordinate (−0.4 green to +0.4 red)',
			range: 'OKLab a-axis slider (−0.4 green through 0 neutral to +0.4 magenta/red)',
			input: 'OKLab a-axis value (−0.4 to +0.4, 0.001 resolution)'
		},
		{
			name: 'Blue–Yellow opponent axis (b): OKLab Cartesian b-coordinate (−0.4 blue to +0.4 yellow)',
			range: 'OKLab b-axis slider (−0.4 blue through 0 neutral to +0.4 yellow)',
			input: 'OKLab b-axis value (−0.4 to +0.4, 0.001 resolution)'
		}
	],
	Oklch: [
		{
			name: 'Perceptual Lightness (l): OKLCH perceived lightness (0% black to 100% white)',
			range: 'OKLCH Lightness slider (0% black to 100% white)',
			input: 'OKLCH Lightness percentage (0–100%, 0.1% resolution)'
		},
		{
			name: 'Chroma (c): OKLCH perceptual colorfulness (0 neutral gray to 0.4 vivid; gamut-mapped to sRGB via chroma reduction)',
			range: 'OKLCH Chroma slider (0 achromatic to 0.4 vivid chroma)',
			input: 'OKLCH Chroma value (0–0.4, 0.001 resolution)'
		},
		{
			name: 'Hue (h): OKLCH perceptual hue angle (0°–360°)',
			range: 'OKLCH Hue angle slider (0°–360°)',
			input: 'OKLCH Hue angle in degrees (0–360°, 0.1° resolution)'
		}
	]
};
const channelLabelsForMode = {
	HSL: ['H', 'S', 'L'],
	RGB: ['R', 'G', 'B'],
	HSV: ['H', 'S', 'V'],
	Oklab: ['l', 'a', 'b'],
	Oklch: ['l', 'c', 'h']
};
const inp_cmx_ids = ['form-cmx-0','form-cmx-1']
var inp_cmx_arr = [];
var rgb = [[], []]
var rgbh = ['#3388ee','#ee22aa'];
var hslPreArr = [[200, 60, 70],[140, 90, 70]];
var hsl = [[],[]];
let steps = undefined;
let overdrive = undefined;
var _textColor = undefined;
var _backColor = undefined;
let gradientSlider = undefined;
let currentRelRange = { relStart: 0, relEnd: 1 };
const rangeMinForMode = {
	RGB:[0,0,0],
	HSL:[0,0,0],
	HSV:[0,0,0],
	Oklab:[0,-0.4,-0.4],
	Oklch:[0,0,0],
}
const rangeMaxForMode = {
	RGB:[255,255,255],
	HSL:[360,100,100],
	HSV:[360,100,100],
	Oklab:[100,0.4,0.4],
	Oklch:[100,0.4,360],
}
const rangeStepForMode = {
	RGB:['1','1','1'],
	HSL:['0.1','0.1','0.1'],
	HSV:['0.1','0.1','0.1'],
	Oklab:['0.1','0.001','0.001'],
	Oklch:['0.1','0.001','0.1'],
}
const roundForMode = {
	RGB:[0,0,0],
	HSL:[-1,-1,-1],
	HSV:[-1,-1,-1],
	Oklab:[-1,-3,-3],
	Oklch:[-1,-3,-1],
}
const factorForMode = {
	RGB:[1,1,1],
	HSL:[360,100,100],
	HSV:[360,100,100],
	Oklab:[100,1,1],
	Oklch:[100,1,360],
}
const hslKeys = ['h','s','l']
var colMode = ['HSL','HSL']
const colModes = ['HSL', 'RGB', 'HSV', 'Oklab', 'Oklch']
var gradientSwitch = undefined;
var colModeSwitch = [undefined,undefined];
var storage = new Storage({ unit: 'color-mixer', storageEn: true,
	inputLoadId:'load-input', btnLoadId:'load-btn',
	inputSaveId:'save-input', btnSaveId:'save-btn',
	tooltips: {
		inputLoad: 'Select a saved palette preset from browser localStorage',
		btnLoad: 'Load the selected palette preset (endpoints, color spaces, steps, contrast, and theme)',
		inputSave: 'Enter a name to store the current palette configuration in browser localStorage',
		btnSave: 'Save the current palette configuration to browser localStorage (no cookies)'
	}
});
const themeModes = ['light','dark']
var themeSwitch = undefined;
var textColorSelect = undefined;
var backColorSelect = undefined;
var gradientDirectionSwitch = undefined;
var gradientWaySwitch = undefined;
var contrastVisibilitySwitch = undefined;
var cmxStateReady = false;
const urlWayMap = {
	shorter: 'shorter',
	short: 'shorter',
	longer: 'longer',
	long: 'longer'
};
const urlWayToParam = {
	shorter: 'short',
	longer: 'long'
};
const appBaseUrl = document.currentScript ? new URL('../', document.currentScript.src).href : '';
function initThemeSwitch() {
	const themeEl = document.getElementById('theme-select');
	if (!themeEl || themeSwitch) return;
	themeSwitch = new ButtonSwitch(
		themeEl,
		themeModes, [appBaseUrl + 'assets/icons/sun-solid-full.svg', appBaseUrl + 'assets/icons/moon-solid-full.svg'], undefined, themeCare, {
			tooltips: {
				light: 'UI Theme: Light mode active. Click to switch to Dark mode to evaluate colors against a low-luminance surround.',
				dark: 'UI Theme: Dark mode active. Click to switch to Light mode to evaluate colors against a high-luminance surround.'
			}
		});
}
/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	initThemeSwitch();

	storage.loadInit({ inputId:'load-input', btnId:'load-btn',callback: calcform_cmx_onLoad });
	storage.saveInit({ inputId:'save-input', btnId:'save-btn',callback: calcform_cmx_onSave });

	inp_cmx_ids.forEach((id,ix) => {
		inp_cmx_arr[ix] = new InputHtml({ obj: `inp_cmx_arr[${ix}]`, params: params_cmx, el: id, callbackName: 'calcform_cmx_doml', callbackArgs:ix,callAtInit: false, storageEn: true });
		inp_cmx_arr[ix].init();
	})
	// replace text from c1 first cell through buttonswitch
	inp_cmx_ids.forEach((id,ix) => {
		let row = document.getElementById(id+'-c-row');
		let firstCell = row.cells[0];
		firstCell.innerHTML = '';
		colModeSwitch[ix] = new ButtonSwitch(firstCell, colModes, 'assets/icons/arrows-rotate-solid-full.svg',ix, calcform_cmx_colorspace, {
			showText: false,
			tooltips: {
				HSL: 'Input Space: Cylindrical HSL (Hue 0–360°, Saturation 0–100%, Lightness 0–100%). Click to switch to RGB.',
				RGB: 'Input Space: Additive sRGB (Red, Green, Blue 0–255). Click to switch to HSV.',
				HSV: 'Input Space: Cylindrical HSV/HSB (Hue 0–360°, Saturation 0–100%, Value 0–100%). Click to switch to Oklab.',
				Oklab: 'Input Space: Perceptual Cartesian OKLab (l 0–100%, a −0.4–0.4, b −0.4–0.4). Click to switch to Oklch.',
				Oklch: 'Input Space: Perceptual Cylindrical OKLCH (l 0–100%, c 0–0.4, h 0–360°). Click to switch to HSL.'
			}
		});
	})
	if (typeof initColorPlaneButtons === 'function') {
		initColorPlaneButtons();
	}
	steps = new RangeSetting('steps',calcform_cmx_dyna, 'Discrete interpolation steps (2–16): number of equidistant color stops generated between Color 1 and Color 2');
	overdrive = new RangeSetting('overdrive',calcform_cmx_dyna, 'Overdrive extrapolation (0–16): linearly extrapolate additional color stops beyond Color 1 and Color 2 on both ends');
	gradientSwitch = new ButtonSwitch(
		document.getElementById('gradient-select'),
		colModes, 'assets/icons/arrows-rotate-solid-full.svg',undefined, () => calcform_cmx_dyna(), {
			tooltips: {
				HSL: 'Interpolation Space: HSL. Linearly interpolates Hue, Saturation, and Lightness. Click to switch to RGB.',
				RGB: 'Interpolation Space: sRGB. Linearly interpolates Red, Green, and Blue channels. Click to switch to HSV.',
				HSV: 'Interpolation Space: HSV/HSB. Linearly interpolates Hue, Saturation, and Value. Click to switch to Oklab.',
				Oklab: 'Interpolation Space: OKLab. Perceptually uniform Cartesian interpolation (l, a, b) with chroma-reduction gamut mapping. Click to switch to Oklch.',
				Oklch: 'Interpolation Space: OKLCH. Perceptually uniform cylindrical interpolation (l, c, h) with chroma-reduction gamut mapping. Click to switch to HSL.'
			}
		});
	gradientDirectionSwitch = new ButtonSwitch(
		document.getElementById('gradientDirection'),
		['right','down','left','up'], ['assets/icons/right-long-solid-full.svg','assets/icons/down-long-solid-full.svg','assets/icons/left-long-solid-full.svg','assets/icons/up-long-solid-full.svg'],undefined, () => calcform_cmx_dyna(), {
			showText: false,
			tooltips: {
				right: 'Gradient Direction: Left → Right (90deg CSS linear-gradient). Click to cycle direction.',
				down: 'Gradient Direction: Top → Bottom (180deg CSS linear-gradient). Click to cycle direction.',
				left: 'Gradient Direction: Right → Left (reversed 90deg CSS linear-gradient). Click to cycle direction.',
				up: 'Gradient Direction: Bottom → Top (reversed 180deg CSS linear-gradient). Click to cycle direction.'
			}
		});
	gradientWaySwitch = new ButtonSwitch(
		document.getElementById('gradientWay'),
		['shorter','longer'], ['assets/icons/down-left-and-up-right-to-center-solid-full.svg','assets/icons/up-right-and-down-left-from-center-solid-full.svg'],undefined, () => calcform_cmx_dyna(), {
			showText: false,
			tooltips: {
				shorter: "Hue Path: Shorter arc (|ΔH| ≤ 180°, CSS 'shorter hue' in HSL/OKLCH). Interpolates along the direct path on the color wheel.",
				longer: "Hue Path: Longer arc (|ΔH| ≥ 180°, CSS 'longer hue' in HSL/OKLCH). Interpolates around the far side of the color wheel."
			}
		});
	contrastVisibilitySwitch = new ButtonSwitch(
		document.getElementById('contrastVisibility'),
		['show','hide'], ['assets/icons/eye-solid-full.svg','assets/icons/eye-slash-solid-full.svg'],undefined, () => calcform_cmx_dyna(), {
			showText: false,
			tooltips: {
				show: 'Hide contrast info',
				hide: 'Show contrast info'
			}
		});
	textColorSelect = new ButtonSelect(
		document.getElementById('textContrast'),
		(id, el, instance) => {
			const input = el.querySelector('input[type="color"]');
			const color = el.dataset.color ?? input?.value;
			if (input) {
				const preview = el.querySelector('span');
				preview.style.color = color;
			}
			backColorSelect.setValue(undefined, false)
			calcform_cmx_dyna(color, undefined); // dein Callback-Ziel
		},
		{
			'textContrast-black': 'Foreground Contrast Mode: Test static Black (#000000) text over the generated gradient background swatches',
			'textContrast-white': 'Foreground Contrast Mode: Test static White (#ffffff) text over the generated gradient background swatches',
			'textContrast-label': 'Foreground Contrast Mode: Pick a custom foreground text color to evaluate contrast over the gradient background swatches'
		}
	);
	backColorSelect = new ButtonSelect(
		document.getElementById('backContrast'),
		(id, el, instance) => {
			const input = el.querySelector('input[type="color"]');
			const color = el.dataset.color ?? input?.value;
			if (input) {
				const preview = el.querySelector('span');
				el.style.backgroundColor = color;
			}
			textColorSelect.setValue(undefined, false)
			calcform_cmx_dyna(undefined,color); // dein Callback-Ziel
		},
		{
			'backContrast-black': 'Background Contrast Mode: Apply the gradient to text color over a static Black (#000000) background',
			'backContrast-white': 'Background Contrast Mode: Apply the gradient to text color over a static White (#ffffff) background',
			'backContrast-label': 'Background Contrast Mode: Pick a custom static background color behind gradient-colored text'
		}
	);
	_textColor = '#000000';
	_backColor = undefined;
	textColorSelect.setValue('textContrast-black', false)
	for (let ix=0;ix<2;ix++) {
		if (hslInit) {
			inp_cmx_arr[ix].set('h', hslPreArr[ix][0]);
			inp_cmx_arr[ix].set('s', hslPreArr[ix][1]);
			inp_cmx_arr[ix].set('l', hslPreArr[ix][2]);
		} else {
			inp_cmx_arr[ix].set('c', rgbh[ix]);
		}
	}
	gradientSlider = new GradientPosSlider('grd-slider', {
		onMove: handleGradientSliderMove,
		onSelect: handleGradientSliderSelect,
		onCopy: (css, el) => copyColorStep(css, el)
	});
}
/** berechne HSL */
function calcform_cmx_doml() {
	for (let ix=0;ix<2;ix++) {
		if (hslInit) {
			calcform_cmx_hsl(ix,true);
		} else {
			calcform_cmx_rgb(ix,true);
		}
		calcform_cmx_colorspace(colMode[ix],undefined,undefined,ix,true);
	}
	calcform_cmx_dyna();
}
/** berechne HSL */
/**
 * Unterlegt die drei Ranges (Komponente 1, 2, 3) farblich.
 * @param {number} ix     Nummer des Mischers
 * @param {string} mode   'RGB' | 'HSL' | 'HSV' | 'Oklab' | 'Oklch'
 * @param {number} c1,c2,c3
 *   RGB: r,g,b  (0-255)
 *   HSL: h (0-360), s (0-100), l (0-100)
 *   HSV: h (0-360), s (0-100), v (0-100)
 *   Oklab: l (0-100), a (-0.4..0.4), b (-0.4..0.4)
 *   Oklch: l (0-100), c (0..0.4), h (0-360)
 */
function calcform_cmx_range(ix, mode, c1, c2, c3) {
	// IDs der drei Ranges, ggf. an deine Benennung anpassen
	const ids = ['h', 's', 'l'];
	const el = i => document.getElementById(combineToId([inp_cmx_arr[ix].el, ids[i], 'range']));

	const rgb = (r, g, b) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
	const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;
	// CSS kennt kein HSV, daher über deine hsvToRgb() nach RGB umrechnen
	const hsv = (h, s, v) => rgb(...hsvToRgb([h / 360, s / 100, v / 100]));
	const oklab = (l, a, b) => rgb(...oklabToRgb(l / 100, a, b));
	const oklch = (l, c, h) => rgb(...oklchToRgb(l / 100, c, h / 360));

	const grad = stops => `linear-gradient(90deg, ${stops.join(', ')})`;
	const hues = [0, 60, 120, 180, 240, 300, 360];

	let g1, g2, g3;

	switch (mode) {
		case 'RGB':
			g1 = grad([rgb(0, c2, c3), rgb(255, c2, c3)]);
			g2 = grad([rgb(c1, 0, c3), rgb(c1, 255, c3)]);
			g3 = grad([rgb(c1, c2, 0), rgb(c1, c2, 255)]);
			break;

		case 'HSL':
			g1 = grad(hues.map(h => hsl(h, c2, c3)));
			g2 = grad([hsl(c1, 0, c3), hsl(c1, 100, c3)]);
			// Schwarz -> reine Farbe (50%) -> Weiß
			g3 = grad([hsl(c1, c2, 0), hsl(c1, c2, 50), hsl(c1, c2, 100)]);
			break;

		case 'HSV':
			g1 = grad(hues.map(h => hsv(h, c2, c3)));
			g2 = grad([hsv(c1, 0, c3), hsv(c1, 100, c3)]);
			g3 = grad([hsv(c1, c2, 0), hsv(c1, c2, 100)]);
			break;

		case 'Oklab':
			g1 = grad([0, 25, 50, 75, 100].map(l => oklab(l, c2, c3)));
			g2 = grad([-0.4, -0.2, 0, 0.2, 0.4].map(a => oklab(c1, a, c3)));
			g3 = grad([-0.4, -0.2, 0, 0.2, 0.4].map(b => oklab(c1, c2, b)));
			break;

		case 'Oklch':
			g1 = grad([0, 25, 50, 75, 100].map(l => oklch(l, c2, c3)));
			g2 = grad([0, 0.1, 0.2, 0.3, 0.4].map(c => oklch(c1, c, c3)));
			g3 = grad(hues.map(h => oklch(c1, c2, h)));
			break;

		default:
			return;
	}
	el(0).style.background = g1;
	el(1).style.background = g2;
	el(2).style.background = g3;
}
function calcform_cmx_colorspace(mode, index, buttonSwitch, ix, init=false) {
	const modeChanged = colMode[ix] !== mode;
	colMode[ix] = mode;
	if (modeChanged && !init) {
		hsl[ix] = [];
	}
	
	// use RGB color as base
	rgb[ix] = hexToRgb(inp_cmx_arr[ix].get('c'));

	// manipulate range of H,S,L
	const ids = ['-h-range','-s-range','-l-range']
	ids.forEach((id,i) => {
		const newId = inp_cmx_ids[ix]+id;
		const rangeEl = document.getElementById(newId);
		if (rangeEl) {
			rangeEl.min = rangeMinForMode[colMode[ix]][i];
			rangeEl.max = rangeMaxForMode[colMode[ix]][i];
			rangeEl.step = rangeStepForMode[colMode[ix]][i];
		}
		if (inp_cmx_arr[ix] && inp_cmx_arr[ix].params && inp_cmx_arr[ix].params[hslKeys[i]]) {
			inp_cmx_arr[ix].params[hslKeys[i]].min = rangeMinForMode[colMode[ix]][i];
			inp_cmx_arr[ix].params[hslKeys[i]].max = rangeMaxForMode[colMode[ix]][i];
			inp_cmx_arr[ix].params[hslKeys[i]].rangeStep = rangeStepForMode[colMode[ix]][i];
			inp_cmx_arr[ix].params[hslKeys[i]].round = roundForMode[colMode[ix]][i];
		}
	})
	// manipulate row heads and channel tooltips
	const rowIds = ['-h-row','-s-row','-l-row']
	rowIds.forEach((id,i) => {
		const newId = inp_cmx_ids[ix]+id;
		const row = document.getElementById(newId);
		const firstCell = row.cells[0];
		const btn = firstCell.querySelector('.channel-plane-btn');
		const labels = channelLabelsForMode[colMode[ix]] || channelLabelsForMode.HSL;
		const label = labels[i];
		if (btn) {
			btn.textContent = label;
		} else {
			firstCell.innerHTML = label;
		}
		if (inp_cmx_arr[ix] && channelTooltipsForMode[colMode[ix]]) {
			inp_cmx_arr[ix].setTooltip(hslKeys[i], channelTooltipsForMode[colMode[ix]][i]);
		}
	})
	if (!init) calcform_cmx_rgb(ix);
	if (typeof updateColorPlaneButtons === 'function') updateColorPlaneButtons(ix);
}
/** calculate HSL from RGB input */
function calcform_cmx_rgb(ix,init) {
	rgbh[ix] = inp_cmx_arr[ix].get('c');
	rgb[ix] = hexToRgb(rgbh[ix]);
	const hueIdx = colMode[ix] === 'Oklch' ? 2 : 0;
	const oldHue = (hsl[ix] && hsl[ix][hueIdx] !== undefined) ? hsl[ix][hueIdx] : undefined;
	hsl[ix] = colorConvertFromRgb(colMode[ix], rgb[ix], oldHue);
	const hslLong = []
	const hslLongRounded = []
	factorForMode[colMode[ix]].forEach((factor,i) => {
		hslLong[i] = hsl[ix][i] * factor;
		const r = roundForMode[colMode[ix]][i];
		hslLongRounded[i] = round(hslLong[i], r);
	})
	calcform_cmx_range(ix, colMode[ix],hslLongRounded[0], hslLongRounded[1], hslLongRounded[2])
	hslKeys.forEach((key,i) => inp_cmx_arr[ix].set(key, hslLong[i]))
	if (typeof refreshActiveColorPlane === 'function') refreshActiveColorPlane(ix);
	if (init == undefined) calcform_cmx_dyna();
}
/** calculate RGB from HSL input */
function calcform_cmx_hsl(ix,init) {
	const hslLong = []
	hslKeys.forEach((key,i) => {
		hslLong[i] = inp_cmx_arr[ix].get(key)
		hsl[ix][i] = hslLong[i] / factorForMode[colMode[ix]][i]
	})
	calcform_cmx_range(ix, colMode[ix], hslLong[0], hslLong[1], hslLong[2])
	const rgb_per = colorConvertToRgb(colMode[ix], hsl[ix]);
	rgbh[ix] = rgbToColor(rgb_per);
	inp_cmx_arr[ix].set('c', rgbh[ix]);
	if (typeof refreshActiveColorPlane === 'function') refreshActiveColorPlane(ix);
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(textColor, backColor) {
	const rowCnt = steps.get();
	const cha = overdrive.get();
	const gradientMode = gradientSwitch.value;
	const gradientDirection = gradientDirectionSwitch.value;
	const gradientWay = gradientWaySwitch.value;
	const showContrast = contrastVisibilitySwitch.value !== 'hide';
	if (textColor) {
		_textColor = textColor;
		_backColor = undefined;
	}
	if (backColor) {
		_textColor = undefined;
		_backColor = backColor;
	}
	var colArr = getColors({
		mode: gradientMode,
		len: rowCnt,
		c1: hsl[0],
		c1Mode: colMode[0],
		c2: hsl[1],
		c2Mode: colMode[1],
		overdrive: cha,
		hueWay: gradientWay,
		pruneSaturated: true
	});

	// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
	const c1Idx = colArr.c1Index !== undefined ? colArr.c1Index : cha;
	const c2Idx = colArr.c2Index !== undefined ? colArr.c2Index : (cha + rowCnt - 1);
	colArr[c1Idx] = inp_cmx_arr[0].get('c');
	colArr[c2Idx] = inp_cmx_arr[1].get('c');

	const isReversed = (gradientDirection === 'left' || gradientDirection === 'up');
	const details = colArr.details ? colArr.details.slice() : [];
	if (isReversed) {
		colArr.reverse();
		details.reverse();
	}
	const finalC1Idx = isReversed ? (colArr.length - 1 - c1Idx) : c1Idx;
	const finalC2Idx = isReversed ? (colArr.length - 1 - c2Idx) : c2Idx;

	// Store rel range for interactive dragging across the gradient bar
	if (details.length > 0) {
		currentRelRange.relStart = details[0].rel;
		currentRelRange.relEnd = details[details.length - 1].rel;
	} else {
		currentRelRange.relStart = 0;
		currentRelRange.relEnd = 1;
	}

	const isVertical = (gradientDirection === 'down' || gradientDirection === 'up');
	let swatchesHtml = '';
	for (var rowIx = 0; rowIx < colArr.length; rowIx++) {
		let infoBlock = '';
		if (showContrast) {
			const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(colArr[rowIx]);
			const backRgb = _textColor ? hexToRgb(colArr[rowIx]) : hexToRgb(_backColor);
			const contrastInfo = getContrastInfo(textRgb, backRgb);
			const badgeHtml = '<span class="wcag-badge ' + contrastInfo.badgeClass + '" data-tooltip="' + contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')">' + contrastInfo.badge + '</span>';
			const infoHtml = '<span class="contrast-info" style="color:' + contrastInfo.infoColor + '">' + contrastInfo.ratioText + '<br/>' + badgeHtml + '</span>';
			infoBlock = '<br/>' + infoHtml;
		}

		let stepClasses = 'color-step';
		if (rowIx === finalC1Idx) {
			stepClasses += ' is-c1';
		} else if (rowIx === finalC2Idx) {
			stepClasses += ' is-c2';
		}

		const contentInner = '<span><span class="color-hex">' + colArr[rowIx] + '</span>' + infoBlock + '</span>';
		const stepStyle = _backColor === undefined
			? 'background-color:' + colArr[rowIx] + ';color:' + _textColor
			: 'background-color:' + _backColor + ';color:' + colArr[rowIx];

		swatchesHtml += '<div class="' + stepClasses + '" data-index="' + rowIx + '" onclick="calcform_cmx_stepClick(' + rowIx + ', this)" data-tooltip="Click to copy HEX color ' + colArr[rowIx] + ' to clipboard" style="' + stepStyle + '">' + contentInner + '</div>';
	}

	// Build corner color markers line under the gradient swatches
	const minCornerIdx = Math.min(finalC1Idx, finalC2Idx);
	const maxCornerIdx = Math.max(finalC1Idx, finalC2Idx);
	const pointerSymbol = isVertical ? '◀' : '▲';

	let markersHtml = `<div class="palette-corner-markers palette-corner-markers-${gradientDirection}">`;
	for (let i = 0; i < colArr.length; i++) {
		const isInRange = (i >= minCornerIdx && i <= maxCornerIdx);
		let cellClasses = 'corner-marker-cell';
		if (isInRange) cellClasses += ' in-range';

		let cellContent = '';
		if (i === finalC1Idx) {
			cellClasses += ' is-c1';
			cellContent = `<span class="corner-marker-pointer">${pointerSymbol}</span><span class="corner-marker-text">Color 1</span>`;
		} else if (i === finalC2Idx) {
			cellClasses += ' is-c2';
			cellContent = `<span class="corner-marker-pointer">${pointerSymbol}</span><span class="corner-marker-text">Color 2</span>`;
		}

		if (i === finalC1Idx || i === finalC2Idx) {
			const labelName = (i === finalC1Idx) ? 'Color 1' : 'Color 2';
			markersHtml += `<div class="${cellClasses}" data-index="${i}" onclick="calcform_cmx_markerClick(${i})" data-tooltip="Click to copy ${labelName} HEX ${colArr[i]} to clipboard">${cellContent}</div>`;
		} else {
			markersHtml += `<div class="${cellClasses}" data-index="${i}">${cellContent}</div>`;
		}
	}
	markersHtml += '</div>';

	let html = '';
	if (isVertical) {
		html = `<div class="palette-vertical-layout">`
			+ `<div class="color-palette-${gradientDirection}">${swatchesHtml}</div>`
			+ markersHtml
			+ `</div>`;
	} else {
		html = `<div class="color-palette-${gradientDirection}">${swatchesHtml}</div>`
			+ markersHtml;
	}
	document.getElementById('tab-cmx').innerHTML = html;

	// build CSS linear gradient using CSS native color space interpolation
	const rotation = { right: '90deg', down: '180deg', left: '90deg', up: '180deg' }[gradientDirection];
	let gradientSpace = '';
	if (gradientMode === 'Oklab') {
		gradientSpace = ' in oklab';
	} else if (gradientMode === 'Oklch') {
		gradientSpace = ` in oklch ${gradientWay} hue`;
	} else if (gradientMode !== 'RGB') {
		gradientSpace = ` in hsl ${gradientWay} hue`;
	}
	let gradientText = `linear-gradient(${rotation}${gradientSpace},${colArr[0]},${colArr[colArr.length - 1]})`;

	// restore preview of CSS linear-gradient on grd-cmx as before
	const div_grd = document.getElementById('grd-cmx');
	if (div_grd) {
		div_grd.innerHTML = gradientText;
		div_grd.style.background = gradientText;
		div_grd.style.color = _textColor;
		div_grd.dataset.tooltip = "Click to copy CSS linear-gradient declaration to clipboard";
		div_grd.onclick = () => copyColorStep(gradientText, div_grd);
	}

	// update GradientPosSlider unit
	if (gradientSlider) {
		const points = colArr.map((col, idx) => {
			const pos = colArr.length > 1 ? idx / (colArr.length - 1) : 0;
			const rel = details[idx] ? details[idx].rel : pos;
			return {
				index: idx,
				pos: pos,
				color: col,
				isC1: idx === finalC1Idx,
				isC2: idx === finalC2Idx,
				rel: rel
			};
		});
		gradientSlider.setPoints(points);
		gradientSlider.updateGradient(gradientText, gradientDirection);
	}

	document.querySelectorAll('#textContrast .btn-select').forEach(el => {
		el.style.background = gradientText;
	});
	document.querySelectorAll('#backContrast .btn-select span').forEach(span => {
		span.style.backgroundImage = gradientText;
	});
	calcform_cmx_syncState();
}

function handleGradientSliderMove({ index, pos, point, points }) {
	const gradientMode = gradientSwitch.value;
	const gradientWay = gradientWaySwitch.value;
	const showContrast = contrastVisibilitySwitch.value !== 'hide';

	// Compute interpolation input rel from pos across currentRelRange
	const rel = currentRelRange.relStart + pos * (currentRelRange.relEnd - currentRelRange.relStart);
	point.rel = rel;
	const newColor = getColorAtRel(rel, gradientMode, hsl[0], colMode[0], hsl[1], colMode[1], gradientWay, rgbh[0], rgbh[1]);
	point.color = newColor;

	// Update corresponding swatch in DOM
	const swatches = document.querySelectorAll('#tab-cmx .color-step');
	const swatchEl = swatches[index];
	if (swatchEl) {
		if (_backColor === undefined) {
			swatchEl.style.backgroundColor = newColor;
			if (_textColor) swatchEl.style.color = _textColor;
		} else {
			swatchEl.style.backgroundColor = _backColor;
			swatchEl.style.color = newColor;
		}
		const hexSpan = swatchEl.querySelector('.color-hex');
		if (hexSpan) hexSpan.textContent = newColor;
		swatchEl.dataset.tooltip = `Click to copy HEX color ${newColor} to clipboard`;

		if (showContrast) {
			const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(newColor);
			const backRgb = _textColor ? hexToRgb(newColor) : hexToRgb(_backColor);
			const contrastInfo = getContrastInfo(textRgb, backRgb);
			const contrastEl = swatchEl.querySelector('.contrast-info');
			if (contrastEl) {
				contrastEl.style.color = contrastInfo.infoColor;
				const badgeHtml = '<span class="wcag-badge ' + contrastInfo.badgeClass + '" data-tooltip="' + contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')">' + contrastInfo.badge + '</span>';
				contrastEl.innerHTML = contrastInfo.ratioText + '<br/>' + badgeHtml;
			}
		}
	}
}

function handleGradientSliderSelect({ index }) {
	const swatches = document.querySelectorAll('#tab-cmx .color-step');
	swatches.forEach((s, i) => {
		if (i === index) {
			s.classList.add('is-selected');
		} else {
			s.classList.remove('is-selected');
		}
	});
	const markerCells = document.querySelectorAll('#tab-cmx .corner-marker-cell');
	markerCells.forEach((m, i) => {
		if (i === index) {
			m.classList.add('is-selected');
		} else {
			m.classList.remove('is-selected');
		}
	});
}

function calcform_cmx_markerClick(index) {
	const swatchEl = document.querySelector(`#tab-cmx .color-step[data-index="${index}"]`);
	if (swatchEl) {
		calcform_cmx_stepClick(index, swatchEl);
	}
}

function calcform_cmx_stepClick(index, el) {
	if (gradientSlider) {
		gradientSlider.selectPoint(index);
	}
	handleGradientSliderSelect({ index });
	const hexSpan = el.querySelector('.color-hex');
	const hex = hexSpan ? hexSpan.textContent.trim() : el.style.backgroundColor;
	copyColorStep(hex, el);
}

let toastTimeout = null;
function showToast(message) {
	let toast = document.getElementById('cmx-toast');
	if (!toast) {
		toast = document.createElement('div');
		toast.id = 'cmx-toast';
		toast.className = 'cmx-toast';
		document.body.appendChild(toast);
	}
	toast.textContent = message;
	toast.classList.add('show');
	if (toastTimeout) clearTimeout(toastTimeout);
	toastTimeout = setTimeout(() => {
		toast.classList.remove('show');
	}, 1800);
}

function copyText(text, successMsg) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		navigator.clipboard.writeText(text).then(() => {
			showToast(successMsg || ('✓ Copied ' + text));
		}).catch(() => fallbackCopy(text, successMsg));
	} else {
		fallbackCopy(text, successMsg);
	}
}

function copyColorStep(hex, el) {
	if (el) {
		el.classList.remove('step-copied');
		void el.offsetWidth;
		el.classList.add('step-copied');
		setTimeout(() => el.classList.remove('step-copied'), 400);
	}
	copyText(hex, '✓ Copied ' + hex);
}

function fallbackCopy(text, successMsg) {
	const ta = document.createElement('textarea');
	ta.value = text;
	ta.style.position = 'fixed';
	ta.style.opacity = '0';
	document.body.appendChild(ta);
	ta.select();
	try {
		document.execCommand('copy');
		showToast(successMsg || ('✓ Copied ' + text));
	} catch (e) {
		showToast(text);
	}
	document.body.removeChild(ta);
}
function calcform_cmx_getState() {
	return {
		rgbh: rgbh.map(c => rgbCorrect(c)),
		hsl: hsl.map(arr => (Array.isArray(arr) ? arr.slice() : arr)),
		steps: steps.get(),
		overdrive: overdrive.get(),
		textColor: _textColor,
		backColor: _backColor,
		gradientMode: gradientSwitch.value,
		colMode: colMode.slice(),
		theme: themeSwitch.value,
		gradientDirection: gradientDirectionSwitch.value,
		gradientWay: gradientWaySwitch.value,
		contrastVisibility: contrastVisibilitySwitch.value
	};
}
function calcform_cmx_applyState(data) {
	if (!data) return;
	if (Array.isArray(data.rgbh) && data.rgbh.length === 2) {
		rgbh = data.rgbh.map(c => rgbCorrect(c));
	}
	if (data.textColor) {
		_textColor = rgbCorrect(data.textColor).toLowerCase();
		_backColor = undefined;
		backColorSelect.setValue(undefined, false);
		if (_textColor === '#ffffff') {
			textColorSelect.setValue('textContrast-white', false);
		} else if (_textColor === '#000000') {
			textColorSelect.setValue('textContrast-black', false);
		} else {
			const tcInput = document.getElementById('textContrast-color');
			const tcLabel = document.getElementById('textContrast-label');
			const tcPreview = document.getElementById('textContrast-color-preview');
			if (tcInput) tcInput.value = _textColor;
			if (tcLabel) textColorSelect._applyColorAccent(tcLabel, _textColor);
			if (tcPreview) tcPreview.style.color = _textColor;
			textColorSelect.setValue('textContrast-label', false);
		}
	}
	if (data.backColor) {
		_textColor = undefined;
		_backColor = rgbCorrect(data.backColor).toLowerCase();
		textColorSelect.setValue(undefined, false);
		if (_backColor === '#ffffff') {
			backColorSelect.setValue('backContrast-white', false);
		} else if (_backColor === '#000000') {
			backColorSelect.setValue('backContrast-black', false);
		} else {
			const bcInput = document.getElementById('backContrast-color');
			const bcLabel = document.getElementById('backContrast-label');
			if (bcInput) bcInput.value = _backColor;
			if (bcLabel) {
				backColorSelect._applyColorAccent(bcLabel, _backColor);
				bcLabel.style.backgroundColor = _backColor;
			}
			backColorSelect.setValue('backContrast-label', false);
		}
	}
	if (Array.isArray(data.colMode) && data.colMode.length === 2) {
		colMode = data.colMode.map(m => colModes.find(cm => cm.toLowerCase() === String(m).toLowerCase()) || 'HSL');
	}
	for (let ix = 0; ix < 2; ix++) {
		inp_cmx_arr[ix].set('c', rgbh[ix]);
		colModeSwitch[ix].setValue(colMode[ix], true);
		calcform_cmx_colorspace(colMode[ix], undefined, undefined, ix, true);
		if (data.hsl && Array.isArray(data.hsl[ix]) && data.hsl[ix].length === 3) {
			hsl[ix] = data.hsl[ix].slice();
			const hslLong = [];
			factorForMode[colMode[ix]].forEach((factor, i) => {
				hslLong[i] = hsl[ix][i] * factor;
			});
			const r = roundForMode[colMode[ix]];
			calcform_cmx_range(ix, colMode[ix], round(hslLong[0], r[0]), round(hslLong[1], r[1]), round(hslLong[2], r[2]));
			hslKeys.forEach((key, i) => inp_cmx_arr[ix].set(key, hslLong[i]));
			if (typeof refreshActiveColorPlane === 'function') refreshActiveColorPlane(ix);
		} else {
			calcform_cmx_rgb(ix, true);
		}
	}
	if (data.steps !== undefined) steps.set(Number(data.steps));
	if (data.overdrive !== undefined) overdrive.set(Number(data.overdrive));
	if (data.gradientMode) {
		const matchedGm = colModes.find(cm => cm.toLowerCase() === String(data.gradientMode).toLowerCase());
		if (matchedGm) gradientSwitch.setValue(matchedGm, true);
	}
	if (data.gradientDirection) gradientDirectionSwitch.setValue(data.gradientDirection, true);
	if (data.gradientWay) gradientWaySwitch.setValue(data.gradientWay, true);
	if (data.contrastVisibility) contrastVisibilitySwitch.setValue(data.contrastVisibility, true);
	if (data.theme) themeCare(data.theme);
	calcform_cmx_dyna();
}
function calcform_cmx_updateUrl(data) {
	const params = new URLSearchParams();
	[0, 1].forEach(ix => {
		const num = ix + 1;
		const mode = data.colMode[ix] || 'HSL';
		const hex = rgbCorrect(data.rgbh[ix]).slice(1).toLowerCase();
		params.set('c' + num, hex);
		params.set('m' + num, mode.toLowerCase());
		if (data.hsl && Array.isArray(data.hsl[ix])) {
			const factors = factorForMode[mode];
			const rounds = roundForMode[mode];
			const chStr = data.hsl[ix]
				.map((v, i) => getTextOfRound(v * factors[i], rounds[i]))
				.join('-');
			params.set('ch' + num, chStr);
		}
	});
	params.set('st', String(data.steps));
	params.set('od', String(data.overdrive));
	params.set('gm', (data.gradientMode || 'HSL').toLowerCase());
	params.set('gd', data.gradientDirection || 'right');
	params.set('gw', urlWayToParam[data.gradientWay] || 'short');
	params.set('cv', data.contrastVisibility || 'show');
	if (data.backColor) {
		params.set('bc', rgbCorrect(data.backColor).slice(1).toLowerCase());
	} else if (data.textColor) {
		params.set('tc', rgbCorrect(data.textColor).slice(1).toLowerCase());
	}
	if (data.theme) {
		params.set('th', data.theme);
	}
	const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
	window.history.replaceState(null, '', newUrl);
}
function calcform_cmx_getUrlState() {
	if (!window.location.search || window.location.search.length <= 1) return null;
	const params = new URLSearchParams(window.location.search);
	const knownKeys = ['c1', 'm1', 'ch1', 'c2', 'm2', 'ch2', 'st', 'od', 'gm', 'gd', 'gw', 'cv', 'tc', 'bc', 'th'];
	if (!knownKeys.some(k => params.has(k))) return null;

	const state = calcform_cmx_getState();
	const isHex = v => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

	[0, 1].forEach(ix => {
		const num = ix + 1;
		const mParam = params.get('m' + num);
		const matchedMode = mParam ? colModes.find(cm => cm.toLowerCase() === mParam.toLowerCase()) : null;
		if (matchedMode) {
			state.colMode[ix] = matchedMode;
		}
		const mode = state.colMode[ix];
		const cParam = params.get('c' + num);
		const chParam = params.get('ch' + num);
		const validHex = (cParam && isHex(cParam)) ? rgbCorrect(cParam).toLowerCase() : null;

		let parsedCh = null;
		if (chParam) {
			const parts = chParam.split(/(?<=[\d.])-|[_,]/).map(Number);
			if (parts.length === 3 && parts.every(n => !isNaN(n))) {
				const mins = rangeMinForMode[mode];
				const maxes = rangeMaxForMode[mode];
				const factors = factorForMode[mode];
				parsedCh = parts.map((val, i) => bound(val, mins[i], maxes[i]) / factors[i]);
			}
		}

		if (validHex && parsedCh) {
			const hexFromCh = rgbCorrect(rgbToColor(colorConvertToRgb(mode, parsedCh))).toLowerCase();
			state.rgbh[ix] = validHex;
			if (hexFromCh === validHex) {
				state.hsl[ix] = parsedCh;
			} else {
				const hueIdx = mode === 'Oklch' ? 2 : 0;
				state.hsl[ix] = colorConvertFromRgb(mode, hexToRgb(validHex), parsedCh[hueIdx]);
			}
		} else if (validHex) {
			state.rgbh[ix] = validHex;
			state.hsl[ix] = colorConvertFromRgb(mode, hexToRgb(validHex));
		} else if (parsedCh) {
			state.hsl[ix] = parsedCh;
			state.rgbh[ix] = rgbCorrect(rgbToColor(colorConvertToRgb(mode, parsedCh))).toLowerCase();
		} else if (mParam) {
			state.hsl[ix] = colorConvertFromRgb(mode, hexToRgb(state.rgbh[ix]));
		}
	});

	if (params.has('st')) {
		const st = parseInt(params.get('st'), 10);
		if (!isNaN(st)) state.steps = bound(st, 2, 16);
	}
	if (params.has('od')) {
		const od = parseInt(params.get('od'), 10);
		if (!isNaN(od)) state.overdrive = bound(od, 0, 16);
	}
	if (params.has('gm')) {
		const gmParam = params.get('gm');
		const matchedGm = gmParam ? colModes.find(cm => cm.toLowerCase() === gmParam.toLowerCase()) : null;
		if (matchedGm) state.gradientMode = matchedGm;
	}
	if (params.has('gd')) {
		const gd = params.get('gd').toLowerCase();
		if (['right', 'down', 'left', 'up'].includes(gd)) state.gradientDirection = gd;
	}
	if (params.has('gw')) {
		const gw = urlWayMap[params.get('gw').toLowerCase()];
		if (gw) state.gradientWay = gw;
	}
	if (params.has('cv')) {
		const cv = params.get('cv').toLowerCase();
		if (['show', 'hide'].includes(cv)) state.contrastVisibility = cv;
	}
	if (params.has('tc')) {
		const tc = params.get('tc');
		if (isHex(tc)) {
			state.textColor = rgbCorrect(tc).toLowerCase();
			state.backColor = undefined;
		}
	} else if (params.has('bc')) {
		const bc = params.get('bc');
		if (isHex(bc)) {
			state.backColor = rgbCorrect(bc).toLowerCase();
			state.textColor = undefined;
		}
	}
	if (params.has('th')) {
		const th = params.get('th').toLowerCase();
		if (themeModes.includes(th)) state.theme = th;
	}

	return state;
}
function calcform_cmx_syncState() {
	if (!cmxStateReady) return;
	const state = calcform_cmx_getState();
	storage.saveState(state);
	calcform_cmx_updateUrl(state);
}
function calcform_cmx_onLoad() {
	var data = storage.loadSetting();
	if (data === null) return;
	calcform_cmx_applyState(data);
}
function calcform_cmx_onSave() {
	storage.saveSetting({ data: calcform_cmx_getState() });
}
function calcform_cmx_col_shuffle(ix) {
	const rgb_per = Array.from({ length: 3 }, () => randomInt(256));
	rgbh[ix] = rgbToColor(rgb_per);
	inp_cmx_arr[ix].set('c', rgbh[ix]);
	calcform_cmx_rgb(ix);
}
function calcform_cmx_use_col(ix) {
	inp_cmx_arr[1-ix].set('c', rgbh[ix]);
	calcform_cmx_rgb(1-ix);
}
function calcform_cmx_col_invert(ix,hslMode) {
	let invertedHex = undefined
	if (hslMode) {
		const curHsl = colMode[ix] === 'HSL' ? hsl[ix] : rgbToHsl(hexToRgb(rgbh[ix]));
		const invertedHsl = [curHsl[0], curHsl[1], 1-curHsl[2]]
		const invertedRgb = hslToRgb(invertedHsl)
		invertedHex = rgbToColor(invertedRgb)
	} else {
		const rgb = hexToRgb(rgbh[ix])
		const invertedRgb = [255-rgb[0],255-rgb[1],255-rgb[2]] 
		invertedHex = rgbToColor(invertedRgb)
	}
	inp_cmx_arr[ix].set('c', invertedHex);
	calcform_cmx_rgb(ix);
}
function themeCare(text, ix) {
	// determine mode from ix, if undefined parameterTheme gets undefined
	const parameterTheme = text ? text : themeModes[ix]
	const savedTheme = localStorage.getItem("theme");
	const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
	function applyTheme(theme) {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("theme", theme);
		if (themeSwitch) themeSwitch.setValue(theme, true);
		if (!cmxStateReady && storage) {
			const savedState = storage.loadState();
			if (savedState && typeof savedState === 'object') {
				savedState.theme = theme;
				storage.saveState(savedState);
			}
		}
	}
	applyTheme(parameterTheme || savedTheme || systemTheme);
	calcform_cmx_syncState();
}

var activeTooltipTarget = null;
function getTooltipEl() {
	let tip = document.getElementById('cmx-tooltip');
	if (!tip) {
		tip = document.createElement('div');
		tip.id = 'cmx-tooltip';
		tip.className = 'cmx-tooltip';
		tip.setAttribute('role', 'tooltip');
		document.body.appendChild(tip);
	}
	return tip;
}

function positionTooltip(target) {
	if (!target || !target.dataset.tooltip) return;
	const tip = getTooltipEl();
	tip.textContent = target.dataset.tooltip;
	tip.classList.add('show');

	const rect = target.getBoundingClientRect();
	const tipRect = tip.getBoundingClientRect();
	const gap = 9;
	const margin = 8;

	let pos = 'top';
	let top = rect.top - tipRect.height - gap;
	if (top < margin) {
		pos = 'bottom';
		top = rect.bottom + gap;
	}
	const centerX = rect.left + rect.width / 2;
	let left = centerX - tipRect.width / 2;
	left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));
	const arrowX = Math.max(12, Math.min(centerX - left, tipRect.width - 12));

	tip.dataset.pos = pos;
	tip.style.top = `${Math.round(top)}px`;
	tip.style.left = `${Math.round(left)}px`;
	tip.style.setProperty('--arrow-x', `${Math.round(arrowX)}px`);
}

function updateActiveTooltip(el) {
	if (activeTooltipTarget === el && el && el.dataset.tooltip) {
		positionTooltip(el);
	}
}

function hideTooltip() {
	activeTooltipTarget = null;
	const tip = document.getElementById('cmx-tooltip');
	if (tip) tip.classList.remove('show');
}

function initTooltips() {
	document.addEventListener('mouseover', function (e) {
		const target = e.target.closest('[data-tooltip]');
		if (!target || !target.dataset.tooltip) {
			hideTooltip();
			return;
		}
		activeTooltipTarget = target;
		positionTooltip(target);
	});
	document.addEventListener('mouseout', function (e) {
		if (!activeTooltipTarget) return;
		const related = e.relatedTarget ? e.relatedTarget.closest('[data-tooltip]') : null;
		if (related !== activeTooltipTarget) {
			hideTooltip();
		}
	});
	document.addEventListener('focusin', function (e) {
		const target = e.target.closest('[data-tooltip]');
		if (target && target.dataset.tooltip) {
			activeTooltipTarget = target;
			positionTooltip(target);
		}
	});
	document.addEventListener('focusout', hideTooltip);
	window.addEventListener('scroll', hideTooltip, { passive: true });
	window.addEventListener('resize', hideTooltip, { passive: true });
}

document.addEventListener('DOMContentLoaded', function () {
	if (!document.getElementById('form-cmx-0')) {
		initThemeSwitch();
		themeCare();
		initTooltips();
		return;
	}
	calcform_cmx_init();
	calcform_cmx_doml();
	themeCare(); // need calcform_cmx_init before
	const urlState = calcform_cmx_getUrlState();
	const savedState = storage.loadState();
	if (urlState) {
		calcform_cmx_applyState(urlState);
	} else if (savedState) {
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme && themeModes.includes(savedTheme)) {
			savedState.theme = savedTheme;
		}
		calcform_cmx_applyState(savedState);
	}
	cmxStateReady = true;
	calcform_cmx_syncState();
	initTooltips();
	window.addEventListener('popstate', function () {
		const popState = calcform_cmx_getUrlState();
		if (popState) {
			calcform_cmx_applyState(popState);
		}
	});
});