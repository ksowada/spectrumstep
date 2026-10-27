var hslInit = true; // hsl initialition possible
// TODO need swap colors sometimes as action next to use c1
var params_cmx = {
	c: { name: 'RGB', type: 'color', unit: 'hex', callbackName: 'calcform_cmx_rgb' },
	h: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, round: 0, callbackName: 'calcform_cmx_hsl', class:'colorrange'},
	s: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, round: 0, callbackName: 'calcform_cmx_hsl', class:'colorrange'},
	l: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, round: 0, callbackName: 'calcform_cmx_hsl', class:'colorrange'},
};
const inp_cmx_ids = ['form-cmx-0','form-cmx-1']
var inp_cmx_arr = [];
var rgb = [[], []]
var rgbh = ['#8fbfef','#bf8fef'];
var hslPreArr = [[200, 60, 70],[140, 90, 70]];
var hsl = [[],[]];
let steps = undefined;
let overdrive = undefined;
var _textColor = '#000000';
var _backColor = undefined;
const rangeMaxForMode = {
	RGB:[255,255,255],
	HSL:[360,100,100],
	HSV:[360,100,100],
}
const factorForMode = {
	RGB:[1,1,1],
	HSL:[360,100,100],
	HSV:[360,100,100],
}
const hslKeys = ['h','s','l']
var colMode = ['HSL','HSL']
const colModes = ['HSL', 'RGB', 'HSV']
var gradientMode = 'HSL' // as in index.html
var colModeSwitch = [undefined,undefined];
var storage = new Storage({ unit: 'color-mixer', storageEn: true,
	inputLoadId:'load-input', btnLoadId:'load-btn',
	inputSaveId:'save-input', btnSaveId:'save-btn'
});
const themeModes = ['light','dark']
var themeSwitch = undefined;
/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	themeSwitch = new ButtonSwitch(
		document.getElementById('theme-select'),
		themeModes, ['icons/sun-solid-full.svg','icons/moon-solid-full.svg'],undefined, themeCare);

	storage.loadInit({ inputId:'load-input', btnId:'load-btn',callback: calcform_cmx_onLoad });
	storage.saveInit({ inputId:'save-input', btnId:'save-btn',callback: calcform_cmx_onSave });

	inp_cmx_ids.forEach((id,ix) => {
		inp_cmx_arr[ix] = new InputHtml({ obj: `inp_cmx_arr[${ix}]`, params: params_cmx, el: id, callbackName: 'calcform_cmx_doml', callbackArgs:ix,callAtInit: false, storageEn: true });
		inp_cmx_arr[ix].init();
	})

	steps = new RangeSetting('steps',calcform_cmx_dyna);
	overdrive = new RangeSetting('overdrive',calcform_cmx_dyna);

	// replace text from c1 first cell through buttonswitch
	inp_cmx_ids.forEach((id,ix) => {
		let row = document.getElementById(id+'-c-row');
		let firstCell = row.cells[0];
		firstCell.innerHTML = '';
		colModeSwitch[ix] = new ButtonSwitch(firstCell, colModes, 'icons/arrows-rotate-solid-full.svg',ix, calcform_cmx_colorspace);
	})
	for (let ix=0;ix<2;ix++) {
		if (hslInit) {
			inp_cmx_arr[ix].set('h', hslPreArr[ix][0]);
			inp_cmx_arr[ix].set('s', hslPreArr[ix][1]);
			inp_cmx_arr[ix].set('l', hslPreArr[ix][2]);
		} else {
			inp_cmx_arr[ix].set('c', rgbh[ix]);
		}
	}
	// gradient color mode
	const fieldsetGradientMode = document.querySelector("#gradientMode");
	fieldsetGradientMode.addEventListener("change", (event) => {
		// Ignoriert Änderungen am Farbfeld
		if (event.target.type !== "radio") return;
		const selected = fieldsetGradientMode.querySelector('input[type="radio"]:checked');
		gradientMode = selected.value;
		calcform_cmx_dyna();
	})
	// Text contrast
	const fieldset = document.querySelector("#textContrast");
	fieldset.addEventListener("change", (event) => {
		// Ignoriert Änderungen am Farbfeld
		if (event.target.type !== "radio") return;

		const selected = fieldset.querySelector('input[type="radio"]:checked');
		console.log(selected.value); // z. B. "light", "dark" oder "color"
		let color
		switch (selected.value) {
			case 'light': color = '#ffffff'; break;
			case 'dark': color = '#000000';break;
			case 'color': color = document.getElementById('text_color').value;break;
		}
		console.log(color)
		calcform_cmx_dyna(color, undefined)
	});
	document.getElementById('text_color').addEventListener("change", (event) => {
		let color = document.getElementById('text_color').value
		document.querySelector('input[name="textContrast"][value="color"]').checked = true;
		calcform_cmx_dyna(color, undefined)
	})

	// Back contrast
	const fieldsetBack = document.querySelector("#backContrast");
	fieldsetBack.addEventListener("change", (event) => {
		// Ignoriert Änderungen am Farbfeld
		if (event.target.type !== "radio") return;

		const selected = fieldsetBack.querySelector('input[type="radio"]:checked');
		console.log(selected.value); // z. B. "light", "dark" oder "color"
		let color
		switch (selected.value) {
			case 'text_light': color = '#ffffff'; break;
			case 'text_dark': color = '#000000';break;
			case 'text_color': color = document.getElementById('back_color').value;break;
		}
		console.log(color)
		calcform_cmx_dyna(undefined, color)
	});
	document.getElementById('back_color').addEventListener("change", (event) => {
		let color = document.getElementById('back_color').value
		document.querySelector('input[name="textContrast"][value="text_color"]').checked = true;
		calcform_cmx_dyna(undefined, color)
	})
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
		document.getElementById(newId).max = rangeMaxForMode[colMode[ix]][i];
		params_cmx[hslKeys[i]].max = rangeMaxForMode[colMode[ix]][i];
	})
	// manipulate row heads
	const rowIds = ['-h-row','-s-row','-l-row']
	rowIds.forEach((id,i) => {
		const newId = inp_cmx_ids[ix]+id;
		const row = document.getElementById(newId);
		const firstCell = row.cells[0];
		firstCell.innerHTML = colModes[colModes.indexOf(colMode[ix])].charAt(i);
	})
	if (!init) calcform_cmx_rgb(ix);
}
/** calculate HSL from RGB input */
function calcform_cmx_rgb(ix,init) {
	rgbh[ix] = inp_cmx_arr[ix].get('c');
	rgb[ix] = hexToRgb(rgbh[ix]);
	hsl[ix] = colorConvertFromRgb(colMode[ix], rgb[ix])
	const hslLong = []
	const hslLongRounded = []
	factorForMode[colMode[ix]].forEach((factor,i) => {
		hslLong[i] = hsl[ix][i] * factor;
		hslLongRounded[i] = Math.round(hslLong[i]);
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
	if (textColor) {
		_textColor = textColor
		_backColor = undefined
	}
	if (backColor) {
		_textColor = undefined
		_backColor = backColor
	}
	var colArr = getColors({ mode:gradientMode, len: rowCnt, c1: hsl[0], c1Mode:colMode[0], c2: hsl[1],c2Mode:colMode[1], overdrive: cha });

	// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
	colArr[cha] = inp_cmx_arr[0].get('c');
	colArr[cha + rowCnt - 1] = inp_cmx_arr[1].get('c');

	var html = ''
	for (var rowIx = 0; rowIx < colArr.length; rowIx++) {
		const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(colArr[rowIx])
		const backRgb = _textColor ? hexToRgb(colArr[rowIx]) : hexToRgb(_backColor)
		const contrastInfo = getContrastInfo(textRgb, backRgb)
		if (_backColor==undefined) html += '<div class="gradient" style="background-color:' + colArr[rowIx] + ';color:'+_textColor+'">' + colArr[rowIx] + ' | Contrast ratio:'+contrastInfo.ratioText+'</div>';
		if (_textColor==undefined) html += '<div class="gradient" style="background-color:' + _backColor + ';color:'+colArr[rowIx]+'">' + colArr[rowIx] + ' | Contrast ratio:'+contrastInfo.ratioText+'</div>';
	}

	document.getElementById('tab-cmx').innerHTML = html;

	// build CSS linear gradient
	let gradientText = ''
	if (gradientMode!=='RGB') {
		gradientText += 'linear-gradient(180deg in hsl shorter hue,'
	} else {
		gradientText += 'linear-gradient(180deg,'
	}
	gradientText += colArr[0] + ','
	gradientText += colArr[colArr.length - 1] + ')'
	const div_grd = document.getElementById('grd-cmx')
	div_grd.innerHTML = gradientText
	div_grd.style.background = gradientText
	div_grd.style.color = textColor
}
function calcform_cmx_onLoad() {
	var data = storage.loadSetting();
	if (data === null) return;
	rgbh = data.rgbh;
	if (data.textColor) {
		_textColor = data.textColor
		_backColor = undefined
		if (_textColor==='#ffffff') {
			document.querySelector('input[name="textContrast"][value="light"]').checked = true;
		} else if (_textColor==='#000000') {
			document.querySelector('input[name="textContrast"][value="dark"]').checked = true;
		} else {
			document.getElementById('text_color').value = _textColor
			document.querySelector('input[name="textContrast"][value="color"]').checked = true;
		}
	}
	if (data.backColor) {
		_textColor = undefined
		_backColor = data.backColor
		if (_backColor==='#ffffff') {
			document.querySelector('input[name="textContrast"][value="text_light"]').checked = true;
		} else if (_backColor==='#000000') {
			document.querySelector('input[name="textContrast"][value="text_dark"]').checked = true;
		} else {
			document.getElementById('back_color').value = _backColor
			document.querySelector('input[name="textContrast"][value="text_color"]').checked = true;
		}
	}
	colMode = data.colMode
	for (let ix=0;ix<2;ix++) {
		inp_cmx_arr[ix].set('c', rgbh[ix]);
		calcform_cmx_rgb(ix,true);
		colModeSwitch[ix].setValue(colMode[ix], true)
	}
	steps.set(data.steps)
	overdrive.set(data.overdrive)
	gradientMode = data.gradientMode
	document.querySelector(`input[name="gradientMode"][value="${gradientMode}"]`).checked = true;
	themeCare(data.theme);
	calcform_cmx_dyna();
}
function calcform_cmx_onSave() {
	var data = { rgbh, steps: steps.get(), overdrive: overdrive.get(), textColor:_textColor, backColor:_backColor, gradientMode,colMode, theme:themeSwitch.value};
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

document.addEventListener('DOMContentLoaded', function () {
	calcform_cmx_init();
	calcform_cmx_doml();
	themeCare(); // need calcform_cmx_init before
});