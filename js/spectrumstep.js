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
/** Channel descriptions per color space; the value range part of every tooltip
 *  is generated from the active value format (see cmpModesForMode / channelTooltips) */
const hueEnds = 'Red at 0, Green at 1/3, Blue at 2/3 and Red again at the full turn';
const channelInfoForMode = {
	HSL: [
		{ name: 'Hue (H)', desc: 'angular position on the color wheel', ends: hueEnds },
		{ name: 'Saturation (S)', desc: 'chromatic purity in HSL space', ends: 'achromatic gray to pure chroma' },
		{ name: 'Lightness (L)', desc: 'relative lightness', ends: 'black through the pure hue at the middle to white' }
	],
	RGB: [
		{ name: 'Red (R)', desc: 'additive sRGB red primary channel', ends: 'no red to full red' },
		{ name: 'Green (G)', desc: 'additive sRGB green primary channel', ends: 'no green to full green' },
		{ name: 'Blue (B)', desc: 'additive sRGB blue primary channel', ends: 'no blue to full blue' }
	],
	HSV: [
		{ name: 'Hue (H)', desc: 'angular position on the color wheel', ends: hueEnds },
		{ name: 'Saturation (S)', desc: 'tint purity in HSV space', ends: 'white/gray to pure hue' },
		{ name: 'Value (V)', desc: 'illumination brightness', ends: 'black to full brightness' }
	],
	Oklab: [
		{ name: 'Perceptual Lightness (l)', desc: 'OKLab perceived lightness', ends: 'black to white' },
		{ name: 'Green–Red opponent axis (a)', desc: 'OKLab Cartesian a-coordinate', ends: 'green through neutral 0 to magenta/red' },
		{ name: 'Blue–Yellow opponent axis (b)', desc: 'OKLab Cartesian b-coordinate', ends: 'blue through neutral 0 to yellow' }
	],
	Oklch: [
		{ name: 'Perceptual Lightness (l)', desc: 'OKLCH perceived lightness', ends: 'black to white' },
		{ name: 'Chroma (c)', desc: 'OKLCH perceptual colorfulness, gamut-mapped to sRGB via chroma reduction', ends: 'neutral gray to vivid' },
		{ name: 'Hue (h)', desc: 'OKLCH perceptual hue angle', ends: 'one full turn of the perceptual hue circle' }
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
const defaultBackgroundColor = '#9c2bee';
var hslPreArr = [[200, 60, 70],[140, 90, 70]];
var hsl = [[],[]];
let steps = undefined;
/** Last tick of the Steps slider: displayed as ∞ and switches to the continuous CSS gradient view */
const STEPS_INFINITE = 17;
const STEPS_MAX_DISCRETE = 16;
let overdrive = undefined;
var _textColor = undefined;
var _backColor = undefined;
let gradientSlider = undefined;
let currentRelRange = { relStart: 0, relEnd: 1 };
var currentSwatches = [];
/** knob positions (0..1, displayed order) dragged by the user; null = default even spacing.
 *  Valid only for the gradient they were made on (customSig), any other gradient change drops them */
var customPos = null;
var customSig = null;
var pendingSwatchPos = null;   // positions from a loaded state, adopted by the next calcform_cmx_dyna()
var lastGradSig = null;
/** what the continuous gradient shows: css text, axis and the interpolation range of its ends */
var currentGradient = null;
var stateSyncTimer = null;
/** Value formats ("color-component-input-mode") per color space.
 *  The engine keeps every color in hsl[ix] in its internal scale (HSL/HSV 0..1,
 *  RGB 0..255, Oklab/Oklch l 0..1, a/b/c raw, h 0..1); a value format only defines
 *  how the 3 components are displayed and entered:  display = internal * factor.
 *  Cycling the format never touches hsl[ix], so no accuracy is lost.
 *    min/max  slider and input bounds        step   slider step
 *    round    displayed decimals (negative)  hex    2-digit hexadecimal byte
 *  Max. 4 formats per color space (2 bits each in the URL param "im"). */
const cmpFormatsCyl = [
	{ label: '360° / 100% / 100%', max: [360,100,100], step: ['0.1','0.1','0.1'], round: [-1,-1,-1], factor: [360,100,100], unit: ['°','%','%'] },
	{ label: '360° / 0–1 / 0–1', max: [360,1,1], step: ['0.1','0.001','0.001'], round: [-1,-3,-3], factor: [360,1,1], unit: ['°','',''] },
	{ label: '0–1 / 0–1 / 0–1', max: [1,1,1], step: ['0.0001','0.001','0.001'], round: [-4,-3,-3], factor: [1,1,1], unit: ['','',''] }
];
const cmpModesForMode = {
	HSL: cmpFormatsCyl,
	RGB: [
		{ label: '0–255', max: [255,255,255], step: ['1','1','1'], round: [0,0,0], factor: [1,1,1], unit: ['','',''], urlRound: [-2,-2,-2] },
		{ label: '00–ff hex', max: [255,255,255], step: ['1','1','1'], round: [0,0,0], factor: [1,1,1], unit: ['hex','hex','hex'], urlRound: [-2,-2,-2], hex: true },
		{ label: '0–1', max: [1,1,1], step: ['0.001','0.001','0.001'], round: [-3,-3,-3], factor: [1/255,1/255,1/255], unit: ['','',''] }
	],
	HSV: cmpFormatsCyl,
	Oklab: [
		{ label: 'l 0–100%', min: [0,-0.4,-0.4], max: [100,0.4,0.4], step: ['0.1','0.001','0.001'], round: [-1,-3,-3], factor: [100,1,1], unit: ['%','',''] },
		{ label: 'l 0–1', min: [0,-0.4,-0.4], max: [1,0.4,0.4], step: ['0.001','0.001','0.001'], round: [-3,-3,-3], factor: [1,1,1], unit: ['','',''] }
	],
	Oklch: [
		{ label: 'l 0–100%', max: [100,0.4,360], step: ['0.1','0.001','0.1'], round: [-1,-3,-1], factor: [100,1,360], unit: ['%','','°'] },
		{ label: 'l 0–1', max: [1,0.4,360], step: ['0.001','0.001','0.1'], round: [-3,-3,-1], factor: [1,1,360], unit: ['','','°'] }
	]
};
Object.values(cmpModesForMode).forEach(list => list.forEach(def => {
	def.min = def.min || [0,0,0];
	def.urlRound = def.urlRound || def.round;
	// always show all decimals (trailing zeros) to keep the UI steady
	def.pad = def.round.map(r => r < 0);
}));
/** first value format = canonical units, used for the slider track gradients */
const factorForMode = {};
Object.keys(cmpModesForMode).forEach(mode => { factorForMode[mode] = cmpModesForMode[mode][0].factor; });
const cmpModeDefault = () => ({ HSL: 0, RGB: 0, HSV: 0, Oklab: 0, Oklch: 0 });
/** selected value format index per color and per color space; kept when the color space is cycled */
var inputMode = [cmpModeDefault(), cmpModeDefault()];
var cmpRingTurn = [0, 0];
/** active value format of color ix (or of another color space of that color) */
function cmpDef(ix, mode) {
	mode = mode || colMode[ix];
	const list = cmpModesForMode[mode] || cmpModesForMode.HSL;
	return list[inputMode[ix][mode]] || list[0];
}
/** text of a component value exactly as the input displays it */
function cmpText(def, i, value) {
	if (def.hex) return ('0' + Math.round(bound(value, 0, 255)).toString(16)).slice(-2);
	return def.pad[i] ? Number(value).toFixed(-def.round[i]) : getTextOfRound(value, def.round[i]);
}
/** what the engine does with a value entered in this format */
function cmpEngineText(mode, def, i) {
	if (mode === 'RGB') {
		if (def.hex) return 'Two-digit hexadecimal byte, read by the engine as 8-bit sRGB value (ff = 255). Upper- and lowercase are accepted, a single digit gets a leading zero (8 means 08). The display rounds to the nearest byte, the exact value is kept internally';
		if (def.factor[i] === 1) return 'Used by the engine directly as 8-bit sRGB value. The display rounds to an integer, the exact value is kept internally';
		return 'Normalised float as in GLSL, Three.js, Unity, Blender or Godot. The engine multiplies it by 255; the HEX color rounds to the nearest of the 256 levels, the entered value is kept internally';
	}
	if (def.factor[i] !== 1) return 'The engine divides it by ' + def.factor[i] + ' to its internal 0–1 value';
	if (factorForMode[mode][i] === 1) return 'Raw ' + mode + ' coordinate, passed to the engine unchanged';
	return 'Normalised float, passed to the engine unchanged (no scaling)';
}
/** tooltips (name / range / input) of the 3 components of color ix for its active value format */
function channelTooltips(ix) {
	const mode = colMode[ix];
	const def = cmpDef(ix, mode);
	const list = cmpModesForMode[mode];
	const next = list[(list.indexOf(def) + 1) % list.length];
	return channelInfoForMode[mode].map((info, i) => {
		const unit = def.hex ? '' : def.unit[i];
		const span = cmpText(def, i, def.min[i]) + '–' + cmpText(def, i, def.max[i]) + unit;
		const res = def.hex ? '1 byte' : def.step[i] + unit;
		const engine = cmpEngineText(mode, def, i);
		return {
			name: info.name + ': ' + info.desc + ' (' + span + ')',
			range: info.name + ' slider, ' + span + ' in steps of ' + res + ' (' + info.ends + '). ' + engine,
			input: info.name + ' ' + (def.hex ? 'as hex byte' : 'value') + ', ' + span + ' with ' + res + ' resolution (arrow keys' + (def.hex ? '' : ' and spin buttons') + ' step by ' + res + '). ' + engine
				+ '. Value format ' + (list.indexOf(def) + 1) + ' of ' + list.length + ' (' + def.label + '): click the border of this field to switch to "' + next.label + '"; the color itself does not change'
		};
	});
}
/** all value formats as one compact base-36 number: 2 bits per color space, Color 1 first */
function cmpModesEncode(im) {
	let n = 0;
	[0, 1].forEach(ix => colModes.forEach((mode, k) => { n += ((im[ix] && im[ix][mode]) || 0) * Math.pow(4, ix * colModes.length + k); }));
	return n.toString(36);
}
function cmpModesDecode(str) {
	const n = /^[0-9a-z]{1,4}$/i.test(str || '') ? parseInt(str, 36) : 0;
	return [0, 1].map(ix => {
		const o = {};
		colModes.forEach((mode, k) => {
			const d = Math.floor(n / Math.pow(4, ix * colModes.length + k)) % 4;
			o[mode] = d < cmpModesForMode[mode].length ? d : 0;
		});
		return o;
	});
}
/** take over value formats from a state object, ignoring anything invalid */
function cmpModesApply(im) {
	if (!Array.isArray(im)) return;
	[0, 1].forEach(ix => colModes.forEach(mode => {
		const v = im[ix] ? Number(im[ix][mode]) : NaN;
		if (Number.isInteger(v) && v >= 0 && v < cmpModesForMode[mode].length) inputMode[ix][mode] = v;
	}));
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
var backgroundMode = 'white';
var customBackground = defaultBackgroundColor;
var customBackgroundSource = 'picker';
var backgroundDraft = null;
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
	const choices = ['theme-black','theme-white','theme-custom'].map(id => document.getElementById(id));
	if (!choices.every(Boolean)) return;
	choices.forEach((button, index) => button.addEventListener('click', () => {
		if (index === 2) { openBackgroundModal(); return; }
		backgroundMode = index === 0 ? 'black' : 'white';
		applyBackground(backgroundMode === 'black' ? '#000000' : '#ffffff');
		renderBackgroundChoice();
		calcform_cmx_syncState();
	}));
	document.getElementById('background-modal-close')?.addEventListener('click', closeBackgroundModal);
	document.getElementById('background-apply')?.addEventListener('click', commitBackgroundModal);
	document.getElementById('background-modal')?.addEventListener('click', e => { if (e.target.id === 'background-modal') commitBackgroundModal(); });
	const picker = document.getElementById('background-color-picker');
	const hex = document.getElementById('background-color-hex');
	const updateDraft = () => {
		const value = hex.value.trim();
		if (!/^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return;
		customBackground = rgbCorrect(value).toLowerCase();
		hex.value = customBackground;
		if (/^#[0-9a-f]{6}$/i.test(value)) picker.value = value;
		backgroundMode = 'custom'; applyBackground(value); renderBackgroundChoice();
	};
	picker?.addEventListener('input', () => { customBackgroundSource = 'picker'; hex.value = picker.value; document.getElementById('background-picker-value').textContent = picker.value; updateDraft(); });
	hex?.addEventListener('input', () => { customBackgroundSource = 'picker'; document.getElementById('background-picker-value').textContent = hex.value; updateDraft(); });
	document.querySelectorAll('[data-background-source]').forEach(button => button.addEventListener('click', () => {
		const ix = button.dataset.backgroundSource === 'color1' ? 0 : 1;
		customBackgroundSource = button.dataset.backgroundSource;
		hex.value = customBackground = rgbh[ix]; picker.value = customBackground; document.getElementById('background-picker-value').textContent = customBackground; updateDraft();
	}));
	renderBackgroundChoice();
}
function getThemeForColor(color) {
	const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = color;
	const normalized = ctx.fillStyle;
	let rgb;
	if (normalized.startsWith('#')) { const hex = normalized.slice(1); rgb = hex.length === 3 ? hex.split('').map(v => parseInt(v+v,16)) : [0,2,4].map(i => parseInt(hex.slice(i,i+2),16)); }
	else rgb = normalized.match(/[\d.]+/g)?.slice(0,3).map(Number) || [255,255,255];
	const luminance = rgb.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i],0);
	// Below ~.36 white ink reads better on the page colour, above it black ink (the UI is drawn in ink at an alpha)
	return luminance > .36 ? 'light' : 'dark';
}
function applyBackground(color) {
	const uiTheme = getThemeForColor(color);
	document.documentElement.style.setProperty('--background-body', color);
	document.documentElement.dataset.theme = uiTheme;
	localStorage.setItem('theme', uiTheme);
}
function renderBackgroundChoice() {
	[['theme-black','black'],['theme-white','white'],['theme-custom','custom']].forEach(([id, mode]) => {
		const button = document.getElementById(id);
		if (!button) return;
		button.classList.toggle('selected', backgroundMode === mode);
		const color = mode === 'black' ? '#000000' : mode === 'white' ? '#ffffff' : customBackground;
		button.style.backgroundColor = color;
		button.dataset.choiceTheme = getThemeForColor(color);
	});
	renderBackgroundSourceSelection();
	[0,1].forEach(ix => {
		const color = rgbh[ix] || '#888888';
		const chip = document.getElementById(`background-color${ix+1}-chip`);
		const value = document.getElementById(`background-color${ix+1}-value`);
		if (chip) chip.style.backgroundColor = color;
		if (value) value.textContent = color;
		const pickerChip = document.getElementById('background-picker-chip');
		if (ix === 0 && pickerChip && backgroundMode === 'custom') pickerChip.style.backgroundColor = customBackground;
	});
}
function renderBackgroundSourceSelection() {
	const selectedId = customBackgroundSource === 'color1' ? 'color1' : customBackgroundSource === 'color2' ? 'color2' : 'picker';
	document.getElementById('background-picker-option')?.classList.toggle('selected', selectedId === 'picker');
	document.querySelectorAll('[data-background-source]').forEach(button => button.classList.toggle('selected', button.dataset.backgroundSource === selectedId));
}
function openBackgroundModal() {
	backgroundDraft = { mode: backgroundMode, color: customBackground, source: customBackgroundSource, bg: document.documentElement.style.getPropertyValue('--background-body') };
	backgroundMode = 'custom';
	applyBackground(customBackground);
	const picker = document.getElementById('background-color-picker');
	const hex = document.getElementById('background-color-hex');
	hex.value = customBackground;
	document.getElementById('background-picker-value').textContent = customBackground;
	if (/^#[0-9a-f]{6}$/i.test(customBackground)) picker.value = customBackground;
	else { const ctx = document.createElement('canvas').getContext('2d'); ctx.fillStyle = customBackground; const v = ctx.fillStyle; if (v.startsWith('#')) picker.value = v; }
	renderBackgroundChoice();
	renderBackgroundSourceSelection();
	document.getElementById('background-modal')?.classList.add('open');
}
function closeBackgroundModal() {
	if (backgroundDraft) {
		backgroundMode = backgroundDraft.mode; customBackground = backgroundDraft.color; customBackgroundSource = backgroundDraft.source;
		applyBackground(backgroundDraft.bg || (backgroundMode === 'black' ? '#000' : '#fff'));
		backgroundDraft = null;
		renderBackgroundChoice(); calcform_cmx_syncState();
	}
	document.getElementById('background-modal')?.classList.remove('open');
}
function commitBackgroundModal() {
	backgroundMode = 'custom'; backgroundDraft = null;
	document.getElementById('background-modal')?.classList.remove('open');
	renderBackgroundChoice(); calcform_cmx_syncState();
}

/* ───────────────────────── docking: image popup and gradient options popup ─────────────────────────
 * While one of them is open, the header is fixed at the top and the gradient (#grd-layout) is fixed at the
 * bottom (right / left) or at the right edge (down / up), so the result stays visible. Placeholders keep
 * the page from jumping, the page scroll is locked. The popup area is the viewport minus --dock-top,
 * --dock-bottom and --dock-right. */
var imagePicker = null;
var dockOwner = null;           // 'image' | 'options' | null
var dockScrollY = 0;
var dockObserver = null;
var dockPlaceholders = [];
const dockClosers = {
	image: () => { if (imagePicker) imagePicker.hide(); },
	options: () => closeOptionsModal()
};
function dockMeasure() {
	const root = document.documentElement;
	const header = document.querySelector('.site-header');
	const layout = document.getElementById('grd-layout');
	const vertical = !!(layout && layout.classList.contains('is-vertical'));
	const hh = dockOwner && header ? header.getBoundingClientRect().height : 0;
	root.style.setProperty('--dock-top', hh + 'px');
	root.style.setProperty('--dock-bottom', (dockOwner && layout && !vertical ? layout.offsetHeight : 0) + 'px');
	root.style.setProperty('--dock-right', (dockOwner && layout && vertical ? layout.offsetWidth : 0) + 'px');
	if (dockPlaceholders[0]) dockPlaceholders[0].style.height = hh + 'px';
}
function dockApply() {
	const root = document.documentElement;
	const header = document.querySelector('.site-header');
	const layout = document.getElementById('grd-layout');
	if (!header || !layout) return;
	dockScrollY = window.scrollY;
	const ph = (el, h) => {
		const d = document.createElement('div');
		d.className = 'dock-placeholder';
		d.style.height = h + 'px';
		el.parentNode.insertBefore(d, el);
		return d;
	};
	dockPlaceholders = [ph(header, header.getBoundingClientRect().height), ph(layout, layout.offsetHeight)];
	root.classList.add('is-docked');
	layout.inert = true;   // display only: no swatch popup, no knob dragging
	if (typeof ResizeObserver === 'function') {
		dockObserver = new ResizeObserver(() => { dockMeasure(); });
		dockObserver.observe(header);
		dockObserver.observe(layout);
	}
	window.scrollTo(0, dockScrollY);
}
function dockRelease() {
	const root = document.documentElement;
	const layout = document.getElementById('grd-layout');
	if (dockObserver) { dockObserver.disconnect(); dockObserver = null; }
	root.classList.remove('is-docked', 'dock-gutter');
	if (layout) layout.inert = false;
	dockPlaceholders.forEach(d => d.remove());
	dockPlaceholders = [];
	['--dock-top', '--dock-bottom', '--dock-right'].forEach(n => root.style.setProperty(n, '0px'));
	window.scrollTo(0, dockScrollY);
}
/** the main gradient controls (Gradient, Steps, Overdrive) move into the image popup header while it is open;
 *  comment nodes mark their places so they return to the exact spot */
var dockAdopted = [];
function dockAdoptControls(on) {
	if (on === dockAdopted.length > 0) return;
	if (on) {
		const slot = document.getElementById('img-grad');
		const els = [
			document.getElementById('gradientMode'),
			document.getElementById('steps') && document.getElementById('steps').closest('fieldset'),
			document.getElementById('overdrive') && document.getElementById('overdrive').closest('fieldset')
		].filter(Boolean);
		if (!slot) return;
		els.forEach(el => {
			const mark = document.createComment('dock');
			el.parentNode.insertBefore(mark, el);
			dockAdopted.push({ el, mark });
			slot.appendChild(el);
		});
	} else {
		dockAdopted.forEach(({ el, mark }) => { mark.parentNode.insertBefore(el, mark); mark.remove(); });
		dockAdopted = [];
	}
}
/** a popup opens: it closes the other one (which keeps its state) and docks the page */
var dockOptionsOnImage = false;   // the options popup lies over the image popup, which stays open
function dockEnter(owner) {
	const prev = dockOwner;
	if (owner === 'options' && prev === 'image') {
		dockOptionsOnImage = true;   // layered: the image popup (and its adopted controls) stay as they are
		return;
	}
	dockOwner = owner;
	if (prev && prev !== owner && dockClosers[prev]) dockClosers[prev]();
	if (!prev) dockApply();
	dockAdoptControls(owner === 'image');
	dockMeasure();
	alignGradientSlider();
}
function dockLeave(owner) {
	if (owner === 'options' && dockOptionsOnImage) { dockOptionsOnImage = false; return; }
	if (dockOwner !== owner) return;   // another popup has taken over the dock
	dockOwner = null;
	dockAdoptControls(false);
	dockRelease();
	alignGradientSlider();
}
function dockCloseAll() {
	if (dockOptionsOnImage) closeOptionsModal();
	const owner = dockOwner;
	if (owner && dockClosers[owner]) dockClosers[owner]();
}
/** while a popup is open, the App and logo links only close it instead of resetting the app */
function initDock() {
	document.querySelectorAll('.header-logo, .header-nav a[aria-current="page"]').forEach(a => {
		a.addEventListener('click', e => {
			if (!dockOwner) return;
			e.preventDefault();
			dockCloseAll();
		});
	});
	// a click anywhere on the (docked) header outside its controls closes the popup
	document.querySelector('.site-header')?.addEventListener('click', e => {
		if (dockOwner && !e.target.closest('a, button, input, label, select')) dockCloseAll();
	});
	const root = document.documentElement;
	['--dock-top', '--dock-bottom', '--dock-right'].forEach(n => root.style.setProperty(n, '0px'));
}

/** the color a picker target currently has (lowercase #rrggbb) */
function calcform_cmx_current(target) {
	const low = c => rgbCorrect(c).toLowerCase();
	switch (target) {
		case 'c1': return low(rgbh[0]);
		case 'c2': return low(rgbh[1]);
		case 'text': return low(_textColor || document.getElementById('textContrast-color').value);
		case 'back': return low(_backColor || document.getElementById('backContrast-color').value);
		case 'page': return low(backgroundMode === 'black' ? '#000000' : backgroundMode === 'custom' ? customBackground : '#ffffff');
	}
	return null;
}
/** apply a picked color to a target: 'c1' | 'c2' | 'text' | 'back' | 'page' */
function calcform_cmx_pick(target, hex) {
	hex = rgbCorrect(hex).toLowerCase();
	if (target === 'c1' || target === 'c2') {
		const ix = target === 'c1' ? 0 : 1;
		inp_cmx_arr[ix].set('c', hex);
		calcform_cmx_rgb(ix);
	} else if (target === 'text') {
		const input = document.getElementById('textContrast-color');
		const label = document.getElementById('textContrast-label');
		const preview = document.getElementById('textContrast-color-preview');
		input.value = hex;
		textColorSelect._applyColorAccent(label, hex);
		if (preview) preview.style.color = hex;
		textColorSelect.setValue('textContrast-label');   // also deselects the Background contrast mode
	} else if (target === 'back') {
		const input = document.getElementById('backContrast-color');
		const label = document.getElementById('backContrast-label');
		input.value = hex;
		backColorSelect._applyColorAccent(label, hex);
		label.style.backgroundColor = hex;
		backColorSelect.setValue('backContrast-label');
	} else if (target === 'page') {
		backgroundMode = 'custom';
		customBackground = hex;
		customBackgroundSource = 'picker';
		applyBackground(hex);
		renderBackgroundChoice();
		calcform_cmx_syncState();
		if (imagePicker) imagePicker.refreshMarkers();
	}
}

/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
	initThemeSwitch();

	storage.loadInit({ inputId:'load-input', btnId:'load-btn',callback: calcform_cmx_onLoad });
	storage.saveInit({ inputId:'save-input', btnId:'save-btn',callback: calcform_cmx_onSave });
		initExportAndLoadModals();
	initSwatchModals();

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
	inp_cmx_ids.forEach((id,ix) => calcform_cmx_cmpInit(ix));
	if (typeof initColorPlaneButtons === 'function') {
		initColorPlaneButtons();
	}
	steps = new RangeSetting('steps',calcform_cmx_dyna, 'Discrete interpolation steps (2–16): number of equidistant color stops generated between Color 1 and Color 2. Last tick (∞) switches to the continuous CSS linear-gradient', (v) => v >= STEPS_INFINITE ? '∞' : v);
	overdrive = new RangeSetting('overdrive',calcform_cmx_dyna, 'Overdrive extrapolation (0–16): linearly extrapolate additional color stops beyond Color 1 and Color 2 on both ends');
	gradientSwitch = new ButtonSwitch(
		document.getElementById('gradient-select'),
		colModes, undefined, undefined, () => calcform_cmx_dyna(), {
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
		['show','hide','none'], ['assets/icons/eye-solid-full.svg','assets/icons/eye-slash-solid-full.svg','assets/icons/xmark-solid-full.svg'],undefined, () => calcform_cmx_dyna(), {
			showText: false,
			tooltips: {
				show: 'Showing HEX values and contrast info. Click to hide contrast info',
				hide: 'Showing HEX values only. Click to hide all text',
				none: 'All text hidden. Click to show HEX values and contrast info'
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
			'backContrast-black': 'Back Contrast Mode: Apply the gradient to text color over a static Black (#000000) back',
			'backContrast-white': 'Back Contrast Mode: Apply the gradient to text color over a static White (#ffffff) back',
			'backContrast-label': 'Back Contrast Mode: Pick a custom static back color behind gradient-colored text'
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
		onRelease: () => { handleGradientSliderSelect({ index: -1 }); calcform_cmx_syncState(); },   // highlight only while dragging
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

	calcform_cmx_cmpApply(ix);
	// manipulate row heads
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
	})
	if (!init) calcform_cmx_rgb(ix);
	if (typeof updateColorPlaneButtons === 'function') updateColorPlaneButtons(ix);
}
/** apply the active value format of color ix to its 3 sliders and inputs (bounds, step, decimals, tooltips, ring) */
function calcform_cmx_cmpApply(ix) {
	const mode = colMode[ix];
	const def = cmpDef(ix, mode);
	const inp = inp_cmx_arr[ix];
	const tips = channelTooltips(ix);
	const n = cmpModesForMode[mode].length;
	// ring position always matches the format index, turning forwards when cycled
	if (((cmpRingTurn[ix] % n) + n) % n !== inputMode[ix][mode]) cmpRingTurn[ix] = inputMode[ix][mode];
	hslKeys.forEach((key, i) => {
		const rangeEl = document.getElementById(inp.getId(key, 'range'));
		const inputEl = document.getElementById(combineToId([inp.el, key]));
		const row = document.getElementById(inp.getId(key, 'row'));
		if (rangeEl) {
			rangeEl.min = def.min[i];
			rangeEl.max = def.max[i];
			rangeEl.step = def.step[i];
		}
		Object.assign(inp.params[key], {
			min: def.min[i], max: def.max[i], rangeStep: def.step[i], round: def.round[i],
			hex: !!def.hex, pad: def.pad[i], unit: def.unit[i]
		});
		if (inputEl) {
			const type = def.hex ? 'text' : 'number';
			if (inputEl.type !== type) inputEl.type = type;
			inp.clearInvalid(inputEl);
			if (def.hex) {
				['min', 'max', 'step'].forEach(attr => inputEl.removeAttribute(attr));
				inputEl.setAttribute('autocomplete', 'off');
				inputEl.setAttribute('spellcheck', 'false');
			} else {
				// spin buttons / arrow keys step on the last displayed decimal and stop at the bounds
				inputEl.min = def.min[i];
				inputEl.max = def.max[i];
				inputEl.step = def.step[i];
			}
			const ring = inputEl.closest('.cmp-ring');
			if (ring) {
				const span = 360 / n;
				ring.style.setProperty('--ring-span', span + 'deg');
				ring.style.setProperty('--ring-start', (cmpRingTurn[ix] * span - span / 2) + 'deg');
			}
		}
		if (row && row.cells[3]) row.cells[3].textContent = def.unit[i];
		inp.setTooltip(key, tips[i]);
		if (inputEl) updateActiveTooltip(inputEl);
	});
}
/** show the engine values hsl[ix] in the 3 sliders and inputs using the active value format */
function calcform_cmx_show(ix) {
	const mode = colMode[ix];
	const def = cmpDef(ix, mode);
	const canon = cmpModesForMode[mode][0];
	const c = hsl[ix].map((v, i) => round(v * canon.factor[i], canon.round[i]));
	calcform_cmx_range(ix, mode, c[0], c[1], c[2]);
	hslKeys.forEach((key, i) => inp_cmx_arr[ix].set(key, hsl[ix][i] * def.factor[i]));
}
/** next value format for color ix (click on the border of a component input) */
function calcform_cmx_cmpCycle(ix) {
	const mode = colMode[ix];
	inputMode[ix][mode] = (inputMode[ix][mode] + 1) % cmpModesForMode[mode].length;
	cmpRingTurn[ix]++;
	calcform_cmx_cmpApply(ix);
	calcform_cmx_show(ix);
	if (typeof updateColorPlaneButtons === 'function') updateColorPlaneButtons(ix);
	calcform_cmx_syncState();
}
/** wrap the 3 component inputs into the ring frame and cycle the value format on a click on their border */
function calcform_cmx_cmpInit(ix) {
	hslKeys.forEach(key => {
		const el = document.getElementById(combineToId([inp_cmx_arr[ix].el, key]));
		if (!el) return;
		const ring = document.createElement('span');
		ring.className = 'cmp-ring';
		el.parentNode.insertBefore(ring, el);
		ring.appendChild(el);
		const onBorder = e => {
			const r = el.getBoundingClientRect();
			const bw = (parseFloat(getComputedStyle(el).borderTopWidth) || 0) + 1;
			return e.clientX < r.left + bw || e.clientX > r.right - bw || e.clientY < r.top + bw || e.clientY > r.bottom - bw;
		};
		// a click on the border neither focuses the field nor moves the caret
		el.addEventListener('mousedown', e => { if (onBorder(e)) e.preventDefault(); });
		el.addEventListener('click', e => {
			if (!onBorder(e)) return;   // inside: normal caret placement / text selection
			e.preventDefault();
			calcform_cmx_cmpCycle(ix);
		});
		el.addEventListener('mousemove', e => { el.style.cursor = onBorder(e) ? 'pointer' : ''; });
	});
}
/** calculate HSL from RGB input */
function calcform_cmx_rgb(ix,init) {
	rgbh[ix] = inp_cmx_arr[ix].get('c');
	rgb[ix] = hexToRgb(rgbh[ix]);
	const hueIdx = colMode[ix] === 'Oklch' ? 2 : 0;
	const oldHue = (hsl[ix] && hsl[ix][hueIdx] !== undefined) ? hsl[ix][hueIdx] : undefined;
	hsl[ix] = colorConvertFromRgb(colMode[ix], rgb[ix], oldHue).slice();
	calcform_cmx_show(ix);
	if (typeof refreshActiveColorPlane === 'function') refreshActiveColorPlane(ix);
	if (init == undefined) calcform_cmx_dyna();
}
/** calculate RGB from HSL input
 *  only: component indices to read from the inputs. Default: the component being edited;
 *  the others keep their exact engine value (a displayed value may be rounded, f.e. hex) */
function calcform_cmx_hsl(ix,init,only) {
	const inp = inp_cmx_arr[ix];
	const mode = colMode[ix];
	const def = cmpDef(ix, mode);
	if (!only) {
		const active = hslKeys.indexOf(inp.activeVar);
		only = (active >= 0 && hsl[ix].length === 3) ? [active] : [0, 1, 2];
	}
	only.forEach(i => { hsl[ix][i] = inp.get(hslKeys[i]) / def.factor[i]; });
	const canon = cmpModesForMode[mode][0];
	const c = hsl[ix].map((v, i) => round(v * canon.factor[i], canon.round[i]));
	calcform_cmx_range(ix, mode, c[0], c[1], c[2]);
	const rgb_per = colorConvertToRgb(mode, hsl[ix]);
	rgbh[ix] = rgbToColor(rgb_per);
	inp.set('c', rgbh[ix]);
	if (typeof refreshActiveColorPlane === 'function') refreshActiveColorPlane(ix);
	if (init == undefined) calcform_cmx_dyna();
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(textColor, backColor) {
	const isInfinite = steps.get() >= STEPS_INFINITE;
	const rowCnt = Math.min(steps.get(), STEPS_MAX_DISCRETE);
	const cha = overdrive.get();
	// ∞ toggles between discrete swatches and the continuous CSS gradient box
	const tabEl = document.getElementById('tab-cmx');
	const grdEl = document.getElementById('grd-cmx');
	if (tabEl) tabEl.hidden = isInfinite;
	if (grdEl) grdEl.hidden = !isInfinite;
	const sliderEl = document.getElementById('grd-slider');
	if (sliderEl) sliderEl.classList.toggle('steps-infinite', isInfinite);
	const gradientMode = gradientSwitch.value;
	const gradientDirection = gradientDirectionSwitch.value;
	const gradientWay = gradientWaySwitch.value;
	const showContrast = contrastVisibilitySwitch.value === 'show';
	const hexHiddenAttr = contrastVisibilitySwitch.value === 'none' ? ' hidden' : '';
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

	// knob positions dragged by the user: valid only while the gradient itself is unchanged
	const gradSig = JSON.stringify([hsl[0], hsl[1], colMode, gradientMode, rowCnt, cha, gradientWay, gradientDirection]);
	if (pendingSwatchPos) {
		customPos = pendingSwatchPos;
		customSig = gradSig;
		pendingSwatchPos = null;
	} else if (customSig !== gradSig) {
		customPos = null;
	}
	if (customPos && customPos.length !== colArr.length) customPos = null;
	lastGradSig = gradSig;
	const defPos = idx => colArr.length > 1 ? idx / (colArr.length - 1) : 0;
	const posAt = idx => (customPos && Math.abs(customPos[idx] - defPos(idx)) > 0.0006) ? customPos[idx] : defPos(idx);
	for (let idx = 0; idx < colArr.length; idx++) {
		if (posAt(idx) === defPos(idx)) continue;
		const rel = currentRelRange.relStart + posAt(idx) * (currentRelRange.relEnd - currentRelRange.relStart);
		colArr[idx] = getColorAtRel(rel, gradientMode, hsl[0], colMode[0], hsl[1], colMode[1], gradientWay, rgbh[0], rgbh[1]);
		details[idx] = Object.assign({}, details[idx] || {}, { rel });
	}
	currentSwatches = colArr.slice();


	let swatchesHtml = '';
	for (var rowIx = 0; rowIx < colArr.length; rowIx++) {
		let infoBlock = '';
		if (showContrast) {
			const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(colArr[rowIx]);
			const backRgb = _textColor ? hexToRgb(colArr[rowIx]) : hexToRgb(_backColor);
			const contrastInfo = getContrastInfo(textRgb, backRgb);
			const badgeHtml = '<span class="wcag-badge ' + contrastInfo.badgeClass + '" data-tooltip="' + contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')">' + contrastInfo.badge + '</span>';
			infoBlock = '<span class="contrast-ratio" style="color:' + contrastInfo.infoColor + '">' + contrastInfo.ratioText + '</span>' + badgeHtml;
		}

		let stepClasses = 'color-step';
		if (rowIx === finalC1Idx) {
			stepClasses += ' is-c1';
		} else if (rowIx === finalC2Idx) {
			stepClasses += ' is-c2';
		}

		const contentInner = '<span class="color-hex"' + hexHiddenAttr + '>' + escapeHtml(swatchText(colArr[rowIx])) + '</span>' + infoBlock;
		const stepStyle = _backColor === undefined
			? 'background-color:' + colArr[rowIx] + ';color:' + _textColor
			: 'background-color:' + _backColor + ';color:' + colArr[rowIx];

		swatchesHtml += '<div class="' + stepClasses + '" data-index="' + rowIx + '" data-hex="' + colArr[rowIx] + '" onclick="calcform_cmx_stepClick(' + rowIx + ', this)" data-tooltip="Click for copy and export options of ' + colArr[rowIx] + '" style="' + stepStyle + '">' + contentInner + '</div>';
	}

	// Color 1 / Color 2 are marked on their gradient slider knobs (works with overdrive too)
	const html = `<div class="color-palette-${gradientDirection}">${swatchesHtml}</div>`;
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
	currentGradient = {
		css: gradientText,
		vertical: gradientDirection === 'down' || gradientDirection === 'up',
		relA: details.length ? details[0].rel : currentRelRange.relStart,
		relB: details.length ? details[details.length - 1].rel : currentRelRange.relEnd
	};

	// restore preview of CSS linear-gradient on grd-cmx as before
	const div_grd = document.getElementById('grd-cmx');
	if (div_grd) {
		div_grd.innerHTML = '<span' + hexHiddenAttr + '>' + gradientText + '</span>';
		div_grd.style.background = gradientText;
		div_grd.style.color = _textColor;
		// Copy only while the gradient box is the visible view (∞)
		if (isInfinite) {
			div_grd.dataset.tooltip = "Click for copy and export options of this CSS linear-gradient";
			div_grd.onclick = () => openGradientExport(gradientText, div_grd);
		} else {
			delete div_grd.dataset.tooltip;
			div_grd.onclick = null;
		}
	}

	// update GradientPosSlider unit
	if (gradientSlider) {
		const points = colArr.map((col, idx) => {
					const pos = posAt(idx);
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
		gradientSlider.updateGradient(gradientText, gradientDirection);   // direction first: knobs are placed along its axis
		gradientSlider.setPoints(points);
	}
	alignGradientSlider();

	document.querySelectorAll('#textContrast .btn-select').forEach(el => {
		el.style.background = gradientText;
	});
	document.querySelectorAll('#backContrast .btn-select span').forEach(span => {
		span.style.backgroundImage = gradientText;
	});
	calcform_cmx_syncState();
	if (imagePicker) imagePicker.refreshMarkers();
}

function handleGradientSliderMove({ index, pos, point, points }) {
	const gradientMode = gradientSwitch.value;
	const gradientWay = gradientWaySwitch.value;
	const showContrast = contrastVisibilitySwitch.value === 'show';

	// Compute interpolation input rel from pos across currentRelRange
	const rel = currentRelRange.relStart + pos * (currentRelRange.relEnd - currentRelRange.relStart);
	point.rel = rel;
	const newColor = getColorAtRel(rel, gradientMode, hsl[0], colMode[0], hsl[1], colMode[1], gradientWay, rgbh[0], rgbh[1]);
			point.color = newColor;
	currentSwatches[index] = newColor;
	customPos = points.map(p => p.pos);
	customSig = lastGradSig;
	if (customPos.every((p, i) => Math.abs(p - (points.length > 1 ? i / (points.length - 1) : 0)) < 0.0006)) customPos = null;
	clearTimeout(stateSyncTimer);
	stateSyncTimer = setTimeout(calcform_cmx_syncState, 200);


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
		if (hexSpan) hexSpan.textContent = swatchText(newColor);
			swatchEl.dataset.hex = newColor;
			swatchEl.dataset.tooltip = `Click for copy and export options of ${newColor}`;

		if (showContrast) {
			const textRgb = _textColor ? hexToRgb(_textColor) : hexToRgb(newColor);
			const backRgb = _textColor ? hexToRgb(newColor) : hexToRgb(_backColor);
			const contrastInfo = getContrastInfo(textRgb, backRgb);
			const contrastInfoEl = swatchEl.querySelector('.contrast-info');
			const contrastRatioEl = swatchEl.querySelector('.contrast-ratio');
			if (contrastInfoEl) {
				contrastInfoEl.style.color = contrastInfo.infoColor;
				const badgeHtml = '<span class="wcag-badge ' + contrastInfo.badgeClass + '" data-tooltip="' + contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')">' + contrastInfo.badge + '</span>';
				contrastInfoEl.innerHTML = contrastInfo.ratioText + '<br/>' + badgeHtml;
			} else if (contrastRatioEl) {
				contrastRatioEl.style.color = contrastInfo.infoColor;
				contrastRatioEl.textContent = contrastInfo.ratioText;
				const badgeEl = swatchEl.querySelector('.wcag-badge');
				if (badgeEl) {
					badgeEl.className = 'wcag-badge ' + contrastInfo.badgeClass;
					badgeEl.textContent = contrastInfo.badge;
					badgeEl.dataset.tooltip = contrastInfo.badgeTitle + ' (Contrast ratio ' + contrastInfo.ratioText + ')';
				}
			}
		}
	}
}

/**
 * Let the gradient slider run from the centre of the first swatch to the centre
 * of the last one, so every knob sits directly over the centre of its swatch.
 * Falls back to the default inset when swatches are stacked (up/down) or wrap
 * into several rows, or when the swatches are hidden (Steps = ∞).
 */
function alignGradientSlider() {
	const sliderEl = document.getElementById('grd-slider');
	const wrapEl = sliderEl && sliderEl.querySelector('.gradient-slider-track-wrap');
	if (!wrapEl) return;
	['--grd-inset-l', '--grd-inset-r', '--grd-inset-t', '--grd-inset-b'].forEach(n => sliderEl.style.removeProperty(n));
	const layoutEl = document.getElementById('grd-layout');
	const vertical = sliderEl.classList.contains('is-vertical');
	if (layoutEl) layoutEl.classList.toggle('is-vertical', vertical);
	if (dockOwner) dockMeasure();
	const swatches = document.querySelectorAll('#tab-cmx .color-step');
	if (swatches.length < 2) return;
	const first = swatches[0].getBoundingClientRect();
	const last = swatches[swatches.length - 1].getBoundingClientRect();
	const wrap = wrapEl.getBoundingClientRect();
	if (vertical) {
		// ends at the vertical midpoints of the first / last swatch (overdrive included)
		if (first.height === 0) return;   // hidden
		const centerT = first.top + first.height / 2;
		const centerB = last.top + last.height / 2;
		sliderEl.style.setProperty('--grd-inset-t', `${Math.max(0, centerT - wrap.top).toFixed(2)}px`);
		sliderEl.style.setProperty('--grd-inset-b', `${Math.max(0, wrap.bottom - centerB).toFixed(2)}px`);
		return;
	}
	if (first.width === 0 || Math.abs(first.top - last.top) > 1) return;   // hidden or wrapped
	const centerL = first.left + first.width / 2;
	const centerR = last.left + last.width / 2;
	sliderEl.style.setProperty('--grd-inset-l', `${Math.max(0, centerL - wrap.left).toFixed(2)}px`);
	sliderEl.style.setProperty('--grd-inset-r', `${Math.max(0, wrap.right - centerR).toFixed(2)}px`);
}
if (typeof ResizeObserver === 'function') {
	document.addEventListener('DOMContentLoaded', () => {
		const tabEl = document.getElementById('tab-cmx');
		if (tabEl) new ResizeObserver(() => alignGradientSlider()).observe(tabEl);
	});
} else {
	window.addEventListener('resize', alignGradientSlider, { passive: true });
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
}

function calcform_cmx_stepClick(index, el) {
	openSwatchExport(el.dataset.hex, el);
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
		inputMode: inputMode.map(o => Object.assign({}, o)),
		theme: themeSwitch ? themeSwitch.value : document.documentElement.dataset.theme,
		backgroundMode, customBackground, customBackgroundSource,
		gradientDirection: gradientDirectionSwitch.value,
		gradientWay: gradientWaySwitch.value,
		contrastVisibility: contrastVisibilitySwitch.value,
		swatchOpts: Object.assign({}, swatchOpts),
		swatchPos: customPos ? customPos.map(p => Math.round(p * 1000) / 1000) : null
	};
}
function calcform_cmx_applyState(data) {
	if (!data) return;
	if (!data.rgbh && data.c1 && data.c2) {
		data.rgbh = [data.c1, data.c2];
	} else if (!data.rgbh && data.color1 && data.color2) {
		data.rgbh = [data.color1, data.color2];
	}
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
	cmpModesApply(data.inputMode);
	for (let ix = 0; ix < 2; ix++) {
		inp_cmx_arr[ix].set('c', rgbh[ix]);
		colModeSwitch[ix].setValue(colMode[ix], true);
		calcform_cmx_colorspace(colMode[ix], undefined, undefined, ix, true);
		if (data.hsl && Array.isArray(data.hsl[ix]) && data.hsl[ix].length === 3) {
			hsl[ix] = data.hsl[ix].slice();
			calcform_cmx_show(ix);
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
	if (data.swatchOpts) swatchOptsSet(data.swatchOpts);
	if (data.backgroundMode) backgroundMode = data.backgroundMode;
	else if (data.theme) backgroundMode = data.theme === 'dark' ? 'black' : 'white';
	if (data.customBackground) customBackground = data.customBackground;
	if (['picker','color1','color2'].includes(data.customBackgroundSource)) customBackgroundSource = data.customBackgroundSource;
	if (backgroundMode === 'custom') applyBackground(customBackground);
	else if (backgroundMode === 'black') applyBackground('#000000');
	else applyBackground('#ffffff');
	renderBackgroundChoice();
	if (data.theme && !data.backgroundMode) themeCare(data.theme);
	customPos = null;
	customSig = null;
	pendingSwatchPos = (Array.isArray(data.swatchPos) && data.swatchPos.length > 1 && data.swatchPos.every(n => typeof n === 'number' && n >= 0 && n <= 1)) ? data.swatchPos.slice() : null;
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
			// channel values in the units of the active value format (hex format: decimal 0–255)
			const def = cmpModesForMode[mode][(data.inputMode && data.inputMode[ix] && data.inputMode[ix][mode]) || 0];
			const chStr = data.hsl[ix]
				.map((v, i) => getTextOfRound(v * def.factor[i], def.urlRound[i]))
				.join('-');
			params.set('ch' + num, chStr);
		}
	});
	const im = cmpModesEncode(data.inputMode || []);
	if (im !== '0') params.set('im', im);   // omitted while every value format is the default
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
	if (data.theme) params.set('th', data.theme);
	params.set('bgm', data.backgroundMode || 'white');
	if (data.backgroundMode === 'custom' && data.customBackground) params.set('bgc', data.customBackground);
	params.set('bgs', data.customBackgroundSource || 'picker');
		swatchOptsToParams(params, data.swatchOpts);
	const sp = swatchPosEncode(data.swatchPos);
	if (sp) params.set('sp', sp);
	const newUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
	window.history.replaceState(null, '', newUrl);
	// the docs page links back with these params, so the colors survive Docs → App
	try { localStorage.setItem(LAST_SEARCH_KEY, window.location.search); } catch (e) { /* storage unavailable */ }
}
function calcform_cmx_getUrlState() {
	if (!window.location.search || window.location.search.length <= 1) return null;
	const params = new URLSearchParams(window.location.search);
	const knownKeys = ['c1', 'm1', 'ch1', 'c2', 'm2', 'ch2', 'im', 'st', 'od', 'gm', 'gd', 'gw', 'cv', 'tc', 'bc', 'th', 'bgm', 'bgc', 'bgs', 'so', 'sx', 'sp'];
	if (!knownKeys.some(k => params.has(k))) return null;

	const state = calcform_cmx_getState();
	const isHex = v => /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);

	// value formats define the units of ch1/ch2; links without "im" use the default formats
	state.inputMode = cmpModesDecode(params.get('im'));

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
				const def = cmpModesForMode[mode][state.inputMode[ix][mode]];
				parsedCh = parts.map((val, i) => bound(val, def.min[i], def.max[i]) / def.factor[i]);
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
		if (!isNaN(st)) state.steps = bound(st, 2, STEPS_INFINITE);
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
		if (['show', 'hide', 'none'].includes(cv)) state.contrastVisibility = cv;
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
	if (['white','black','custom'].includes(params.get('bgm'))) state.backgroundMode = params.get('bgm');
	if (params.has('bgc') && /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(params.get('bgc'))) state.customBackground = rgbCorrect(params.get('bgc')).toLowerCase();
	if (['picker','color1','color2'].includes(params.get('bgs'))) state.customBackgroundSource = params.get('bgs');

	// gradient options: absent in the link means defaults
		state.swatchOpts = swatchOptsFromParams(params);
	state.swatchPos = swatchPosDecode(params.get('sp'));

	return state;
}
function calcform_cmx_syncState() {
	if (docsReady) { calcform_cmx_docsSaveBackground(); return; }
	if (!cmxStateReady) return;
	const state = calcform_cmx_getState();
	storage.saveState(state);
	calcform_cmx_updateUrl(state);
}
function openExportModal() {
	hideTooltip();
	const modal = document.getElementById('export-modal');
	if (modal) {
		modal.classList.add('open');
		const input = document.getElementById('save-input');
		if (input) {
			input.focus();
			input.select();
		}
	}
}

function closeExportModal() {
	hideTooltip();
	const modal = document.getElementById('export-modal');
	if (modal) modal.classList.remove('open');
}

function openLoadModal() {
	hideTooltip();
	if (storage) storage.loadInit();
	const modal = document.getElementById('load-modal');
	if (modal) {
		modal.classList.add('open');
		const select = document.getElementById('load-input');
		if (select) select.focus();
	}
}

function closeLoadModal() {
	hideTooltip();
	const modal = document.getElementById('load-modal');
	if (modal) modal.classList.remove('open');
}

function getExportFilename(defaultName = 'spectrumstep-palette') {
	const input = document.getElementById('save-input');
	let name = input ? input.value.trim() : '';
	if (!name) name = defaultName;
	name = name.replace(/\.(png|svg|json|txt|css)$/i, '').trim();
	return name || defaultName;
}

function triggerDownload(blobOrUrl, filename) {
	const url = (typeof blobOrUrl === 'string') ? blobOrUrl : URL.createObjectURL(blobOrUrl);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	if (typeof blobOrUrl !== 'string') {
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
}

function getHexColorList() {
	if (currentSwatches && currentSwatches.length > 0) {
		return currentSwatches.join('\n');
	}
	const stepsEls = document.querySelectorAll('#tab-cmx .color-step .color-hex');
	return Array.from(stepsEls).map(el => el.textContent.trim()).join('\n');
}

function getCssVariables() {
	const swatches = (currentSwatches && currentSwatches.length > 0)
		? currentSwatches
		: Array.from(document.querySelectorAll('#tab-cmx .color-step .color-hex')).map(el => el.textContent.trim());
	const lines = swatches.map((col, idx) => `  --spectrum-${idx + 1}: ${col};`);
	return `:root {\n${lines.join('\n')}\n}`;
}

function generateExportJson() {
	const state = calcform_cmx_getState();
	const canonicalEl = document.querySelector('link[rel="canonical"]');
	const baseUrl = canonicalEl ? canonicalEl.href : 'https://ardoid.eu/spectrumstep/';
	const cleanBase = baseUrl.split('?')[0].replace(/\/+$/, '') + '/';
	const actualLink = cleanBase + window.location.search;

	const swatches = (currentSwatches && currentSwatches.length > 0)
		? currentSwatches.slice()
		: Array.from(document.querySelectorAll('#tab-cmx .color-step .color-hex')).map(el => el.textContent.trim());

	const exportObj = {
		gradientSteps: swatches,
		link: actualLink,
		options: {
			c1: state.rgbh[0],
			c2: state.rgbh[1],
			colMode: state.colMode,
			inputMode: state.inputMode,
			rgbh: state.rgbh,
			hsl: state.hsl,
			steps: state.steps,
			overdrive: state.overdrive,
			gradientMode: state.gradientMode,
			gradientDirection: state.gradientDirection,
			gradientWay: state.gradientWay,
			contrastVisibility: state.contrastVisibility,
			textColor: state.textColor || null,
			backColor: state.backColor || null,
			theme: state.theme,
			backgroundMode: state.backgroundMode,
			customBackground: state.customBackground,
			customBackgroundSource: state.customBackgroundSource,
				swatchOpts: state.swatchOpts,
				swatchPos: state.swatchPos

			}
	};
	return JSON.stringify(exportObj, null, 2);
}

function exportPaletteToPng(filename) {
	exportScreenImage('png', filename.replace(/\.png$/i, ''));
}

function exportPaletteToSvg(filename) {
	exportScreenImage('svg', filename.replace(/\.svg$/i, ''));
}

function exportPaletteToJson(filename) {
	const jsonContent = generateExportJson();
	const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
	triggerDownload(blob, filename);
	showToast(`✓ Downloaded JSON file: ${filename}`);
	closeExportModal();
}

function loadJsonFile(file) {
	if (!file) return;
	const reader = new FileReader();
	reader.onload = function (e) {
		try {
			const data = JSON.parse(e.target.result);
			const state = data.options || data;
			calcform_cmx_applyState(state);
			showToast(`✓ Palette loaded from ${file.name}`);
			closeLoadModal();
		} catch (err) {
			alert('Failed to parse JSON file: ' + err.message);
		}
	};
	reader.readAsText(file);
}

function calcform_cmx_onLoad() {
	var data = storage.loadSetting();
	if (data === null) return;
	calcform_cmx_applyState(data);
	const loadSelect = document.getElementById('load-input');
	const name = (loadSelect && loadSelect.value) ? loadSelect.value : 'palette';
	showToast(`✓ Loaded palette "${name}"`);
	closeLoadModal();
}

function calcform_cmx_onSave() {
	const name = getExportFilename();
	storage.saveSetting({ name: name, data: calcform_cmx_getState() });
	showToast(`✓ Palette "${name}" saved to storage`);
	closeExportModal();
}

function initExportAndLoadModals() {
	const mainLoadBtn = document.getElementById('main-load-btn');
	const mainExportBtn = document.getElementById('main-export-btn');
	const exportModal = document.getElementById('export-modal');
	const loadModal = document.getElementById('load-modal');
	const exportCloseBtn = document.getElementById('export-modal-close');
	const loadCloseBtn = document.getElementById('load-modal-close');

	if (mainLoadBtn) mainLoadBtn.onclick = openLoadModal;
	if (mainExportBtn) mainExportBtn.onclick = openExportModal;

	if (exportCloseBtn) exportCloseBtn.onclick = closeExportModal;
	if (loadCloseBtn) loadCloseBtn.onclick = closeLoadModal;

	if (exportModal) {
		exportModal.addEventListener('click', function (e) {
			if (e.target === exportModal) closeExportModal();
		});
	}
	if (loadModal) {
		loadModal.addEventListener('click', function (e) {
			if (e.target === loadModal) closeLoadModal();
		});
	}

	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') {
			closeExportModal();
			closeLoadModal();
		}
	});

	const copyHexBtn = document.getElementById('btn-copy-hex');
	if (copyHexBtn) {
		copyHexBtn.onclick = function () {
			fallbackCopy(getHexColorList(), '✓ Copied HEX color list to clipboard');
			closeExportModal();
		};
	}

	const copyCssBtn = document.getElementById('btn-copy-css');
	if (copyCssBtn) {
		copyCssBtn.onclick = function () {
			fallbackCopy(getCssVariables(), '✓ Copied CSS variables to clipboard');
			closeExportModal();
		};
	}

	const exportPngBtn = document.getElementById('btn-export-png');
	if (exportPngBtn) {
		exportPngBtn.onclick = function () {
			exportPaletteToPng(getExportFilename() + '.png');
		};
	}

	const exportSvgBtn = document.getElementById('btn-export-svg');
	if (exportSvgBtn) {
		exportSvgBtn.onclick = function () {
			exportPaletteToSvg(getExportFilename() + '.svg');
		};
	}

	const exportJsonBtn = document.getElementById('btn-export-json');
	if (exportJsonBtn) {
		exportJsonBtn.onclick = function () {
			exportPaletteToJson(getExportFilename() + '.json');
		};
	}

	const triggerJsonUpload = document.getElementById('btn-trigger-json-upload');
	const jsonFileInput = document.getElementById('load-json-file-input');
	if (triggerJsonUpload && jsonFileInput) {
		triggerJsonUpload.onclick = function () {
			jsonFileInput.click();
		};
		jsonFileInput.onchange = function (e) {
			const file = e.target.files && e.target.files[0];
			if (file) {
				loadJsonFile(file);
				jsonFileInput.value = '';
			}
		};
	}
	// dropping files is handled globally by ImagePicker (images, JSON, anything else)
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
		if (!cmxStateReady) backgroundMode = theme === 'dark' ? 'black' : 'white';
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

/* ───────────────────────── docs page ─────────────────────────
 * Same header as the app. The page color and Color 1 / Color 2 (for the back chooser) are taken from the
 * last app state; a back color chosen here is written back, so the app shows it when the user returns. */
const LAST_SEARCH_KEY = 'color-mixer-search';
var docsReady = false;
/** search params of the last app state ('' when there is none) */
function calcform_cmx_lastSearch() {
	let search = '';
	try { search = localStorage.getItem(LAST_SEARCH_KEY) || ''; } catch (e) { /* storage unavailable */ }
	return /^\?[\w%.,~=&+-]{1,2000}$/.test(search) ? search : '';
}
/** Docs → App: the links to the app carry the search params of the last app state, so the colors are not reset */
function calcform_cmx_docsBackLinks() {
	const search = calcform_cmx_lastSearch();
	if (!search) return;
	document.querySelectorAll('a[href="../"], a[href^="../?"]').forEach(a => { a.setAttribute('href', '../' + search); });
}
function calcform_cmx_docsInit() {
	const isHex = v => typeof v === 'string' && /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
	const params = new URLSearchParams(calcform_cmx_lastSearch());
	const saved = storage.loadState() || {};
	const mode = params.get('bgm') || saved.backgroundMode;
	const custom = params.get('bgc') || saved.customBackground;
	const source = params.get('bgs') || saved.customBackgroundSource;
	[params.get('c1') || (saved.rgbh || [])[0], params.get('c2') || (saved.rgbh || [])[1]].forEach((c, ix) => {
		if (isHex(c)) rgbh[ix] = rgbCorrect(c);
	});
	if (isHex(custom)) customBackground = rgbCorrect(custom);
	if (['picker', 'color1', 'color2'].includes(source)) customBackgroundSource = source;
	if (['white', 'black', 'custom'].includes(mode)) backgroundMode = mode;
	else themeCare();   // never been in the app: black or white back by the system theme
	applyBackground(backgroundMode === 'custom' ? customBackground : backgroundMode === 'black' ? '#000000' : '#ffffff');
	initThemeSwitch();
	document.addEventListener('keydown', e => {
		if (e.key === 'Escape' && document.getElementById('background-modal')?.classList.contains('open')) closeBackgroundModal();
	});
	// the image picker works on the gradient, so it lives in the app: go there and open it
	document.getElementById('image-picker-btn')?.addEventListener('click', () => {
		window.location.href = '../' + calcform_cmx_lastSearch() + '#image';
	});
	calcform_cmx_docsBackLinks();
	// where the text scrolls inside <main> (see CSS), give it the focus so the keyboard scrolls it
	const main = document.querySelector('main');
	if (main && getComputedStyle(main).overflowY === 'auto') { main.tabIndex = -1; main.focus({ preventScroll: true }); }
	docsReady = true;
}
/** writes the back color chosen on the docs page into the last app state (search params and session state) */
function calcform_cmx_docsSaveBackground() {
	const theme = document.documentElement.dataset.theme;
	const params = new URLSearchParams(calcform_cmx_lastSearch());
	params.set('th', theme);
	params.set('bgm', backgroundMode);
	if (backgroundMode === 'custom') params.set('bgc', customBackground); else params.delete('bgc');
	params.set('bgs', customBackgroundSource);
	try { localStorage.setItem(LAST_SEARCH_KEY, '?' + params.toString()); } catch (e) { /* storage unavailable */ }
	const saved = storage.loadState();
	if (saved && typeof saved === 'object') storage.saveState(Object.assign(saved, { theme, backgroundMode, customBackground, customBackgroundSource }));
	calcform_cmx_docsBackLinks();
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

	// Range settings: anchor at the whole fieldset (incl. legend) so the
	// live value in the legend stays visible while sliding
	const anchor = target.closest('fieldset.range-setting') || target;
	const rect = anchor.getBoundingClientRect();
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
	window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });   // capture: also scrolling inside a popup or the docs text
	window.addEventListener('resize', hideTooltip, { passive: true });
}

document.addEventListener('DOMContentLoaded', function () {
	if (!document.getElementById('form-cmx-0')) {
		calcform_cmx_docsInit();
		initTooltips();
		return;
	}
	calcform_cmx_init();
	calcform_cmx_doml();
	initDock();
	imagePicker = new ImagePicker();
	imagePicker.init();
	const urlState = calcform_cmx_getUrlState();
	if (!urlState) {
		// a clean URL (no known search params) means "start from defaults":
		// drop the remembered session state and theme so nothing leaks back in
		try {
			localStorage.removeItem(storage.unit + '-state');
			localStorage.removeItem('theme');
		} catch (e) { /* storage unavailable: defaults apply anyway */ }
	}
	themeCare(); // need calcform_cmx_init before
	if (urlState) {
		calcform_cmx_applyState(urlState);
	}
	cmxStateReady = true;
	calcform_cmx_syncState();
	initTooltips();
	// Docs → pipette button: arrive with the image picker open
	if (window.location.hash === '#image') {
		window.history.replaceState(null, '', window.location.pathname + window.location.search);
		imagePicker.open();
	}
	window.addEventListener('popstate', function () {
		const popState = calcform_cmx_getUrlState();
		if (popState) {
			calcform_cmx_applyState(popState);
		} else {
			// navigated to a URL without params: reload so defaults are rebuilt cleanly
			window.location.reload();
		}
	});
});