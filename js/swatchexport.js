/** Gradient options popup (live swatch styling) and single-swatch export popup
 *  (color formats, HTML with inline CSS, HTML with <style>, CSS only).
 *  Loaded before spectrumstep.js; uses its helpers (copyText, triggerDownload, showToast, hideTooltip, ...) at runtime only. */

/* ───────────────────────── Gradient options ───────────────────────── */

const swatchOptDefaults = {
	gap: 4, radius: 8, fontSize: 16,
	fontWeight: 'normal', fontStyle: 'normal', fontFamily: 'monospace', textDecoration: 'none',
	hAlign: 'center', vAlign: 'center', text: ''
};
const swatchOptChoices = {
	fontWeight: ['normal', 'bold', 'bolder', 'lighter'],
	fontStyle: ['normal', 'italic'],
	fontFamily: ['serif', 'sans-serif', 'monospace'],
	textDecoration: ['none', 'underline', 'overline'],
	hAlign: ['left', 'center', 'right'],
	vAlign: ['top', 'center', 'bottom']
};
const swatchOptRanges = { gap: [0, 24], radius: [0, 96], fontSize: [6, 48] };
const swatchOptTips = {
	gap: 'Gap between the swatches and between the color input bars (outer container only, not part of the HTML export)',
	radius: 'Corner radius of the gradient swatches and the CSS linear-gradient box',
	fontSize: 'Font size of the text inside the swatches',
	fontWeight: 'font-weight of the swatch text. Click to cycle: normal, bold, bolder, lighter',
	fontStyle: 'font-style of the swatch text. Click to cycle: normal, italic',
	fontFamily: 'font-family of the swatch text. Click to cycle: serif, sans-serif, monospace',
	textDecoration: 'text-decoration of the swatch text. Click to cycle: none, underline, overline',
	hAlign: 'Horizontal alignment of the swatch text. Click to cycle: left, center, right',
	vAlign: 'Vertical alignment of the swatch text. Click to cycle: top, center, bottom',
	text: 'Text shown in every swatch. Leave empty to show the HEX value of the swatch'
};
var swatchOpts = Object.assign({}, swatchOptDefaults);
var swatchRangeUi = {};
var swatchSwitchUi = {};

const swatchJustify = { left: 'flex-start', center: 'center', right: 'flex-end' };
const swatchAlign = { top: 'flex-start', center: 'center', bottom: 'flex-end' };

function swatchFamilyCss(family) {
	return family === 'monospace' ? 'var(--font-monospace)' : family;
}
/** text shown in a swatch of the given color */
function swatchText(hex) {
	return swatchOpts.text !== '' ? swatchOpts.text : hex;
}
function escapeHtml(text) {
	return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
/** push swatchOpts into the live UI via CSS custom properties; texts are refreshed by the caller */
function swatchOptsApply() {
	const o = swatchOpts;
	const s = document.documentElement.style;
	s.setProperty('--bar-gap', o.gap + 'px');
	s.setProperty('--sw-radius', o.radius + 'px');
	s.setProperty('--sw-font-size', o.fontSize + 'px');
	s.setProperty('--sw-font-weight', o.fontWeight);
	s.setProperty('--sw-font-style', o.fontStyle);
	s.setProperty('--sw-font-family', swatchFamilyCss(o.fontFamily));
	s.setProperty('--sw-text-decoration', o.textDecoration);
	s.setProperty('--sw-justify', swatchJustify[o.hAlign]);
	s.setProperty('--sw-align', swatchAlign[o.vAlign]);
	s.setProperty('--sw-text-align', o.hAlign);
}
/** take over options from a state object, ignoring anything invalid */
function swatchOptsSet(data) {
	if (!data || typeof data !== 'object') return;
	Object.keys(swatchOptRanges).forEach(k => {
		const v = Number(data[k]);
		if (data[k] !== undefined && isFinite(v)) swatchOpts[k] = Math.round(Math.min(swatchOptRanges[k][1], Math.max(swatchOptRanges[k][0], v)));
	});
	Object.keys(swatchOptChoices).forEach(k => {
		if (swatchOptChoices[k].includes(data[k])) swatchOpts[k] = data[k];
	});
	if (typeof data.text === 'string') swatchOpts.text = data.text.slice(0, 200);
	swatchOptsSync();
	swatchOptsApply();
}
/** URL param "so" = gap.radius.fontSize.weight.style.family.decoration.hAlign.vAlign (choices as list index), "sx" = text;
 *  both omitted while everything is default */
const swatchOptChoiceKeys = ['fontWeight', 'fontStyle', 'fontFamily', 'textDecoration', 'hAlign', 'vAlign'];
function swatchOptsToParams(params, o) {
	o = o || swatchOpts;
	const nums = Object.keys(swatchOptRanges).map(k => o[k]).concat(swatchOptChoiceKeys.map(k => swatchOptChoices[k].indexOf(o[k])));
	const defs = Object.keys(swatchOptRanges).map(k => swatchOptDefaults[k]).concat(swatchOptChoiceKeys.map(k => swatchOptChoices[k].indexOf(swatchOptDefaults[k])));
	if (nums.join('.') !== defs.join('.')) params.set('so', nums.join('.'));
	if (o.text) params.set('sx', o.text);
}
function swatchOptsFromParams(params) {
	const o = Object.assign({}, swatchOptDefaults);
	const parts = (params.get('so') || '').split('.').map(Number);
	if (parts.length === 9 && parts.every(n => Number.isInteger(n))) {
		Object.keys(swatchOptRanges).forEach((k, i) => { o[k] = parts[i]; });
		swatchOptChoiceKeys.forEach((k, i) => { o[k] = swatchOptChoices[k][parts[3 + i]]; });
	}
	if (params.has('sx')) o.text = params.get('sx');
	return o;
}
function swatchSwitchStyle(key) {
	const sw = swatchSwitchUi[key];
	if (!sw) return;
	const s = sw.btn.style;
	s.fontWeight = key === 'fontWeight' ? swatchOpts.fontWeight : '';
	s.fontStyle = key === 'fontStyle' ? swatchOpts.fontStyle : '';
	s.fontFamily = key === 'fontFamily' ? swatchFamilyCss(swatchOpts.fontFamily) : '';
	s.textDecoration = key === 'textDecoration' ? swatchOpts.textDecoration : '';
}
/** show swatchOpts in the popup controls */
function swatchOptsSync() {
	Object.keys(swatchRangeUi).forEach(k => swatchRangeUi[k].set(swatchOpts[k]));
	Object.keys(swatchSwitchUi).forEach(k => {
		swatchSwitchUi[k].setValue(swatchOpts[k], true);
		swatchSwitchStyle(k);
	});
	const text = document.getElementById('opt-text');
	if (text) text.value = swatchOpts.text;
}
/** every option changed: restyle the live UI and redraw the swatch texts */
function swatchOptsChanged() {
	swatchOptsApply();
	if (typeof calcform_cmx_dyna === 'function') calcform_cmx_dyna();
}

function positionOptionsDialog() {
	const backdrop = document.getElementById('options-modal');
	const dlg = backdrop && backdrop.querySelector('.cmx-modal-dialog');
	if (!dlg) return;
	// below the gradient, so the swatches and the color bars stay visible while editing
	const grd = document.getElementById('grd-cmx');
	const anchor = (grd && !grd.hidden) ? grd : document.getElementById('tab-cmx');
	const vh = window.innerHeight;
	let top = anchor ? anchor.getBoundingClientRect().bottom + 12 : vh;
	top = Math.max(8, Math.min(top, vh - dlg.offsetHeight - 8));
	dlg.style.marginTop = Math.max(0, top - 16) + 'px';
}
function openOptionsModal() {
	hideTooltip();
	const modal = document.getElementById('options-modal');
	if (!modal) return;
	modal.classList.add('open');
	positionOptionsDialog();
}
function closeOptionsModal() {
	hideTooltip();
	const modal = document.getElementById('options-modal');
	if (modal) modal.classList.remove('open');
}

function initSwatchOptions() {
	const rangeLabels = { gap: 'px', radius: 'px', fontSize: 'px' };
	Object.keys(swatchOptRanges).forEach(k => {
		const id = 'opt-' + k;
		const rs = new RangeSetting(id, () => {
			swatchOpts[k] = rs.get();
			swatchOptsChanged();
		}, swatchOptTips[k], v => v + rangeLabels[k]);
		swatchRangeUi[k] = rs;
	});
	Object.keys(swatchOptChoices).forEach(k => {
		const cell = document.getElementById('opt-' + k);
		if (!cell) return;
		swatchSwitchUi[k] = new ButtonSwitch(cell, swatchOptChoices[k], undefined, k, (text, idx, btn, key) => {
			swatchOpts[key] = text;
			swatchSwitchStyle(key);
			swatchOptsChanged();
		}, { tooltips: swatchOptTips[k] });
		swatchSwitchUi[k].btn.classList.add('opt-switch-btn');
	});
	const text = document.getElementById('opt-text');
	if (text) {
		text.dataset.tooltip = swatchOptTips.text;
		text.addEventListener('input', () => {
			swatchOpts.text = text.value;
			swatchOptsChanged();
		});
	}
	const reset = document.getElementById('opt-reset');
	if (reset) reset.addEventListener('click', () => {
		swatchOpts = Object.assign({}, swatchOptDefaults);
		swatchOptsSync();
		swatchOptsChanged();
	});
	const gear = document.getElementById('main-options-btn');
	if (gear) gear.addEventListener('click', openOptionsModal);
	const close = document.getElementById('options-modal-close');
	if (close) close.addEventListener('click', closeOptionsModal);
	const modal = document.getElementById('options-modal');
	if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeOptionsModal(); });
	window.addEventListener('resize', () => {
		if (modal && modal.classList.contains('open')) positionOptionsDialog();
	}, { passive: true });
	swatchOptsSync();
	swatchOptsApply();
}

/* ───────────────────────── Color formats ───────────────────────── */

/** number without trailing zeros and without "-0" */
function fmtNum(v, decimals) {
	const n = Number(Number(v).toFixed(decimals));
	return Object.is(n, -0) ? 0 : n;
}
/** CIE Lab (D50, as in CSS Color 4) of an sRGB color [0..255] → [L 0..100, a, b] */
function rgbToLab(rgb) {
	const [r, g, b] = rgb.map(v => srgbChannelToLinear(v / 255));
	const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
	const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
	const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;
	// Bradford adaptation D65 → D50, relative to the D50 white point
	const X = (1.0478112 * x + 0.0228866 * y - 0.0501270 * z) / 0.96422;
	const Y = 0.0295424 * x + 0.9904844 * y - 0.0170491 * z;
	const Z = (-0.0092345 * x + 0.0150436 * y + 0.7521316 * z) / 0.82521;
	const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
	const fx = f(X), fy = f(Y), fz = f(Z);
	return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
/** all copy formats of a color; transparency 0..100 (%) is used by the alpha formats */
function swatchColorFormats(hex, transparency) {
	const rgb = hexToRgb(hex).map(Math.round);
	const [r, g, b] = rgb;
	const alpha = 1 - bound(transparency || 0, 0, 100) / 100;
	const a = fmtNum(alpha, 2);
	const slash = alpha < 1 ? ' / ' + a : '';
	const hex6 = rgbToColor(rgb);
	const hexA = hex6 + ('0' + Math.round(alpha * 255).toString(16)).slice(-2);
	const hsl = rgbToHsl(rgb);
	const h = fmtNum((hsl[0] || 0) * 360, 1);
	const hsv = rgbToHsv(rgb);
	const hwbW = fmtNum(Math.min(r, g, b) / 255 * 100, 1);
	const hwbB = fmtNum((1 - Math.max(r, g, b) / 255) * 100, 1);
	const ok = rgbToOklab(rgb);
	const okC = Math.hypot(ok[1], ok[2]);
	const okH = okC > 0.0001 ? fmtNum((Math.atan2(ok[2], ok[1]) * 180 / Math.PI + 360) % 360, 1) : 0;
	const lab = rgbToLab(rgb);
	const labC = Math.hypot(lab[1], lab[2]);
	const labH = labC > 0.01 ? fmtNum((Math.atan2(lab[2], lab[1]) * 180 / Math.PI + 360) % 360, 1) : 0;
	const pc = v => fmtNum(v * 100, 1) + '%';
	return {
		hex: '#' + hex6,
		hexa: '#' + hexA,
		rgb: r + ', ' + g + ', ' + b,
		rgbf: 'rgb(' + r + ' ' + g + ' ' + b + slash + ')',
		rgba: 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')',
		hsl: 'hsl(' + h + ' ' + pc(hsl[1]) + ' ' + pc(hsl[2]) + slash + ')',
		hsla: 'hsla(' + h + ', ' + pc(hsl[1]) + ', ' + pc(hsl[2]) + ', ' + a + ')',
		hsv: h + '°, ' + pc(hsv[1]) + ', ' + pc(hsv[2]),
		hwb: 'hwb(' + h + ' ' + hwbW + '% ' + hwbB + '%' + slash + ')',
		oklch: 'oklch(' + fmtNum(ok[0], 3) + ' ' + fmtNum(okC, 3) + ' ' + okH + slash + ')',
		oklab: 'oklab(' + fmtNum(ok[0], 3) + ' ' + fmtNum(ok[1], 3) + ' ' + fmtNum(ok[2], 3) + slash + ')',
		lab: 'lab(' + fmtNum(lab[0], 1) + '% ' + fmtNum(lab[1], 1) + ' ' + fmtNum(lab[2], 1) + slash + ')',
		lch: 'lch(' + fmtNum(lab[0], 1) + '% ' + fmtNum(labC, 1) + ' ' + labH + slash + ')'
	};
}

/* ───────────────────────── Dragged knob positions in links ───────────────────────── */

/** URL param "sp": every position as per mille, 2 base-36 digits each */
function swatchPosEncode(pos) {
	if (!Array.isArray(pos) || pos.length < 2) return '';
	return pos.map(p => ('0' + Math.round(bound(p, 0, 1) * 1000).toString(36)).slice(-2)).join('');
}
function swatchPosDecode(str) {
	if (!/^(?:[0-9a-z]{2}){2,}$/i.test(str || '')) return null;
	const out = str.match(/../g).map(t => parseInt(t, 36) / 1000);
	return out.every(v => v >= 0 && v <= 1) ? out : null;
}

/* ───────────────────────── Scene: what is drawn on screen → PNG / SVG ───────────────────────── */

const hashHex = h => '#' + String(h).replace('#', '').toLowerCase();

/** colors of the continuous gradient, sampled along its axis (canvas/SVG cannot interpolate in OKLCH etc. themselves) */
function gradientSpec() {
	const g = currentGradient;
	const stops = [];
	const n = 32;
	for (let i = 0; i <= n; i++) {
		let color;
		if (i === 0) color = currentSwatches[0];
		else if (i === n) color = currentSwatches[currentSwatches.length - 1];
		else color = getColorAtRel(g.relA + (i / n) * (g.relB - g.relA), gradientSwitch.value, hsl[0], colMode[0], hsl[1], colMode[1], gradientWaySwitch.value, rgbh[0], rgbh[1]);
		stops.push([i / n, hashHex(color)]);
	}
	return { vertical: g.vertical, stops };
}
/** primitives (rects, texts) of the given boxes (.color-step / .linear-gradient) as laid out right now, relative to root */
function sceneOf(root, boxes) {
	const o = root.getBoundingClientRect();
	const prims = [];
	boxes.forEach(box => {
		const st = getComputedStyle(box);
		const r = box.getBoundingClientRect();
		const rad = parseFloat(st.borderTopLeftRadius) || 0;
		const rect = { t: 'rect', x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, rad };
		if (box.classList.contains('linear-gradient')) rect.grad = gradientSpec();
		else rect.fill = st.backgroundColor;
		prims.push(rect);
		Array.from(box.children).forEach(ch => {
			if (ch.tagName !== 'SPAN' || ch.hidden) return;
			const cs = getComputedStyle(ch);
			const cr = ch.getBoundingClientRect();
			const opacity = parseFloat(cs.opacity);
			if (ch.classList.contains('wcag-badge')) {
				const lw = parseFloat(cs.borderTopWidth) || 1;
				prims.push({
					t: 'rect', x: cr.left - o.left + lw / 2, y: cr.top - o.top + lw / 2, w: cr.width - lw, h: cr.height - lw,
					rad: parseFloat(cs.borderTopLeftRadius) || 3, stroke: cs.borderTopColor, lw,
					dash: cs.borderTopStyle === 'dashed', opacity
				});
			}
			const text = ch.textContent.trim();
			if (!text) return;
			prims.push({
				t: 'text', x: cr.left - o.left + cr.width / 2, y: cr.top - o.top + cr.height / 2, text,
				fontStyle: cs.fontStyle, weight: cs.fontWeight, size: parseFloat(cs.fontSize), family: cs.fontFamily,
				fill: cs.color, opacity,
				deco: ch.classList.contains('color-hex') || box.classList.contains('linear-gradient') ? st.textDecorationLine : 'none'
			});
		});
	});
	return { w: Math.round(o.width), h: Math.round(o.height), prims };
}
/** the continuous gradient box when it is shown, else the discrete swatches */
function screenScene() {
	const grd = document.getElementById('grd-cmx');
	if (grd && !grd.hidden) return sceneOf(grd, [grd]);
	const palette = document.querySelector('#tab-cmx [class*="color-palette-"]');
	return palette ? sceneOf(palette, Array.from(palette.querySelectorAll('.color-step'))) : null;
}
function sceneToCanvas(scene, bg) {
	const canvas = document.createElement('canvas');
	canvas.width = scene.w;
	canvas.height = scene.h;
	const ctx = canvas.getContext('2d');
	if (bg) {
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, scene.w, scene.h);
	}
	const path = p => {
		ctx.beginPath();
		if (ctx.roundRect) ctx.roundRect(p.x, p.y, p.w, p.h, p.rad);
		else ctx.rect(p.x, p.y, p.w, p.h);
	};
	scene.prims.forEach(p => {
		ctx.globalAlpha = p.opacity === undefined || isNaN(p.opacity) ? 1 : p.opacity;
		if (p.t === 'rect') {
			path(p);
			if (p.stroke) {
				ctx.strokeStyle = p.stroke;
				ctx.lineWidth = p.lw;
				ctx.setLineDash(p.dash ? [3, 2] : []);
				ctx.stroke();
				ctx.setLineDash([]);
			} else if (p.grad) {
				const g = p.grad.vertical ? ctx.createLinearGradient(0, p.y, 0, p.y + p.h) : ctx.createLinearGradient(p.x, 0, p.x + p.w, 0);
				p.grad.stops.forEach(s => g.addColorStop(s[0], s[1]));
				ctx.fillStyle = g;
				ctx.fill();
			} else {
				ctx.fillStyle = p.fill;
				ctx.fill();
			}
		} else {
			ctx.font = `${p.fontStyle} ${p.weight} ${p.size}px ${p.family}`;
			ctx.fillStyle = p.fill;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(p.text, p.x, p.y);
			if (p.deco.includes('underline') || p.deco.includes('overline')) {
				const w = ctx.measureText(p.text).width;
				ctx.fillRect(p.x - w / 2, p.deco.includes('underline') ? p.y + p.size * 0.45 : p.y - p.size * 0.55, w, Math.max(1, p.size / 14));
			}
		}
	});
	ctx.globalAlpha = 1;
	return canvas;
}
function sceneToSvg(scene, bg) {
	let defs = '';
	let body = '';
	let gi = 0;
	const num = v => Math.round(v * 100) / 100;
	if (bg) body += `  <rect width="${scene.w}" height="${scene.h}" fill="${escapeHtml(bg)}" />\n`;
	scene.prims.forEach(p => {
		const op = (p.opacity !== undefined && p.opacity < 1) ? ` opacity="${p.opacity}"` : '';
		if (p.t === 'rect') {
			let paint;
			if (p.stroke) {
				paint = `fill="none" stroke="${p.stroke}" stroke-width="${p.lw}"` + (p.dash ? ' stroke-dasharray="3 2"' : '');
			} else if (p.grad) {
				const id = 'g' + gi++;
				defs += `    <linearGradient id="${id}" x1="0" y1="0" x2="${p.grad.vertical ? 0 : 1}" y2="${p.grad.vertical ? 1 : 0}">\n` +
					p.grad.stops.map(s => `      <stop offset="${num(s[0])}" stop-color="${s[1]}" />\n`).join('') + '    </linearGradient>\n';
				paint = `fill="url(#${id})"`;
			} else {
				paint = `fill="${p.fill}"`;
			}
			body += `  <rect x="${num(p.x)}" y="${num(p.y)}" width="${num(p.w)}" height="${num(p.h)}" rx="${num(p.rad)}" ${paint}${op} />\n`;
		} else {
			const deco = p.deco && p.deco !== 'none' ? ` text-decoration="${p.deco}"` : '';
			body += `  <text x="${num(p.x)}" y="${num(p.y)}" text-anchor="middle" dominant-baseline="central" font-family="${escapeHtml(p.family)}" font-size="${p.size}" font-weight="${p.weight}" font-style="${p.fontStyle}" fill="${p.fill}"${deco}${op}>${escapeHtml(p.text)}</text>\n`;
		}
	});
	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${scene.w}" height="${scene.h}" viewBox="0 0 ${scene.w} ${scene.h}">\n` +
		(defs ? `  <defs>\n${defs}  </defs>\n` : '') + body + '</svg>\n';
}
function pageBackground() {
	return getComputedStyle(document.documentElement).getPropertyValue('--background-body').trim() || getComputedStyle(document.body).backgroundColor;
}
/** kind: 'png' | 'svg'; action: 'download' | 'copy' (svg only) */
function exportScene(scene, kind, action, baseName, bg, done) {
	if (!scene || scene.w <= 0 || scene.h <= 0) return;
	if (kind === 'svg') {
		const svg = sceneToSvg(scene, bg);
		if (action === 'copy') {
			copyText(svg, '✓ Copied SVG');
		} else {
			triggerDownload(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), baseName + '.svg');
			showToast('✓ Downloaded SVG: ' + baseName + '.svg');
		}
		if (done) done();
		return;
	}
	sceneToCanvas(scene, bg).toBlob(blob => {
		if (!blob) return;
		triggerDownload(blob, baseName + '.png');
		showToast('✓ Downloaded PNG: ' + baseName + '.png');
		if (done) done();
	}, 'image/png');
}
/** Export button: everything the gradient section shows right now */
function exportScreenImage(kind, baseName) {
	exportScene(screenScene(), kind, 'download', baseName, kind === 'png' ? pageBackground() : null, closeExportModal);
}

/* ───────────────────────── HTML / CSS export ───────────────────────── */

const SWATCH_CONTAINER_CLASS = 'spectrumstep-container';
const SWATCH_CLASS = 'spectrumstep-swatch';

/** colors as on screen: swatch color as background, or as text color in Background mode */
function swatchColors(hex) {
	return _backColor === undefined ? { bg: hex, fg: _textColor } : { bg: _backColor, fg: hex };
}
/** CSS shared by every exported swatch: text and alignment options (no contrast info is exported) */
function swatchBaseDecls() {
	const o = swatchOpts;
	return [
		['box-sizing', 'border-box'], ['display', 'flex'],
		['align-items', swatchAlign[o.vAlign]], ['justify-content', swatchJustify[o.hAlign]], ['text-align', o.hAlign],
		['border-radius', o.radius + 'px'],
		['font-family', o.fontFamily], ['font-size', o.fontSize + 'px'],
		['font-weight', o.fontWeight], ['font-style', o.fontStyle], ['text-decoration', o.textDecoration]
	];
}
const declBlock = (sel, decls) => sel + ' {\n' + decls.map(d => '  ' + d[0] + ': ' + d[1] + ';').join('\n') + '\n}';
const declInline = decls => decls.map(d => d[0] + ':' + d[1]).join(';');

/** spec: { container: decls, common: decls, items: [{ cls (or null), decls, text }] }; mode: 'inline' | 'style' | 'css' */
function exportHtmlBuild(mode, spec) {
	const single = spec.items.length === 1 && !spec.items[0].cls;
	if (mode === 'css') {
		const common = single ? spec.common.concat(spec.items[0].decls) : spec.common;
		let css = declBlock('.' + SWATCH_CONTAINER_CLASS, spec.container) + '\n\n' + declBlock('.' + SWATCH_CLASS, common);
		if (!single) spec.items.forEach(it => { css += '\n\n' + declBlock('.' + it.cls, it.decls); });
		return css;
	}
	if (mode === 'style') {
		return '<style>\n' + exportHtmlBuild('css', spec) + '\n</style>\n' +
			'<div class="' + SWATCH_CONTAINER_CLASS + '">\n' +
			spec.items.map(it => '  <div class="' + SWATCH_CLASS + (it.cls ? ' ' + it.cls : '') + '">' + escapeHtml(it.text) + '</div>\n').join('') + '</div>';
	}
	return '<div style="' + declInline(spec.container) + '">\n' +
		spec.items.map(it => '  <div style="' + declInline(spec.common.concat(it.decls)) + '">' + escapeHtml(it.text) + '</div>\n').join('') + '</div>';
}
/** one swatch (popup of a swatch) */
function specSingle(ex) {
	const c = swatchColors(ex.hex);
	return {
		container: [['width', ex.width + 'px'], ['height', ex.height + 'px']],
		common: [['width', '100%'], ['height', '100%']].concat(swatchBaseDecls()),
		items: [{ cls: null, decls: [['color', c.fg], ['background-color', c.bg]], text: swatchText(ex.hex) }]
	};
}
/** the discrete swatches: container with the user gap, sized like the palette on screen */
function specPalette() {
	const palette = document.querySelector('#tab-cmx [class*="color-palette-"]');
	const els = Array.from(document.querySelectorAll('#tab-cmx .color-step'));
	if (!palette || !els.length) return null;
	const vertical = gradientDirectionSwitch.value === 'down' || gradientDirectionSwitch.value === 'up';
	return {
		container: [['display', 'flex'], ['flex-direction', vertical ? 'column' : 'row'], ['gap', swatchOpts.gap + 'px'],
			['width', Math.round(palette.offsetWidth) + 'px'], ['height', Math.round(palette.offsetHeight) + 'px']],
		common: [['flex', '1 1 0'], ['min-width', '0'], ['min-height', '0']].concat(swatchBaseDecls()),
		items: els.map((el, i) => {
			const hex = hashHex(el.dataset.hex);
			const c = swatchColors(hex);
			return { cls: SWATCH_CLASS + '-' + (i + 1), decls: [['color', c.fg], ['background-color', c.bg]], text: swatchText(hex) };
		})
	};
}
/** the continuous gradient: fixed CSS gradient as background, text and alignment from the options */
function specGradient() {
	const grd = document.getElementById('grd-cmx');
	if (!grd || !currentGradient) return null;
	return {
		container: [['width', Math.round(grd.offsetWidth) + 'px'], ['height', Math.round(grd.offsetHeight) + 'px']],
		common: [['width', '100%'], ['height', '100%']].concat(swatchBaseDecls()),
		items: [{ cls: null, decls: [['color', _textColor || '#000000'], ['background', currentGradient.css]], text: swatchOpts.text }]
	};
}
/** what the gradient section shows now */
function specScreen() {
	const grd = document.getElementById('grd-cmx');
	return (grd && !grd.hidden) ? specGradient() : specPalette();
}
const exportHtmlKinds = {
	'html-inline': ['inline', 'html', 'HTML with inline CSS'],
	'html-style': ['style', 'html', 'HTML with <style>'],
	'css': ['css', 'css', 'swatch CSS']
};
/** copy or download an HTML/CSS export; baseName without extension */
function exportHtmlAction(spec, kind, action, baseName) {
	if (!spec) return false;
	const [mode, ext, label] = exportHtmlKinds[kind];
	const code = exportHtmlBuild(mode, spec);
	if (action === 'copy') {
		copyText(code, '✓ Copied ' + label);
	} else {
		triggerDownload(new Blob([code], { type: (ext === 'css' ? 'text/css' : 'text/html') + ';charset=utf-8' }), baseName + '.' + ext);
		showToast('✓ Downloaded ' + label);
	}
	return true;
}

/* ───────────────────────── Swatch popup ───────────────────────── */

var swatchExport = null;   // { hex, index, el, width, height } of the swatch the popup is open for

function swatchExportRefresh() {
	if (!swatchExport) return;
	const alphaEl = document.getElementById('swx-alpha');
	const f = swatchColorFormats(swatchExport.hex, alphaEl ? Number(alphaEl.value) : 0);
	f.cssvar = '--spectrum-' + (swatchExport.index + 1) + ': ' + swatchExport.hex + ';';
	document.querySelectorAll('#swatch-modal [data-fmt]').forEach(btn => {
		const value = f[btn.dataset.fmt];
		btn.dataset.value = value;
		btn.querySelector('.fmt-val').textContent = value;
		btn.dataset.tooltip = 'Copy ' + btn.querySelector('.fmt-name').textContent + ': ' + value;
	});
}
function openSwatchExport(hex, el) {
	hideTooltip();
	const modal = document.getElementById('swatch-modal');
	if (!modal) return;
	hex = hashHex(hex);
	const width = el ? Math.round(el.offsetWidth) : 160;
	const height = el ? Math.round(el.offsetHeight) : 100;
	swatchExport = { hex, index: el ? Number(el.dataset.index) || 0 : 0, el, width, height };
	document.getElementById('swx-chip').style.backgroundColor = hex;
	document.getElementById('swx-hex').textContent = hex;
	document.getElementById('swx-size').textContent = width + ' × ' + height + ' px';
	swatchExportRefresh();
	modal.classList.add('open');
}
function closeSwatchExport() {
	hideTooltip();
	const modal = document.getElementById('swatch-modal');
	if (modal) modal.classList.remove('open');
}
function initSwatchExport() {
	const modal = document.getElementById('swatch-modal');
	if (!modal) return;
	document.getElementById('swatch-modal-close')?.addEventListener('click', closeSwatchExport);
	modal.addEventListener('click', e => { if (e.target === modal) closeSwatchExport(); });

	const alpha = document.getElementById('swx-alpha');
	const alphaOut = document.getElementById('swx-alpha-value');
	if (alpha) alpha.addEventListener('input', () => {
		alphaOut.textContent = alpha.value + '%';
		swatchExportRefresh();
	});
	modal.querySelectorAll('[data-fmt]').forEach(btn => btn.addEventListener('click', () => {
		const value = btn.dataset.value;
		copyText(value, '✓ Copied ' + value);
		closeSwatchExport();
	}));
	modal.querySelectorAll('[data-export]').forEach(btn => btn.addEventListener('click', () => {
		if (!swatchExport) return;
		const kind = btn.dataset.export;
		const base = 'spectrumstep-swatch-' + swatchExport.hex.slice(1);
		if (kind === 'svg' || kind === 'png') {
			exportScene(sceneOf(swatchExport.el, [swatchExport.el]), kind, btn.dataset.action, base, null, closeSwatchExport);
			return;
		}
		exportHtmlAction(specSingle(swatchExport), kind, btn.dataset.action, base);
		closeSwatchExport();
	}));
}

/* ───────────────────────── Gradient (∞) popup ───────────────────────── */

var gradientExport = null;   // { css, el }

function openGradientExport(css, el) {
	hideTooltip();
	const modal = document.getElementById('gradient-modal');
	if (!modal) return;
	gradientExport = { css, el };
	document.getElementById('gx-chip').style.background = css;
	document.getElementById('gx-css').textContent = css;
	modal.classList.add('open');
}
function closeGradientExport() {
	hideTooltip();
	const modal = document.getElementById('gradient-modal');
	if (modal) modal.classList.remove('open');
}
function initGradientExport() {
	const modal = document.getElementById('gradient-modal');
	if (!modal) return;
	document.getElementById('gradient-modal-close')?.addEventListener('click', closeGradientExport);
	modal.addEventListener('click', e => { if (e.target === modal) closeGradientExport(); });
	modal.querySelectorAll('[data-gexport]').forEach(btn => btn.addEventListener('click', () => {
		if (!gradientExport) return;
		const kind = btn.dataset.gexport;
		if (kind === 'css') {
			copyColorStep(gradientExport.css, gradientExport.el);
			closeGradientExport();
			return;
		}
		exportScene(sceneOf(gradientExport.el, [gradientExport.el]), kind, btn.dataset.action, 'spectrumstep-gradient', null, closeGradientExport);
	}));
}

/* ───────────────────────── Export button popup: HTML of the whole gradient section ───────────────────────── */

function initPaletteHtmlExport() {
	document.querySelectorAll('#export-modal [data-pexport]').forEach(btn => btn.addEventListener('click', () => {
		const spec = specScreen();
		if (!spec) return;
		exportHtmlAction(spec, btn.dataset.pexport, btn.dataset.action, getExportFilename());
		closeExportModal();
	}));
}

function initSwatchModals() {
	initSwatchOptions();
	initSwatchExport();
	initGradientExport();
	initPaletteHtmlExport();
	document.addEventListener('keydown', e => {
		if (e.key === 'Escape') {
			closeOptionsModal();
			closeSwatchExport();
			closeGradientExport();
		}
	});
}
