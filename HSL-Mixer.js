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
	hsl: { name: 'HSL-Gradient', type: 'checkbox', value: hslInit, callbackName: 'calcform_cmx_dyna' },
};
var colCnt = 1;
var rgbPreArr1 = ['#8fbfef', '#00ff00', '#0000ff'];
var rgbPreArr2 = ['#bf8fef', '#80ff80', '#8080ff'];
var hslPreArr1 = [[200, 50, 50], [350, 50, 50], [80, 50, 50]];
var hslPreArr2 = [[200, 50, 90], [350, 50, 90], [80, 50, 90]];
var params_cmx_arr = [];
var inp_cmx_arr = [];
var c = [];
var rgb1 = [[]];
var rgb2 = [[]];
var rgb1h = rgbPreArr1;
var rgb2h = rgbPreArr2;
var hsl1 = [[], [], []];
var hsl2 = [[], [], []];
var rowCnt = [];
var cha = [];
var hslMixEn = [];
var _textColor = '#000000';
var _backColor = undefined;

for (var i = 0; i < colCnt; i++) {
	params_cmx_arr[i] = params_cmx;
	params_cmx_arr[i].c1.value = rgbPreArr1[i];
	params_cmx_arr[i].c2.value = rgbPreArr2[i];
	inp_cmx_arr[i] = new InputHtml({ obj: 'inp_cmx_arr[' + i + ']', params: params_cmx_arr[i], el: 'form-cmx' + i, callbackName: 'calcform_cmx_doml', callbackArgs: i, callAtInit: false, storageEn: true });
}
var storage = new Storage({ unit: 'color-mixer', storageEn: true, 
	inputLoadId:'load-input', btnLoadId:'load-btn',
	inputSaveId:'save-input', btnSaveId:'save-btn'
});

/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	storage.loadInit({ inputId:'load-input', btnId:'load-btn',callback: calcform_cmx_onLoad });
	storage.saveInit({ inputId:'save-input', btnId:'save-btn',callback: calcform_cmx_onSave });
	for (var i = 0; i < colCnt; i++) {
		inp_cmx_arr[i].init();
		if (hslInit) {
			inp_cmx_arr[i].set('h1', hslPreArr1[i][0]);
			inp_cmx_arr[i].set('s1', hslPreArr1[i][1]);
			inp_cmx_arr[i].set('l1', hslPreArr1[i][2]);
			inp_cmx_arr[i].set('h2', hslPreArr2[i][0]);
			inp_cmx_arr[i].set('s2', hslPreArr2[i][1]);
			inp_cmx_arr[i].set('l2', hslPreArr2[i][2]);
		} else {
			inp_cmx_arr[i].set('c1', rgbPreArr1[i]);
			inp_cmx_arr[i].set('c2', rgbPreArr2[i]);
		}
	}
}
/** berechne HSL */
function calcform_cmx_doml(i) {
	if (hslInit) {
		calcform_cmx_hsl1(i, true);
		calcform_cmx_hsl2(i, true);
	} else {
		calcform_cmx_rgb1(i, true);
		calcform_cmx_rgb2(i, true);
	}
	calcform_cmx_dyna(i);
}
/** berechne HSL */
function calcform_cmx_hsl_range(i, nr, h, s, l) {
	document.getElementById(combineToId([inp_cmx_arr[i].el, 'h' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl longer hue, hsl(0, ${s}%, ${l}%), hsl(0, ${s}%, ${l}%))`;
	document.getElementById(combineToId([inp_cmx_arr[i].el, 's' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
	// use 1% to 99% to help for replacing hsl to rgb black to white
	document.getElementById(combineToId([inp_cmx_arr[i].el, 'l' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, ${s}%, 1%), hsl(${h}, ${s}%, 99%))`;
}
function calcform_cmx_rgb1(i, init) {
	c[i] = inp_cmx_arr[i].get('c1');
	rgb1[i] = hexToRgb(c[i]);
	hsl1[i] = rgbToHsl(rgb1[i]);
	const hsl_0 = Math.round(hsl1[i][0] * 360)
	const hsl_1 = Math.round(hsl1[i][1] * 100)
	const hsl_2 = Math.round(hsl1[i][2] * 100)
	calcform_cmx_hsl_range(i, 1, hsl_0, hsl_1, hsl_2)
	inp_cmx_arr[i].set('h1', hsl1[i][0] * 360);
	inp_cmx_arr[i].set('s1', hsl1[i][1] * 100);
	inp_cmx_arr[i].set('l1', hsl1[i][2] * 100);
	var rgb_per = hslToRgb(hsl1[i][0], hsl1[i][1], hsl1[i][2]);
	rgb1h[i] = rgbToColor(rgb_per);
	inp_cmx_arr[i].set('c1', rgb1h[i]);
	if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne RGB von HSL */
function calcform_cmx_rgb2(i, init) {
	c[i] = inp_cmx_arr[i].get('c2');
	rgb2[i] = hexToRgb(c[i]);
	hsl2[i] = rgbToHsl(rgb2[i]);
	const hsl_0 = Math.round(hsl2[i][0] * 360)
	const hsl_1 = Math.round(hsl2[i][1] * 100)
	const hsl_2 = Math.round(hsl2[i][2] * 100)
	calcform_cmx_hsl_range(i, 2, hsl_0, hsl_1, hsl_2)
	inp_cmx_arr[i].set('h2', hsl2[i][0] * 360);
	inp_cmx_arr[i].set('s2', hsl2[i][1] * 100);
	inp_cmx_arr[i].set('l2', hsl2[i][2] * 100);
	var rgb_per = hslToRgb(hsl2[i][0], hsl2[i][1], hsl2[i][2]);
	rgb2h[i] = rgbToColor(rgb_per);
	inp_cmx_arr[i].set('c2', rgb2h[i]);
	if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne RGB von HSL */
function calcform_cmx_hsl1(i, init) {
	hsl1[i][0] = inp_cmx_arr[i].get('h1') / 360;
	hsl1[i][1] = inp_cmx_arr[i].get('s1') / 100;
	hsl1[i][2] = inp_cmx_arr[i].get('l1') / 100;
	const hsl_0 = Math.round(hsl1[i][0] * 360)
	const hsl_1 = Math.round(hsl1[i][1] * 100)
	const hsl_2 = Math.round(hsl1[i][2] * 100)
	calcform_cmx_hsl_range(i, 1, hsl_0, hsl_1, hsl_2)
	var rgb_per = hslToRgb(hsl1[i][0], hsl1[i][1], hsl1[i][2]);
	rgb1h[i] = rgbToColor(rgb_per);
	inp_cmx_arr[i].set('c1', rgb1h[i]);
	if (init == undefined) calcform_cmx_dyna(i);
}
function calcform_cmx_hsl2(i, init) {
	hsl2[i][0] = inp_cmx_arr[i].get('h2') / 360;
	hsl2[i][1] = inp_cmx_arr[i].get('s2') / 100;
	hsl2[i][2] = inp_cmx_arr[i].get('l2') / 100;
	const hsl_0 = Math.round(hsl2[i][0] * 360)
	const hsl_1 = Math.round(hsl2[i][1] * 100)
	const hsl_2 = Math.round(hsl2[i][2] * 100)
	calcform_cmx_hsl_range(i, 2, hsl_0, hsl_1, hsl_2)
	var rgb_per = hslToRgb(hsl2[i][0], hsl2[i][1], hsl2[i][2]);
	rgb2h[i] = rgbToColor(rgb_per);
	inp_cmx_arr[i].set('c2', rgb2h[i]);
	if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(i, textColor, backColor) {
	if (textColor) {
		_textColor = textColor
		_backColor = undefined
	}
	if (backColor) {
		_textColor = undefined
		_backColor = backColor
	}
	rowCnt[i] = parseInt(inp_cmx_arr[i].get('chc'));
	cha[i] = parseInt(inp_cmx_arr[i].get('cha'));
	hslMixEn[i] = inp_cmx_arr[i].get('hsl');
	var colArr = [];

	// vergleiche rgb1 und rgb2 um in beide Richtungen zu blenden
	if (hslMixEn[i]) {
		colArr = getHSLColors({ len: rowCnt[i], hsl1: hsl1[i], hsl2: hsl2[i], overdrive: cha[i] });

		// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
		colArr[cha[i]] = inp_cmx_arr[i].get('c1');
		colArr[cha[i] + rowCnt[i] - 1] = inp_cmx_arr[i].get('c2');
	} else {
		c[i] = inp_cmx_arr[i].get('c1');
		rgb1[i] = hexToRgb(c[i]);
		c[i] = inp_cmx_arr[i].get('c2');
		rgb2[i] = hexToRgb(c[i]);
		colArr = getRGBColors({ len: rowCnt[i], c1: rgb1h[i], c2: rgb2h[i], overdrive: cha[i]  });
	}
	var html = ''
	for (var rowIx = 0; rowIx < colArr.length; rowIx++) {
		const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(colArr[rowIx])
		const backRgb = _textColor ? hexToRgb(colArr[rowIx]) : hexToRgb(_backColor)
		const contrastInfo = getContrastInfo(textRgb, backRgb)
		if (_backColor==undefined) html += '<div class="gradient" style="background-color:' + colArr[rowIx] + ';color:'+_textColor+'">' + colArr[rowIx] + ' | Contrast ratio:'+contrastInfo.ratioText+'</div>';
		if (_textColor==undefined) html += '<div class="gradient" style="background-color:' + _backColor + ';color:'+colArr[rowIx]+'">' + colArr[rowIx] + ' | Contrast ratio:'+contrastInfo.ratioText+'</div>';
	}

	document.getElementById('tab-cmx' + i).innerHTML = html;

	// build CSS linear gradient
	let gradientText = ''
	if (hslMixEn) {
		gradientText += 'linear-gradient(180deg in hsl shorter hue,'
	} else {
		gradientText += 'linear-gradient(180deg,'
	}
	gradientText += colArr[0] + ','
	gradientText += colArr[colArr.length - 1] + ')'
	const div_grd = document.getElementById('grd-cmx' + i)
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
	for (i = 0; i < colCnt; i++) {
		inp_cmx_arr[i].set('c1', rgb1h[i]);
		inp_cmx_arr[i].set('c2', rgb2h[i]);
		calcform_cmx_rgb1(i, true);
		calcform_cmx_rgb2(i, true);
		inp_cmx_arr[i].set('chc', rowCnt[i]);
		inp_cmx_arr[i].set('cha', cha[i]);
		inp_cmx_arr[i].set('hsl', hslMixEn[i]);
		calcform_cmx_dyna(i);
	}
}
function calcform_cmx_onSave() {
	var data = { rgb1h: rgb1h, rgb2h: rgb2h, rowCnt: rowCnt, cha: cha, textColor:_textColor, backColor:_backColor, hslEn:hslMixEn};
	storage.saveSetting({ data: data });
}
function calcform_cmx_col2_use_col1(i) {
	inp_cmx_arr[i].set('c2', rgb1h[i]);
	calcform_cmx_rgb2(i);
}
function calcform_cmx_col1_invert(i,hslMode) {
	let invertedHex = undefined
	if (hslMode) {
		const invertedHsl = [hsl1[i][0], hsl1[i][1], 1-hsl1[i][2]]
		const invertedRgb = hslToRgb(invertedHsl)
		invertedHex = rgbToColor(invertedRgb)
	} else {
		const rgb = hexToRgb(rgb1h[i])
		const invertedRgb = [255-rgb[0],255-rgb[1],255-rgb[2]] 
		invertedHex = rgbToColor(invertedRgb)
	}
	inp_cmx_arr[i].set('c1', invertedHex);
	calcform_cmx_rgb1(i);
}
function calcform_cmx_col2_invert(i,hslMode) {
	let invertedHex = undefined
	if (hslMode) {
		const invertedHsl = [hsl2[i][0], hsl2[i][1], 1-hsl2[i][2]]
		const invertedRgb = hslToRgb(invertedHsl)
		invertedHex = rgbToColor(invertedRgb)
	} else {
		const rgb = hexToRgb(rgb2h[i])
		const invertedRgb = [255-rgb[0],255-rgb[1],255-rgb[2]] 
		invertedHex = rgbToColor(invertedRgb)
	}
	inp_cmx_arr[i].set('c2', invertedHex);
	calcform_cmx_rgb2(i);
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
	for (i = 0; i < colCnt; i++) {
		calcform_cmx_doml(i);
	}
	// Buttons below Color 1
	let element = document.getElementById('form-cmx0-a1-row')
	let children = element.children;
	let onlyChild = children.length === 1 ? children[0] : null;
	onlyChild.innerHTML = `<button onclick="calcform_cmx_col1_invert(0,false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col1_invert(0,true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button><button onclick="calcform_cmx_col2_use_col1(0)"><img class="icon" src="icons/down-long-solid-full.svg"/>C2 use C1</button>`;

	// Buttons below Color 2
	element = document.getElementById('form-cmx0-a2-row')
	children = element.children;
	onlyChild = children.length === 1 ? children[0] : null;
	onlyChild.innerHTML = '<button onclick="calcform_cmx_col2_invert(0,false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col2_invert(0,true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button>';

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
		calcform_cmx_dyna(0, color, undefined)
	});
	document.getElementById('text_color').addEventListener("change", (event) => {
		let textColor = document.getElementById('text_color').value
		document.querySelector('input[name="textContrast"][value="color"]').checked = true;
		calcform_cmx_dyna(0, textColor, undefined)
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
		calcform_cmx_dyna(0, undefined, color)
	});
	document.getElementById('back_color').addEventListener("change", (event) => {
		let textColor = document.getElementById('back_color').value
		document.querySelector('input[name="textContrast"][value="text_color"]').checked = true;
		calcform_cmx_dyna(0, undefined, textColor)
	})
});