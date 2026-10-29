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
	]
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
const rangeMaxForMode = {
	RGB:[255,255,255],
	HSL:[360,100,100],
	HSV:[360,100,100],
}
const rangeStepForMode = {
	RGB:['1','1','1'],
	HSL:['0.1','0.1','0.1'],
	HSV:['0.1','0.1','0.1'],
}
const roundForMode = {
	RGB:[0,0,0],
	HSL:[-1,-1,-1],
	HSV:[-1,-1,-1],
}
const factorForMode = {
	RGB:[1,1,1],
	HSL:[360,100,100],
	HSV:[360,100,100],
}
const hslKeys = ['h','s','l']
var colMode = ['HSL','HSL']
const colModes = ['HSL', 'RGB', 'HSV']
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
/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	themeSwitch = new ButtonSwitch(
		document.getElementById('theme-select'),
		themeModes, ['assets/icons/sun-solid-full.svg','assets/icons/moon-solid-full.svg'],undefined, themeCare, {
			tooltips: {
				light: 'UI Theme: Light mode active. Click to switch to Dark mode to evaluate colors against a low-luminance surround.',
				dark: 'UI Theme: Dark mode active. Click to switch to Light mode to evaluate colors against a high-luminance surround.'
			}
		});

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
				HSV: 'Input Space: Cylindrical HSV/HSB (Hue 0–360°, Saturation 0–100%, Value 0–100%). Click to switch to HSL.'
			}
		});
	})
	steps = new RangeSetting('steps',calcform_cmx_dyna, 'Discrete interpolation steps (2–16): number of equidistant color stops generated between Color 1 and Color 2');
	overdrive = new RangeSetting('overdrive',calcform_cmx_dyna, 'Overdrive extrapolation (0–16): linearly extrapolate additional color stops beyond Color 1 and Color 2 on both ends');
	gradientSwitch = new ButtonSwitch(
		document.getElementById('gradient-select'),
		colModes, 'assets/icons/arrows-rotate-solid-full.svg',undefined, () => calcform_cmx_dyna(), {
			tooltips: {
				HSL: 'Interpolation Space: HSL. Linearly interpolates Hue, Saturation, and Lightness. Click to switch to RGB.',
				RGB: 'Interpolation Space: sRGB. Linearly interpolates Red, Green, and Blue channels. Click to switch to HSV.',
				HSV: 'Interpolation Space: HSV/HSB. Linearly interpolates Hue, Saturation, and Value. Click to switch to HSL.'
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
				shorter: "Hue Path: Shorter arc (|ΔH| ≤ 180°, CSS 'in hsl shorter hue'). Interpolates along the direct path on the color wheel.",
				longer: "Hue Path: Longer arc (|ΔH| ≥ 180°, CSS 'in hsl longer hue'). Interpolates around the far side of the color wheel."
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
	textColorSelect.setValue('textContrast-black')
	for (let ix=0;ix<2;ix++) {
		if (hslInit) {
			inp_cmx_arr[ix].set('h', hslPreArr[ix][0]);
			inp_cmx_arr[ix].set('s', hslPreArr[ix][1]);
			inp_cmx_arr[ix].set('l', hslPreArr[ix][2]);
		} else {
			inp_cmx_arr[ix].set('c', rgbh[ix]);
		}
	}
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
 * @param {string} mode   'RGB' | 'HSL' | 'HSV'
 * @param {number} c1,c2,c3
 *   RGB: r,g,b  (0-255)
 *   HSL: h (0-360), s (0-100), l (0-100)
 *   HSV: h (0-360), s (0-100), v (0-100)
 */
function calcform_cmx_range(ix, mode, c1, c2, c3) {
	// IDs der drei Ranges, ggf. an deine Benennung anpassen
	const ids = ['h', 's', 'l'];
	const el = i => document.getElementById(combineToId([inp_cmx_arr[ix].el, ids[i], 'range']));

	const rgb = (r, g, b) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
	const hsl = (h, s, l) => `hsl(${h}, ${s}%, ${l}%)`;
	// CSS kennt kein HSV, daher über deine hsvToRgb() nach RGB umrechnen
	const hsv = (h, s, v) => rgb(...hsvToRgb([h / 360, s / 100, v / 100]));

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

		default:
			return;
	}
	el(0).style.background = g1;
	el(1).style.background = g2;
	el(2).style.background = g3;
}
function calcform_cmx_colorspace(mode, index, buttonSwitch, ix, init=false) {
	colMode[ix] = mode;
	
	// use RGB color as base
	rgb[ix] = hexToRgb(inp_cmx_arr[ix].get('c'));

	// manipulate range of H,S,L
	const ids = ['-h-range','-s-range','-l-range']
	ids.forEach((id,i) => {
		const newId = inp_cmx_ids[ix]+id;
		const rangeEl = document.getElementById(newId);
		if (rangeEl) {
			rangeEl.max = rangeMaxForMode[colMode[ix]][i];
			rangeEl.step = rangeStepForMode[colMode[ix]][i];
		}
		if (inp_cmx_arr[ix] && inp_cmx_arr[ix].params && inp_cmx_arr[ix].params[hslKeys[i]]) {
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
		firstCell.innerHTML = colModes[colModes.indexOf(colMode[ix])].charAt(i);
		if (inp_cmx_arr[ix] && channelTooltipsForMode[colMode[ix]]) {
			inp_cmx_arr[ix].setTooltip(hslKeys[i], channelTooltipsForMode[colMode[ix]][i]);
		}
	})
	if (!init) calcform_cmx_rgb(ix);
}
/** calculate HSL from RGB input */
function calcform_cmx_rgb(ix,init) {
	rgbh[ix] = inp_cmx_arr[ix].get('c');
	rgb[ix] = hexToRgb(rgbh[ix]);
	const oldHue = (hsl[ix] && hsl[ix][0] !== undefined) ? hsl[ix][0] : undefined;
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
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(textColor, backColor) {
	const rowCnt = steps.get()
	const cha = overdrive.get()
	const gradientMode = gradientSwitch.value;
	const gradientDirection = gradientDirectionSwitch.value;
	const gradientWay = gradientWaySwitch.value;
	const showContrast = contrastVisibilitySwitch.value !== 'hide';
	if (textColor) {
		_textColor = textColor
		_backColor = undefined
	}
	if (backColor) {
		_textColor = undefined
		_backColor = backColor
	}
	var colArr = getColors({ mode:gradientMode, len: rowCnt, c1: hsl[0], c1Mode:colMode[0], c2: hsl[1],c2Mode:colMode[1], overdrive: cha, hueWay: gradientWay });

	// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
	colArr[cha] = inp_cmx_arr[0].get('c');
	colArr[cha + rowCnt - 1] = inp_cmx_arr[1].get('c');

	if (gradientDirection==='left'||gradientDirection==='up')colArr.reverse()
	var html = `<div class="color-palette-${gradientDirection}">`
	for (var rowIx = 0; rowIx < colArr.length; rowIx++) {
		let infoBlock = '';
		if (showContrast) {
			const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(colArr[rowIx])
			const backRgb = _textColor ? hexToRgb(colArr[rowIx]) : hexToRgb(_backColor)
			const contrastInfo = getContrastInfo(textRgb, backRgb)
			const badgeHtml = '<span class="wcag-badge ' + contrastInfo.badgeClass + '" data-tooltip="' + contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')">' + contrastInfo.badge + '</span>';
			const infoHtml = '<span class="contrast-info" style="color:' + contrastInfo.infoColor + '">' + contrastInfo.ratioText + '<br/>' + badgeHtml + '</span>';
			infoBlock = '<br/>' + infoHtml;
		}
		if (_backColor==undefined) html += '<div class="color-step" onclick="copyColorStep(\'' + colArr[rowIx] + '\', this)" data-tooltip="Click to copy HEX color ' + colArr[rowIx] + ' to clipboard" style="background-color:' + colArr[rowIx] + ';color:'+_textColor+'"><span>' + colArr[rowIx] + infoBlock + '</span></div>';
		if (_textColor==undefined) html += '<div class="color-step" onclick="copyColorStep(\'' + colArr[rowIx] + '\', this)" data-tooltip="Click to copy HEX color ' + colArr[rowIx] + ' to clipboard" style="background-color:' + _backColor + ';color:'+colArr[rowIx]+'"><span>' + colArr[rowIx] + infoBlock + '</span></div>';
	}
	html += '</div>'
	document.getElementById('tab-cmx').innerHTML = html;

	// build CSS linear gradient
	const rotation = { right: '90deg', down: '180deg',left:'90deg',up:'180deg' }[gradientDirection];
	let gradientText = ''
	if (gradientMode!=='RGB') {
		gradientText += `linear-gradient(${rotation} in hsl ${gradientWay} hue,`
	} else {
		gradientText += `linear-gradient(${rotation},`
	}
	gradientText += colArr[0] + ','
	gradientText += colArr[colArr.length - 1] + ')'
	const div_grd = document.getElementById('grd-cmx')
	div_grd.innerHTML = gradientText
	div_grd.style.background = gradientText
	div_grd.style.color = _textColor
	div_grd.dataset.tooltip = "Click to copy CSS linear-gradient declaration to clipboard";
	div_grd.onclick = () => copyColorStep(gradientText, div_grd);

	document.querySelectorAll('#textContrast .btn-select').forEach(el => {
		el.style.background = gradientText;
	});
	document.querySelectorAll('#backContrast .btn-select span').forEach(span => {
		span.style.backgroundImage = gradientText;
	});
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
function calcform_cmx_onLoad() {
	var data = storage.loadSetting();
	if (data === null) return;
	rgbh = data.rgbh;
	if (data.textColor) {
		_textColor = data.textColor
		_backColor = undefined
		if (_textColor==='#ffffff') {
			textColorSelect.setValue('textContrast-white')
		} else if (_textColor==='#000000') {
			textColorSelect.setValue('textContrast-black')
		} else {
			textColorSelect.setValue('textContrast-label')
		}
	}
	if (data.backColor) {
		_textColor = undefined
		_backColor = data.backColor
		if (_backColor==='#ffffff') {
			backColorSelect.setValue('backContrast-white')
		} else if (_backColor==='#000000') {
			backColorSelect.setValue('backContrast-black')
		} else {
			backColorSelect.setValue('backContrast-color')
		}
	}
	colMode = data.colMode;
	for (let ix=0;ix<2;ix++) {
		inp_cmx_arr[ix].set('c', rgbh[ix]);
		colModeSwitch[ix].setValue(colMode[ix], true);
		calcform_cmx_colorspace(colMode[ix], undefined, undefined, ix, true);
		if (data.hsl && data.hsl[ix]) {
			hsl[ix] = data.hsl[ix].slice();
			const hslLong = [];
			factorForMode[colMode[ix]].forEach((factor, i) => {
				hslLong[i] = hsl[ix][i] * factor;
			});
			const r = roundForMode[colMode[ix]];
			calcform_cmx_range(ix, colMode[ix], round(hslLong[0], r[0]), round(hslLong[1], r[1]), round(hslLong[2], r[2]));
			hslKeys.forEach((key, i) => inp_cmx_arr[ix].set(key, hslLong[i]));
		} else {
			calcform_cmx_rgb(ix, true);
		}
	}
	steps.set(data.steps)
	overdrive.set(data.overdrive)
	gradientSwitch.setValue(data.gradientMode)
	gradientDirectionSwitch.setValue(data.gradientDirection)
	if (data.gradientWay) gradientWaySwitch.setValue(data.gradientWay)
	if (data.contrastVisibility) contrastVisibilitySwitch.setValue(data.contrastVisibility)
	themeCare(data.theme);
	calcform_cmx_dyna();
}
function calcform_cmx_onSave() {
	var data = { 
		rgbh, 
		hsl: hsl.map(arr => (Array.isArray(arr) ? arr.slice() : arr)),
		steps: steps.get(), 
		overdrive: overdrive.get(), 
		textColor:_textColor, 
		backColor:_backColor, 
		gradientMode:gradientSwitch.value,
		colMode, 
		theme:themeSwitch.value,
		gradientDirection:gradientDirectionSwitch.value,
		gradientWay:gradientWaySwitch.value,
		contrastVisibility:contrastVisibilitySwitch.value
	};
	storage.saveSetting({ data: data });
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
		const invertedHsl = [hsl[ix][0], hsl[ix][1], 1-hsl[ix][2]]
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
		themeSwitch.setValue(theme, true)
	}
	applyTheme(parameterTheme || savedTheme || systemTheme);
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
	calcform_cmx_init();
	calcform_cmx_doml();
	themeCare(); // need calcform_cmx_init before
	initTooltips();
});