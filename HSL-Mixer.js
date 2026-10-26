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
var hslPreArr1 = [200, 50, 50];
var hslPreArr2 = [200, 50, 90];
var params_cmx_arr = undefined;
var inp_cmx_arr = undefined;
var c = undefined;
var rgb1 = [];
var rgb2 = [];
var rgb1h = '#8fbfef';
var rgb2h = '#bf8fef';
var hsl1 = [];
var hsl2 = [];
var rowCnt = undefined;
var cha = undefined;
var hslMixEn = undefined;
var _textColor = '#000000';
var _backColor = undefined;

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
function calcform_cmx_hsl_range(nr, h, s, l) {
	document.getElementById(combineToId([inp_cmx_arr.el, 'h' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl longer hue, hsl(0, ${s}%, ${l}%), hsl(0, ${s}%, ${l}%))`;
	document.getElementById(combineToId([inp_cmx_arr.el, 's' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`;
	// use 1% to 99% to help for replacing hsl to rgb black to white
	document.getElementById(combineToId([inp_cmx_arr.el, 'l' + nr, 'range'])).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, ${s}%, 1%), hsl(${h}, ${s}%, 99%))`;
}
function calcform_cmx_rgb1(init) {
	c = inp_cmx_arr.get('c1');
	rgb1 = hexToRgb(c);
	hsl1 = rgbToHsl(rgb1);
	const hsl_0 = Math.round(hsl1[0] * 360)
	const hsl_1 = Math.round(hsl1[1] * 100)
	const hsl_2 = Math.round(hsl1[2] * 100)
	calcform_cmx_hsl_range(1, hsl_0, hsl_1, hsl_2)
	inp_cmx_arr.set('h1', hsl1[0] * 360);
	inp_cmx_arr.set('s1', hsl1[1] * 100);
	inp_cmx_arr.set('l1', hsl1[2] * 100);
	var rgb_per = hslToRgb(hsl1[0], hsl1[1], hsl1[2]);
	rgb1h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c1', rgb1h);
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne RGB von HSL */
function calcform_cmx_rgb2(init) {
	c = inp_cmx_arr.get('c2');
	rgb2 = hexToRgb(c);
	hsl2 = rgbToHsl(rgb2);
	const hsl_0 = Math.round(hsl2[0] * 360)
	const hsl_1 = Math.round(hsl2[1] * 100)
	const hsl_2 = Math.round(hsl2[2] * 100)
	calcform_cmx_hsl_range( 2, hsl_0, hsl_1, hsl_2)
	inp_cmx_arr.set('h2', hsl2[0] * 360);
	inp_cmx_arr.set('s2', hsl2[1] * 100);
	inp_cmx_arr.set('l2', hsl2[2] * 100);
	var rgb_per = hslToRgb(hsl2[0], hsl2[1], hsl2[2]);
	rgb2h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c2', rgb2h);
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne RGB von HSL */
function calcform_cmx_hsl1(init) {
	hsl1[0] = inp_cmx_arr.get('h1') / 360;
	hsl1[1] = inp_cmx_arr.get('s1') / 100;
	hsl1[2] = inp_cmx_arr.get('l1') / 100;
	const hsl_0 = Math.round(hsl1[0] * 360)
	const hsl_1 = Math.round(hsl1[1] * 100)
	const hsl_2 = Math.round(hsl1[2] * 100)
	calcform_cmx_hsl_range(1, hsl_0, hsl_1, hsl_2)
	var rgb_per = hslToRgb(hsl1[0], hsl1[1], hsl1[2]);
	rgb1h = rgbToColor(rgb_per);
	inp_cmx_arr.set('c1', rgb1h);
	if (init == undefined) calcform_cmx_dyna();
}
function calcform_cmx_hsl2(init) {
	hsl2[0] = inp_cmx_arr.get('h2') / 360;
	hsl2[1] = inp_cmx_arr.get('s2') / 100;
	hsl2[2] = inp_cmx_arr.get('l2') / 100;
	const hsl_0 = Math.round(hsl2[0] * 360)
	const hsl_1 = Math.round(hsl2[1] * 100)
	const hsl_2 = Math.round(hsl2[2] * 100)
	calcform_cmx_hsl_range(2, hsl_0, hsl_1, hsl_2)
	var rgb_per = hslToRgb(hsl2[0], hsl2[1], hsl2[2]);
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
	hslMixEn = inp_cmx_arr.get('hsl');
	var colArr = [];

	// vergleiche rgb1 und rgb2 um in beide Richtungen zu blenden
	if (hslMixEn) {
		colArr = getHSLColors({ len: rowCnt, hsl1: hsl1, hsl2: hsl2, overdrive: cha });

		// this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
		colArr[cha] = inp_cmx_arr.get('c1');
		colArr[cha + rowCnt - 1] = inp_cmx_arr.get('c2');
	} else {
		c = inp_cmx_arr.get('c1');
		rgb1 = hexToRgb(c);
		c = inp_cmx_arr.get('c2');
		rgb2 = hexToRgb(c);
		colArr = getRGBColors({ len: rowCnt, c1: rgb1h, c2: rgb2h, overdrive: cha  });
	}
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
	if (hslMixEn) {
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
	inp_cmx_arr.set('hsl', hslMixEn);
	calcform_cmx_dyna();
}
function calcform_cmx_onSave() {
	var data = { rgb1h: rgb1h, rgb2h: rgb2h, rowCnt: rowCnt, cha: cha, textColor:_textColor, backColor:_backColor, hslEn:hslMixEn};
	storage.saveSetting({ data: data });
}
function calcform_cmx_col2_use_col1() {
	inp_cmx_arr.set('c2', rgb1h);
	calcform_cmx_rgb2();
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
	onlyChild.innerHTML = `<button onclick="calcform_cmx_col1_invert(false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col1_invert(true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button><button onclick="calcform_cmx_col2_use_col1()"><img class="icon" src="icons/down-long-solid-full.svg"/>C2 use C1</button>`;

	// Buttons below Color 2
	element = document.getElementById('form-cmx-a2-row')
	children = element.children;
	onlyChild = children.length === 1 ? children[0] : null;
	onlyChild.innerHTML = '<button onclick="calcform_cmx_col2_invert(false)"><img class="icon" src="icons/lightbulb-solid-full.svg"/>RGB-Invert</button><button onclick="calcform_cmx_col2_invert(true)"><img class="icon" src="icons/lightbulb-regular-full.svg"/>HSL-Invert</button>';

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