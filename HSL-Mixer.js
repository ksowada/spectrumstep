var hslInit = true; // hsl initialition possible
// TODO need swap colors sometimes as action next to use c1
var params_cmx = {
	c1: { name: 'RGB', type: 'color', unit: 'hex', callbackName: 'calcform_cmx_rgb1' },
	h1: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, max: 360, round: 0, callbackName: 'calcform_cmx_hsl1', class:'colorrange'},
	s1: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: 0, callbackName: 'calcform_cmx_hsl1', class:'colorrange'},
	l1: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: 0, callbackName: 'calcform_cmx_hsl1', class:'colorrange'},
	a1: { type: 'empty' },
	c2: { name: 'RGB', type: 'color', unit: 'hex', callbackName: 'calcform_cmx_rgb2' },
	h2: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, max: 360, round: 0, callbackName: 'calcform_cmx_hsl2', class:'colorrange'},
	s2: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: 0, callbackName: 'calcform_cmx_hsl2', class:'colorrange'},
	l2: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, max: 100, round: 0, callbackName: 'calcform_cmx_hsl2', class:'colorrange'},
	a2: { type: 'empty' },
	chc: { name: 'Steps', type: 'number', value: 4, min: 2, max: 16, step: 1, callbackName: 'calcform_cmx_dyna' },
	cha: { name: 'Overdrive', type: 'number', value: 0, min: 0, max: 16, step: 1, callbackName: 'calcform_cmx_dyna' },
};
var hslPreArr1 = [200, 60, 70];
var hslPreArr2 = [140, 90, 70];
var params_cmx_arr = undefined;
var inp_cmx_arr = undefined;
var rgb1 = [];
var rgb2 = [];
var rgb1h = '#8fbfef';
var rgb2h = '#bf8fef';
var hsl1 = [];
var hsl2 = [];
var rowCnt = undefined;
var cha = undefined;
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
const hslKeys1 = ['h1','s1','l1']
const hslKeys2 = ['h2','s2','l2']
var colMode1 = 'HSL'
var colMode2 = 'HSL'
const colModes = ['HSL', 'RGB', 'HSV']
var gradientMode = 'HSL' // as in index.html
var colMode1Switch = undefined;
var colMode2Switch = undefined;

params_cmx_arr = params_cmx;
params_cmx_arr.c1.value = rgb1h;
params_cmx_arr.c2.value = rgb2h;
inp_cmx_arr = new InputHtml({ obj: 'inp_cmx_arr', params: params_cmx_arr, el: 'form-cmx', callbackName: 'calcform_cmx_doml', callAtInit: false, storageEn: true });

var storage = new Storage({ unit: 'color-mixer', storageEn: true,
	inputLoadId:'load-input', btnLoadId:'load-btn',
	inputSaveId:'save-input', btnSaveId:'save-btn'
});

/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	storage.loadInit({ inputId:'load-input', btnId:'load-btn',callback: calcform_cmx_onLoad });
	storage.saveInit({ inputId:'save-input', btnId:'save-btn',callback: calcform_cmx_onSave });
	inp_cmx_arr.init();

	// replace text from c1 first cell through buttonswitch
	let row = document.getElementById('form-cmx-c1-row');
	let firstCell = row.cells[0];
	firstCell.innerHTML = '';
	colMode1Switch = new ButtonSwitch(firstCell, colModes, colorModeSelect1);
	row = document.getElementById('form-cmx-c2-row');
	firstCell = row.cells[0];
	firstCell.innerHTML = '';
	colMode2Switch = new ButtonSwitch(firstCell, colModes, colorModeSelect2);
	if (hslInit) {
		inp_cmx_arr.set('h1', hslPreArr1[0]);
		inp_cmx_arr.set('s1', hslPreArr1[1]);
		inp_cmx_arr.set('l1', hslPreArr1[2]);
		inp_cmx_arr.set('h2', hslPreArr2[0]);
		inp_cmx_arr.set('s2', hslPreArr2[1]);
		inp_cmx_arr.set('l2', hslPreArr2[2]);
	} else {
		inp_cmx_arr.set('c1', rgb1h);
		inp_cmx_arr.set('c2', rgb2h);
	}
}
/** berechne HSL */
function calcform_cmx_doml() {
	if (hslInit) {
		calcform_cmx_hsl1(true);
		calcform_cmx_hsl2(true);
	} else {
		calcform_cmx_rgb1(true);
		calcform_cmx_rgb2(true);
	}
	calcform_cmx_dyna();
}
/** berechne HSL */
/**
 * Unterlegt die drei Ranges (Komponente 1, 2, 3) farblich.
 * @param {number} nr     Nummer des Mischers
 * @param {string} mode   'RGB' | 'HSL' | 'HSV'
 * @param {number} c1,c2,c3
 *   RGB: r,g,b  (0-255)
 *   HSL: h (0-360), s (0-100), l (0-100)
 *   HSV: h (0-360), s (0-100), v (0-100)
 */
function calcform_cmx_range(nr, mode, c1, c2, c3) {
	// IDs der drei Ranges, ggf. an deine Benennung anpassen
	const ids = ['h', 's', 'l'];
	const el = i => document.getElementById(combineToId([inp_cmx_arr.el, ids[i] + nr, 'range']));

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
function colorModeSelect1(mode) {
	colMode1 = mode;
	
	// use RGB color as base
	rgb1 = hexToRgb(inp_cmx_arr.get('c1'));

	// manipulate range of H,S,L
	const ids = ['form-cmx-h1-range','form-cmx-s1-range','form-cmx-l1-range']
	ids.forEach((id,ix) => {
		document.getElementById(id).max = rangeMaxForMode[colMode1][ix];
	})
	// manipulate row heads
	const rowIds = ['form-cmx-h1-row','form-cmx-s1-row','form-cmx-l1-row']
	rowIds.forEach((id,ix) => {
		const row = document.getElementById(id);
		const firstCell = row.cells[0];
		firstCell.innerHTML = colModes[colModes.indexOf(colMode1)].charAt(ix);
	})
	calcform_cmx_rgb1();
}
function colorModeSelect2(mode) {
	colMode2 = mode;

	// use RGB color as base
	rgb2 = hexToRgb(inp_cmx_arr.get('c2'));

	// manipulate range of H,S,L
	const ids = ['form-cmx-h2-range','form-cmx-s2-range','form-cmx-l2-range']
	ids.forEach((id,ix) => {
		document.getElementById(id).max = rangeMaxForMode[colMode2][ix];
	})
	// manipulate row heads
	const rowIds = ['form-cmx-h2-row','form-cmx-s2-row','form-cmx-l2-row']
	rowIds.forEach((id,ix) => {
		const row = document.getElementById(id);
		const firstCell = row.cells[0];
		firstCell.innerHTML = colModes[colModes.indexOf(colMode2)].charAt(ix);
	})
	calcform_cmx_rgb2();
}
function calcform_cmx_rgb1(init) {
	const c = inp_cmx_arr.get('c1');
	rgb1 = hexToRgb(c);
	hsl1 = colorConvertFromRgb(colMode1, rgb1)
	const hslLong = []
	const hslLongRounded = []
	factorForMode[colMode1].forEach((factor,ix) => {
		hslLong[ix] = hsl1[ix] * factor;
		hslLongRounded[ix] = Math.round(hslLong[ix]);
	})
	calcform_cmx_range(1, colMode1,hslLongRounded[0], hslLongRounded[1], hslLongRounded[2])
	hslKeys1.forEach((key,ix) => inp_cmx_arr.set(key, hslLong[ix]))
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne RGB von HSL */
function calcform_cmx_rgb2(init) {
	const c = inp_cmx_arr.get('c2');
	rgb2 = hexToRgb(c);
	hsl2 = colorConvertFromRgb(colMode2, rgb2)
	const hslLong = []
	const hslLongRounded = []
	factorForMode[colMode2].forEach((factor,ix) => {
		hslLong[ix] = hsl2[ix] * factor;
		hslLongRounded[ix] = Math.round(hslLong[ix]);
	})
	calcform_cmx_range(2, colMode2,hslLongRounded[0], hslLongRounded[1], hslLongRounded[2])
	hslKeys2.forEach((key,ix) => inp_cmx_arr.set(key, hslLong[ix]))
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne RGB von HSL */
function calcform_cmx_hsl1(init) {
	const hslLong = []
	hslKeys1.forEach((key,ix) => {
		hslLong[ix] = inp_cmx_arr.get(key)
		hsl1[ix] = hslLong[ix] / factorForMode[colMode1][ix]
	})
	calcform_cmx_range(1, colMode1, hslLong[0], hslLong[1], hslLong[2])
	const rgb_per = colorConvertToRgb(colMode1, hsl1);
	rgb1h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c1', rgb1h);
	if (init == undefined) calcform_cmx_dyna();
}
function calcform_cmx_hsl2(init) {
	const hslLong = []
	hslKeys2.forEach((key,ix) => {
		hslLong[ix] = inp_cmx_arr.get(key)
		hsl2[ix] = hslLong[ix] / factorForMode[colMode2][ix]
	})
	calcform_cmx_range(2, colMode2, hslLong[0], hslLong[1], hslLong[2])
	const rgb_per = colorConvertToRgb(colMode2, hsl2);
	rgb2h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c2', rgb2h);
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(textColor, backColor) {
	if (textColor) {
		_textColor = textColor
		_backColor = undefined
	}
	if (backColor) {
		_textColor = undefined
		_backColor = backColor
	}
	rowCnt = parseInt(inp_cmx_arr.get('chc'));
	cha = parseInt(inp_cmx_arr.get('cha'));
	// hslMixEn = inp_cmx_arr.get('hsl');
	var colArr = getColors({ mode:gradientMode, len: rowCnt, c1: hsl1, c1Mode:colMode1, c2: hsl2,c2Mode:colMode2, overdrive: cha });

	// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
	colArr[cha] = inp_cmx_arr.get('c1');
	colArr[cha + rowCnt - 1] = inp_cmx_arr.get('c2');

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
	rgb1h = data.rgb1h;
	rgb2h = data.rgb2h;
	rowCnt = data.rowCnt;
	cha = data.cha;
	hslMixEn = data.hslEn
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
	inp_cmx_arr.set('c1', rgb1h);
	inp_cmx_arr.set('c2', rgb2h);
	calcform_cmx_rgb1(true);
	calcform_cmx_rgb2(true);
	inp_cmx_arr.set('chc', rowCnt);
	inp_cmx_arr.set('cha', cha);
	gradientMode = data.gradientMode
	document.querySelector(`input[name="gradientMode"][value="${gradientMode}"]`).checked = true;
	colMode1 = data.colMode1
	colMode2Switch.setValue(colMode2, true)
	colMode2 = data.colMode2
	colMode1Switch.setValue(colMode1, true)
	calcform_cmx_dyna();
}
function calcform_cmx_onSave() {
	var data = { rgb1h: rgb1h, rgb2h: rgb2h, rowCnt: rowCnt, cha: cha, textColor:_textColor, backColor:_backColor, gradientMode,colMode1,colMode2};
	storage.saveSetting({ data: data });
}
function calcform_cmx_col1_shuffle() {
	const rgb_per = Array.from({ length: 3 }, () => randomInt(256));
	rgb1h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c1', rgb1h);
	calcform_cmx_rgb1();
}
function calcform_cmx_col2_shuffle() {
	const rgb_per = Array.from({ length: 3 }, () => randomInt(256));
	rgb2h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c2', rgb2h);
	calcform_cmx_rgb2();
}
function calcform_cmx_col2_use_col1() {
	inp_cmx_arr.set('c2', rgb1h);
	calcform_cmx_rgb2();
}
function calcform_cmx_col1_use_col2() {
	inp_cmx_arr.set('c1', rgb2h);
	calcform_cmx_rgb1();
}
function calcform_cmx_col1_invert(hslMode) {
	let invertedHex = undefined
	if (hslMode) {
		const invertedHsl = [hsl1[0], hsl1[1], 1-hsl1[2]]
		const invertedRgb = hslToRgb(invertedHsl)
		invertedHex = rgbToColor(invertedRgb)
	} else {
		const rgb = hexToRgb(rgb1h)
		const invertedRgb = [255-rgb[0],255-rgb[1],255-rgb[2]] 
		invertedHex = rgbToColor(invertedRgb)
	}
	inp_cmx_arr.set('c1', invertedHex);
	calcform_cmx_rgb1();
}
function calcform_cmx_col2_invert(hslMode) {
	let invertedHex = undefined
	if (hslMode) {
		const invertedHsl = [hsl2[0], hsl2[1], 1-hsl2[2]]
		const invertedRgb = hslToRgb(invertedHsl)
		invertedHex = rgbToColor(invertedRgb)
	} else {
		const rgb = hexToRgb(rgb2h)
		const invertedRgb = [255-rgb[0],255-rgb[1],255-rgb[2]] 
		invertedHex = rgbToColor(invertedRgb)
	}
	inp_cmx_arr.set('c2', invertedHex);
	calcform_cmx_rgb2();
}
function themeCare() {
	const radios = document.querySelectorAll('input[name="theme"]');
	const savedTheme = localStorage.getItem("theme");
	const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";

	function applyTheme(theme) {
		document.documentElement.dataset.theme = theme;
		localStorage.setItem("theme", theme);

		for (const radio of radios) {
			radio.checked = radio.value === theme;
		}
	}

	applyTheme(savedTheme || systemTheme);

	for (const radio of radios) {
		radio.addEventListener("change", () => {
			if (radio.checked) applyTheme(radio.value);
		});
	}
}

function relativeLuminance([r, g, b]) {
  const linearize = (value) => {
    const channel = value / 255;

    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function getContrastInfo(color1, color2) {
  const L1 = relativeLuminance(color1);
  const L2 = relativeLuminance(color2);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    ratioText: `${ratio.toFixed(2)}:1`,
    normalTextAA: ratio >= 4.5,
    normalTextAAA: ratio >= 7,
    largeTextAA: ratio >= 3,
    largeTextAAA: ratio >= 4.5,
  };
}

// // Beispiel: weißer Text auf blauem Hintergrund
// const foreground = [255, 255, 255];
// const background = [40, 80, 120];

// const result = getContrastInfo(foreground, background);

// console.log(result.ratioText);      // z. B. "5.12:1"
// console.log(result.normalTextAA);   // true/false
// console.log(result.largeTextAA);    // true/false
// console.log(result.normalTextAAA);  // true/false
// console.log(result.largeTextAAA);   // true/false

document.addEventListener('DOMContentLoaded', function () {
	themeCare();
	calcform_cmx_init();
	calcform_cmx_doml();
	// Buttons below Color 1
	let element = document.getElementById('form-cmx-a1-row')
	let children = element.children;
	let onlyChild = children.length === 1 ? children[0] : null;
	onlyChild.innerHTML = `<button onclick="calcform_cmx_col1_shuffle()"><img class="icon" src="icons/shuffle-solid-full.svg"/>Random</button><button onclick="calcform_cmx_col1_invert(false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col1_invert(true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button><button onclick="calcform_cmx_col1_use_col2()"><img class="icon" src="icons/up-long-solid-full.svg"/>Copy</button><button onclick="calcform_cmx_col2_use_col1()"><img class="icon" src="icons/down-long-solid-full.svg"/>Copy</button>`;

	// Buttons below Color 2
	element = document.getElementById('form-cmx-a2-row')
	children = element.children;
	onlyChild = children.length === 1 ? children[0] : null;
	onlyChild.innerHTML = '<button onclick="calcform_cmx_col2_shuffle()"><img class="icon" src="icons/shuffle-solid-full.svg"/>Random</button><button onclick="calcform_cmx_col2_invert(false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col2_invert(true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button>';

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
});