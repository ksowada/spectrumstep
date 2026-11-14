/**
 * ImagePicker – load a picture into a docked popup and click a pixel to set a color of the app.
 *
 * The image state lives only here and in the IndexedDB cache "spectrumstep-image".
 * It is never part of calcform_cmx_getState(): JSON export, presets, session state and URL stay free of it.
 *
 * Uses from spectrumstep.js: calcform_cmx_pick(), calcform_cmx_current(), showToast(), loadJsonFile(),
 * dockEnter() / dockLeave() / dockClosers, hideTooltip(); ButtonSelect / ButtonSwitch.
 */
class ImagePicker {
	constructor() {
		this.TARGETS = {
			c1: { label: 'Color 1', mark: '1' },
			c2: { label: 'Color 2', mark: '2' },
			text: { label: 'Text', mark: 'T' },
			back: { label: 'Back', mark: 'B' },
			page: { label: 'Page', mark: 'P' }
		};
		this.MAX_SIDE = 8192;          // canvas size limit: larger images are downscaled for display and sampling
		this.MAX_PIXELS = 36e6;
		this.ZOOM_MAX = 32;
		this.LOUPE_CELLS = 11;
		this.LOUPE_CELL_PX = 11;
		this.DB_NAME = 'spectrumstep-image';

		// kept in memory only
		this.target = 'c1';
		this.sample = 3;
		this.loupeOn = true;
		this.isOpen = false;

		// image state
		this.bitmap = null;
		this.off = null;               // offscreen canvas, the pixels are sampled here
		this.ctx = null;
		this.w = 0; this.h = 0;        // size of the decoded (possibly downscaled) bitmap
		this.origW = 0; this.origH = 0;
		this.title = '';
		this.blob = null;
		this.markers = {};             // target -> { x, y, hex }
		this.token = 0;                // guards against overlapping loads

		// view
		this.scale = 1; this.tx = 0; this.ty = 0;
		this.fitMode = true;
		this.ptrs = new Map();
		this.gesture = null;
		this.dragDepth = 0;
		this.dbPromise = null;
	}

	/* ───────────────────────── setup ───────────────────────── */

	init() {
		const $ = id => document.getElementById(id);
		this.btn = $('image-picker-btn');
		this.modal = $('image-modal');
		this.dialog = this.modal && this.modal.querySelector('.cmx-modal-dialog');
		if (!this.btn || !this.modal) return;
		this.tools = $('img-tools');
		this.drop = $('img-drop');
		this.stage = $('img-stage');
		this.canvas = $('img-canvas');
		this.checker = $('img-checker');
		this.markerLayer = $('img-markers');
		this.loupeEl = $('img-loupe');
		this.loupeCanvas = $('img-loupe-canvas');
		this.loupeHex = $('img-loupe-hex');
		this.loupeChip = $('img-loupe-chip');
		this.fileInput = $('img-file');
		this.titleEl = $('img-title-main');
		this.sizeEl = $('img-size');
		this.zoomBtn = $('img-zoom-btn');
		this.loupeBtn = $('img-loupe-btn');
		this.removeBtn = $('img-remove-btn');
		this.overlay = $('drop-overlay');
		this.lctx = this.loupeCanvas.getContext('2d');
		this.ready = true;

		this.btn.addEventListener('click', () => (this.isOpen ? this.close() : this.open()));
		$('image-modal-close').addEventListener('click', () => this.close());
		this.modal.addEventListener('click', e => { if (e.target === this.modal) this.close(); });
		this.removeBtn.addEventListener('click', () => this.remove());
		this.zoomBtn.addEventListener('click', () => this.fit());
		this.loupeBtn.addEventListener('click', () => {
			this.loupeOn = !this.loupeOn;
			this.loupeBtn.classList.toggle('selected', this.loupeOn);
			this.loupeBtn.setAttribute('aria-pressed', String(this.loupeOn));
			if (!this.loupeOn) this.hideLoupe();
		});

		this.targetSelect = new ButtonSelect($('img-target'), (id, el) => { if (el) this.target = el.dataset.target; }, {
			'img-target-c1': 'A pick sets Color 1',
			'img-target-c2': 'A pick sets Color 2',
			'img-target-text': 'A pick sets the custom text color for the contrast check',
			'img-target-back': 'A pick sets the custom back color for the contrast check',
			'img-target-page': 'A pick sets the page color'
		});
		this.targetSelect.setValue('img-target-c1', false);
		// sample size: one cycling button (1×1 → 3×3 → 5×5) saves room in the header
		const sizes = ['1×1', '3×3', '5×5'];
		this.sampleSwitch = new ButtonSwitch($('img-sample'), sizes, undefined, null, (text, idx) => {
			this.sample = [1, 3, 5][idx];
			this.refreshLoupe();
		}, {
			tooltips: [
				'Sample size 1×1: the single pixel under the pointer. Click for 3×3',
				'Sample size 3×3: average of 3×3 pixels around the pointer. Click for 5×5',
				'Sample size 5×5: average of 5×5 pixels around the pointer. Click for 1×1'
			]
		});
		this.sampleSwitch.setValue('3×3', true);

		// drop area
		const openFiles = () => this.fileInput.click();
		this.drop.addEventListener('click', openFiles);
		this.drop.addEventListener('keydown', e => {
			if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFiles(); }
		});
		['dragenter', 'dragover'].forEach(t => this.drop.addEventListener(t, () => this.drop.classList.add('dragover')));
		['dragleave', 'drop'].forEach(t => this.drop.addEventListener(t, () => this.drop.classList.remove('dragover')));
		this.fileInput.addEventListener('change', () => {
			const f = this.fileInput.files && this.fileInput.files[0];
			this.fileInput.value = '';
			if (f) this.loadFile(f, { open: true });
		});

		this.bindStage();
		this.bindGlobal();
		if (typeof ResizeObserver === 'function') {
			new ResizeObserver(() => this.onResize()).observe(this.stage);
		}
		this.setUiState();
		this.restore();
	}

	/* ───────────────────────── open / close ───────────────────────── */

	open() {
		if (this.isOpen) return;
		hideTooltip();
		if (typeof closeLoadModal === 'function') closeLoadModal();
		if (typeof closeExportModal === 'function') closeExportModal();
		if (typeof closeSwatchExport === 'function') closeSwatchExport();
		if (typeof closeGradientExport === 'function') closeGradientExport();
		this.isOpen = true;
		this.modal.classList.add('open');
		this.btn.classList.add('selected');
		this.btn.setAttribute('aria-pressed', 'true');
		dockEnter('image');
		this.refreshMarkers();
		this.onResize(true);
		(this.bitmap ? this.stage : this.drop).focus({ preventScroll: true });
	}

	/** hide the popup without touching the state (also used by the dock when the other popup opens) */
	hide() {
		if (!this.isOpen) return;
		this.isOpen = false;
		this.endGesture();
		this.modal.classList.remove('open');
		this.btn.classList.remove('selected');
		this.btn.setAttribute('aria-pressed', 'false');
		this.hideLoupe();
		dockLeave('image');
	}

	close() {
		if (!this.isOpen) return;
		hideTooltip();
		this.hide();
		this.btn.focus({ preventScroll: true });
	}

	/* ───────────────────────── loading ───────────────────────── */

	static isImageFile(file) {
		if (file.type) return file.type.startsWith('image/');
		return /\.(jpe?g|jfif|png|apng|gif|webp|avif|bmp|svg|ico|tiff?|heic|heif)$/i.test(file.name || '');
	}
	static isJsonFile(file) {
		return file.type === 'application/json' || /\.json$/i.test(file.name || '');
	}

	/** decode with EXIF orientation applied; images above the canvas limit are downscaled */
	async decode(blob) {
		const attempt = async opts => (opts ? createImageBitmap(blob, opts) : createImageBitmap(blob));
		let bmp;
		try {
			bmp = await attempt({ imageOrientation: 'from-image' });
		} catch (e) {
			try { bmp = await attempt(); } catch (e2) { bmp = await this.decodeViaImg(blob); }
		}
		const origW = bmp.width, origH = bmp.height;
		const k = Math.min(1, this.MAX_SIDE / Math.max(origW, origH), Math.sqrt(this.MAX_PIXELS / (origW * origH)));
		if (k < 1) {
			const rw = Math.max(1, Math.floor(origW * k)), rh = Math.max(1, Math.floor(origH * k));
			try {
				const small = await createImageBitmap(bmp, { resizeWidth: rw, resizeHeight: rh, resizeQuality: 'high' });
				bmp.close();
				bmp = small;
			} catch (e) {
				const c = document.createElement('canvas');
				c.width = rw; c.height = rh;
				c.getContext('2d').drawImage(bmp, 0, 0, rw, rh);
				bmp.close();
				bmp = await createImageBitmap(c);
			}
		}
		return { bitmap: bmp, origW, origH };
	}
	decodeViaImg(blob) {
		return new Promise((resolve, reject) => {
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.onload = () => { createImageBitmap(img).then(resolve, reject).finally(() => URL.revokeObjectURL(url)); };
			img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')); };
			img.src = url;
		});
	}

	/** replaces a loaded image without asking; a file that cannot be decoded keeps the old one */
	async loadFile(file, { open = true, title } = {}) {
		const token = ++this.token;
		let res;
		try {
			res = await this.decode(file);
		} catch (e) {
			showToast('Could not read image: ' + (file.name || 'image'));
			return false;
		}
		if (token !== this.token) { res.bitmap.close(); return false; }
		this.setImage(res, file, title || file.name || 'Image', {});
		this.persist();
		if (open) this.open();
		return true;
	}

	setImage(res, blob, title, markers) {
		this.release();
		this.bitmap = res.bitmap;
		this.w = res.bitmap.width; this.h = res.bitmap.height;
		this.origW = res.origW; this.origH = res.origH;
		this.blob = blob;
		this.title = title;
		this.markers = ImagePicker.cleanMarkers(markers, res.bitmap.width, res.bitmap.height);
		this.off = document.createElement('canvas');
		this.off.width = this.w; this.off.height = this.h;
		this.ctx = this.off.getContext('2d', { willReadFrequently: true });
		this.ctx.drawImage(this.bitmap, 0, 0);
		this.canvas.width = this.w; this.canvas.height = this.h;
		this.canvas.getContext('2d').drawImage(this.bitmap, 0, 0);
		this.fitMode = true;
		this.setUiState();
		this.onResize(true);
	}

	/** free the bitmap and the canvases of the current image */
	release() {
		if (this.bitmap) { try { this.bitmap.close(); } catch (e) { /* already closed */ } }
		this.bitmap = null;
		if (this.off) { this.off.width = 0; this.off.height = 0; }
		this.off = null; this.ctx = null;
		this.canvas.width = 0; this.canvas.height = 0;
		this.blob = null;
		this.markers = {};
		this.markerLayer.replaceChildren();
		this.hideLoupe();
	}

	remove() {
		this.token++;
		this.release();
		this.w = this.h = this.origW = this.origH = 0;
		this.title = '';
		this.setUiState();
		this.deleteRecord();
		hideTooltip();
		this.drop.focus({ preventScroll: true });
	}

	/** switch between the states "no image" and "image loaded" */
	setUiState() {
		const has = !!this.bitmap;
		this.tools.hidden = !has;
		this.removeBtn.hidden = !has;
		this.stage.hidden = !has;
		this.drop.hidden = has;
		this.sizeEl.textContent = has ? this.origW + ' × ' + this.origH : '';
		if (has) {
			this.titleEl.textContent = ImagePicker.middleTruncate(this.title, 24);
			this.titleEl.dataset.tooltip = this.title;
		} else {
			this.titleEl.textContent = 'Pick colors from an image';
			delete this.titleEl.dataset.tooltip;
		}
		this.btn.classList.toggle('has-image', has);
		this.refreshChips();
	}

	/** markers from the cache: keep only well-formed ones inside the image */
	static cleanMarkers(m, w, h) {
		const out = {};
		['c1', 'c2', 'text', 'back', 'page'].forEach(t => {
			const v = m && m[t];
			if (v && Number.isInteger(v.x) && Number.isInteger(v.y) && v.x >= 0 && v.y >= 0 && v.x < w && v.y < h
				&& typeof v.hex === 'string' && /^#[0-9a-f]{6}$/.test(v.hex)) out[t] = { x: v.x, y: v.y, hex: v.hex };
		});
		return out;
	}

	static middleTruncate(name, max) {
		if (name.length <= max) return name;
		const keep = max - 1;
		const tail = Math.ceil(keep / 2);
		const head = keep - tail;
		return name.slice(0, head) + '…' + name.slice(name.length - tail);
	}

	/* ───────────────────────── view: fit, zoom, pan ───────────────────────── */

	stageSize() { return { W: this.stage.clientWidth, H: this.stage.clientHeight }; }
	fitScale() {
		const { W, H } = this.stageSize();
		return (this.w && W && H) ? Math.min(W / this.w, H / this.h) : 1;
	}
	maxScale() { return Math.max(this.ZOOM_MAX, this.fitScale()); }

	fit() {
		if (!this.bitmap) return;
		const { W, H } = this.stageSize();
		if (!W || !H) return;
		this.fitMode = true;
		this.scale = this.fitScale();
		this.tx = (W - this.w * this.scale) / 2;
		this.ty = (H - this.h * this.scale) / 2;
		this.render();
	}

	onResize(force) {
		if (!this.bitmap || !this.isOpen) return;
		if (this.fitMode) this.fit();
		else { this.clampPan(); this.render(); }
	}

	/** the image can never be moved completely out of the stage */
	clampPan() {
		const { W, H } = this.stageSize();
		const iw = this.w * this.scale, ih = this.h * this.scale;
		const mx = Math.min(48, iw, W), my = Math.min(48, ih, H);
		this.tx = Math.min(W - mx, Math.max(mx - iw, this.tx));
		this.ty = Math.min(H - my, Math.max(my - ih, this.ty));
	}

	/** zoom to newScale, keeping the stage point (px, py) fixed */
	zoomAt(newScale, px, py) {
		const s = Math.min(this.maxScale(), Math.max(this.fitScale(), newScale));
		const k = s / this.scale;
		this.tx = px - (px - this.tx) * k;
		this.ty = py - (py - this.ty) * k;
		this.scale = s;
		this.fitMode = Math.abs(s - this.fitScale()) < 1e-6;
		if (this.fitMode) { this.fit(); return; }
		this.clampPan();
		this.render();
	}

	render() {
		if (!this.bitmap) return;
		const s = this.scale;
		this.canvas.style.transform = 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + s + ')';
		this.canvas.classList.toggle('pixelated', s * (window.devicePixelRatio || 1) > 1);
		const c = this.checker.style;
		c.left = this.tx + 'px'; c.top = this.ty + 'px';
		c.width = this.w * s + 'px'; c.height = this.h * s + 'px';
		const label = this.fitMode ? 'Fit image (now: whole image)' : 'Fit image (now: zoom ' + Math.round(s * 100) + '%)';
		this.zoomBtn.setAttribute('aria-label', label);
		this.zoomBtn.dataset.tooltip = label + '. Wheel or pinch zooms, keys + − 0';
		this.placeMarkers();
	}

	/** stage point of the pointer */
	stagePoint(e) {
		const r = this.stage.getBoundingClientRect();
		return { x: e.clientX - r.left, y: e.clientY - r.top };
	}
	/** natural image pixel under a stage point, or null outside the image */
	pixelAt(px, py) {
		const x = Math.floor((px - this.tx) / this.scale);
		const y = Math.floor((py - this.ty) / this.scale);
		return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? { x, y } : null;
	}

	/* ───────────────────────── sampling and picking ───────────────────────── */

	/** average of the n×n pixels around (x, y), clipped at the edges, fully transparent pixels skipped;
	 *  null when the hit pixel itself is fully transparent */
	sampleAt(x, y, n = this.sample) {
		if (!this.ctx || x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
		const r = (n - 1) / 2;
		const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r);
		const x1 = Math.min(this.w - 1, x + r), y1 = Math.min(this.h - 1, y + r);
		const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
		const d = this.ctx.getImageData(x0, y0, cw, ch).data;
		if (d[((y - y0) * cw + (x - x0)) * 4 + 3] === 0) return null;
		let sr = 0, sg = 0, sb = 0, cnt = 0;
		for (let i = 0; i < d.length; i += 4) {
			if (d[i + 3] === 0) continue;
			sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; cnt++;
		}
		const hx = v => ('0' + Math.round(v / cnt).toString(16)).slice(-2);
		return '#' + hx(sr) + hx(sg) + hx(sb);
	}

	pickAt(px, py) {
		const p = this.pixelAt(px, py);
		if (!p) return;
		const hex = this.sampleAt(p.x, p.y);
		if (!hex) return;   // transparent: ignored
		const t = this.target;
		this.markers[t] = { x: p.x, y: p.y, hex };
		calcform_cmx_pick(t, hex);
		showToast('✓ ' + this.TARGETS[t].label + ' → ' + hex);
		this.refreshMarkers();
		this.persist();
	}

	/* ───────────────────────── pointer input ───────────────────────── */

	bindStage() {
		const st = this.stage;
		st.addEventListener('wheel', e => {
			e.preventDefault();
			if (!this.bitmap) return;
			let dy = e.deltaY;
			if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= 400;
			const p = this.stagePoint(e);
			this.zoomAt(this.scale * Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015)), p.x, p.y);
			this.updateLoupeFrom(e);
		}, { passive: false });
		st.addEventListener('pointerdown', e => this.onDown(e));
		st.addEventListener('pointermove', e => this.onMove(e));
		st.addEventListener('pointerup', e => this.onUp(e));
		st.addEventListener('pointercancel', e => this.onCancel(e));
		st.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch' && !this.ptrs.size) this.hideLoupe(); });
		st.addEventListener('contextmenu', e => e.preventDefault());
	}

	onDown(e) {
		if (!this.bitmap) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		try { this.stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
		const p = this.stagePoint(e);
		this.ptrs.set(e.pointerId, { x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false, touch: e.pointerType === 'touch' });
		if (this.ptrs.size === 1) {
			this.gesture = { mode: 'single', cancelled: false, last: p };
			if (e.pointerType === 'touch' && this.loupeOn) { this.gesture.mode = 'aim'; this.updateLoupe(p.x, p.y, true); }
		} else if (this.ptrs.size === 2) {
			this.gesture.mode = 'pinch';
			this.gesture.cancelled = true;
			this.hideLoupe();
			this.stage.classList.remove('is-panning');
			this.pinchBase();
		}
	}

	pinchBase() {
		const [a, b] = [...this.ptrs.values()];
		this.gesture.dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
		this.gesture.cx = (a.x + b.x) / 2;
		this.gesture.cy = (a.y + b.y) / 2;
	}

	onMove(e) {
		if (!this.bitmap) return;
		const rec = this.ptrs.get(e.pointerId);
		const p = this.stagePoint(e);
		if (!rec) {   // hover
			if (e.pointerType !== 'touch') this.updateLoupe(p.x, p.y, false);
			return;
		}
		const g = this.gesture;
		if (g.mode === 'pinch' && this.ptrs.size === 2) {
			rec.x = p.x; rec.y = p.y;
			const [a, b] = [...this.ptrs.values()];
			const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
			const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
			const pan = !(a.touch && !this.loupeOn);   // pan and zoom, except touch without loupe: only zoom
			const oldS = this.scale;
			const ns = Math.min(this.maxScale(), Math.max(this.fitScale(), oldS * dist / g.dist));
			const k = ns / oldS;
			// the image point under the previous centre moves to the current centre
			this.tx = cx - (g.cx - this.tx) * k + (pan ? 0 : (g.cx - cx));
			this.ty = cy - (g.cy - this.ty) * k + (pan ? 0 : (g.cy - cy));
			this.scale = ns;
			this.fitMode = Math.abs(ns - this.fitScale()) < 1e-6;
			g.dist = dist; g.cx = cx; g.cy = cy;
			if (this.fitMode) this.fit(); else { this.clampPan(); this.render(); }
			return;
		}
		if (g.mode === 'aim') {
			rec.x = p.x; rec.y = p.y; g.last = p;
			this.updateLoupe(p.x, p.y, true);
			return;
		}
		if (g.mode === 'none') return;
		// single pointer: a tap picks, more than 4px moved pans
		if (!rec.moved && Math.hypot(p.x - rec.sx, p.y - rec.sy) >= 4) {
			rec.moved = true;
			this.stage.classList.add('is-panning');
			this.hideLoupe();
		}
		if (rec.moved) {
			this.tx += p.x - rec.x;
			this.ty += p.y - rec.y;
			rec.x = p.x; rec.y = p.y;
			this.fitMode = false;
			this.clampPan();
			this.render();
		} else if (e.pointerType !== 'touch') {
			this.updateLoupe(p.x, p.y, false);
		}
	}

	onUp(e) {
		const rec = this.ptrs.get(e.pointerId);
		if (!rec) return;
		const g = this.gesture;
		const p = this.stagePoint(e);
		this.ptrs.delete(e.pointerId);
		try { this.stage.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
		if (g.mode === 'pinch') {
			if (this.ptrs.size === 1) {
				// remaining finger: pans without loupe, does nothing with loupe; never picks
				const rest = [...this.ptrs.values()][0];
				if (rest.touch && !this.loupeOn) { g.mode = 'single'; rest.moved = true; this.stage.classList.add('is-panning'); }
				else g.mode = 'none';
			}
		} else if (g.mode === 'aim') {
			if (!g.cancelled) this.pickAt(p.x, p.y);
			this.hideLoupe();
		} else if (g.mode === 'single' && !rec.moved && !g.cancelled) {
			this.pickAt(p.x, p.y);
		}
		if (!this.ptrs.size) this.endGesture();
		else if (e.pointerType !== 'touch') this.hideLoupe();
	}

	onCancel(e) {
		this.ptrs.delete(e.pointerId);
		if (!this.ptrs.size) { this.endGesture(); this.hideLoupe(); }
		else if (this.gesture) { this.gesture.mode = 'none'; this.gesture.cancelled = true; }
	}

	endGesture() {
		this.ptrs.clear();
		this.gesture = null;
		if (this.stage) this.stage.classList.remove('is-panning');
	}

	/* ───────────────────────── loupe ───────────────────────── */

	hideLoupe() { if (this.loupeEl) this.loupeEl.hidden = true; this.loupePos = null; }
	updateLoupeFrom(e) { if (e.pointerType === undefined || e.pointerType !== 'touch') { const p = this.stagePoint(e); this.updateLoupe(p.x, p.y, false); } }
	refreshLoupe() { if (this.loupePos && !this.loupeEl.hidden) this.updateLoupe(this.loupePos.x, this.loupePos.y, this.loupePos.touch); }

	updateLoupe(px, py, touch) {
		if (!this.loupeOn || !this.bitmap) { this.loupeEl.hidden = true; return; }
		const pix = this.pixelAt(px, py);
		if (!pix) { this.loupeEl.hidden = true; return; }
		this.loupePos = { x: px, y: py, touch };
		const N = this.LOUPE_CELLS, C = this.LOUPE_CELL_PX, half = (N - 1) / 2;
		const L = this.lctx, size = N * C;
		L.imageSmoothingEnabled = false;
		L.fillStyle = '#7a7a7a';
		L.fillRect(0, 0, size, size);
		for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {   // checker for transparent areas
			if ((i + j) & 1) { L.fillStyle = '#a8a8a8'; L.fillRect(i * C, j * C, C, C); }
		}
		L.drawImage(this.off, pix.x - half, pix.y - half, N, N, 0, 0, size, size);
		const f = this.sample * C, f0 = half * C - (this.sample - 1) / 2 * C;
		L.lineWidth = 3; L.strokeStyle = '#000'; L.strokeRect(f0 + 0.5, f0 + 0.5, f - 1, f - 1);
		L.lineWidth = 1; L.strokeStyle = '#fff'; L.strokeRect(f0 + 0.5, f0 + 0.5, f - 1, f - 1);
		const hex = this.sampleAt(pix.x, pix.y);
		this.loupeHex.textContent = hex || 'transparent';
		this.loupeChip.style.background = hex || 'transparent';
		this.loupeEl.hidden = false;
		const { W, H } = this.stageSize();
		const w = this.loupeEl.offsetWidth, h = this.loupeEl.offsetHeight;
		let left, top;
		if (touch) {
			left = Math.min(W - w - 4, Math.max(4, px - w / 2));
			top = py - h - 36;
			if (top < 4) {
				top = Math.min(H - h - 4, Math.max(4, py - h / 2));
				left = (px + 36 + w <= W) ? px + 36 : px - 36 - w;
			}
		} else {
			left = px + 22; top = py + 22;
			if (left + w > W - 2) left = px - 22 - w;
			if (top + h > H - 2) top = py - 22 - h;
		}
		this.loupeEl.style.transform = 'translate(' + Math.round(Math.max(0, left)) + 'px,' + Math.round(Math.max(0, top)) + 'px)';
	}

	/* ───────────────────────── keys ───────────────────────── */

	onKey(e) {
		if (!this.isOpen) return;
		// an options / export / load / swatch popup on top of this one takes the keys
		if (document.querySelector('.cmx-modal-backdrop.open:not(#image-modal)')) return;
		if (e.key === 'Escape') { this.close(); return; }
		if (!this.bitmap || e.ctrlKey || e.metaKey || e.altKey) return;
		const t = e.target;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
		const { W, H } = this.stageSize();
		if (e.key === '+' || e.key === '=') { e.preventDefault(); this.zoomAt(this.scale * 1.25, W / 2, H / 2); }
		else if (e.key === '-' || e.key === '_') { e.preventDefault(); this.zoomAt(this.scale / 1.25, W / 2, H / 2); }
		else if (e.key === '0') { e.preventDefault(); this.fit(); }
	}

	/* ───────────────────────── markers ───────────────────────── */

	/** a marker disappears when its color was changed in the app by anything else than a pick */
	refreshMarkers() {
		if (!this.ready) return;
		let changed = false;
		Object.keys(this.markers).forEach(t => {
			if (calcform_cmx_current(t) !== this.markers[t].hex) { delete this.markers[t]; changed = true; }
		});
		this.refreshChips();
		if (this.bitmap) {
			this.markerLayer.replaceChildren(...Object.keys(this.markers).map(t => {
				const m = document.createElement('div');
				m.className = 'img-marker';
				m.dataset.t = t;
				const ring = document.createElement('span');
				ring.className = 'img-marker-ring';
				const lab = document.createElement('span');
				lab.className = 'img-marker-label';
				lab.textContent = this.TARGETS[t].mark;
				m.append(ring, lab);
				return m;
			}));
			this.placeMarkers();
		}
		if (changed) this.persist();
	}

	placeMarkers() {
		this.markerLayer.childNodes.forEach(m => {
			const mk = this.markers[m.dataset.t];
			if (!mk) return;
			m.style.transform = 'translate(' + (this.tx + (mk.x + 0.5) * this.scale) + 'px,' + (this.ty + (mk.y + 0.5) * this.scale) + 'px)';
		});
	}

	/** every target button shows its current color */
	refreshChips() {
		if (!this.ready) return;
		Object.keys(this.TARGETS).forEach(t => {
			// the button itself shows the color; its text turns dark on light colors and light on dark ones
			const btn = document.getElementById('img-target-' + t);
			if (!btn) return;
			const color = calcform_cmx_current(t);
			btn.style.background = color || '';
			btn.style.color = color ? (getThemeForColor(color) === 'light' ? '#000000' : '#ffffff') : '';
		});
	}

	/* ───────────────────────── global drop and paste ───────────────────────── */

	bindGlobal() {
		document.addEventListener('keydown', e => this.onKey(e), true);   // capture: runs before the other popups close themselves on Esc
		const hasFiles = e => e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files');
		document.addEventListener('dragenter', e => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			if (++this.dragDepth === 1) this.overlay.classList.add('show');
		});
		document.addEventListener('dragover', e => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		});
		document.addEventListener('dragleave', e => {
			if (!hasFiles(e)) return;
			if (--this.dragDepth <= 0) { this.dragDepth = 0; this.overlay.classList.remove('show'); }
		});
		document.addEventListener('drop', e => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			this.dragDepth = 0;
			this.overlay.classList.remove('show');
			const file = e.dataTransfer.files && e.dataTransfer.files[0];
			if (file) this.handleDropped(file);
		});
		window.addEventListener('blur', () => { this.dragDepth = 0; this.overlay.classList.remove('show'); });
		document.addEventListener('paste', e => {
			const items = e.clipboardData && e.clipboardData.items;
			if (!items) return;
			for (const it of items) {
				if (it.kind === 'file' && it.type.startsWith('image/')) {
					const f = it.getAsFile();
					if (!f) continue;
					e.preventDefault();
					const generic = !f.name || /^image\.(png|jpe?g|gif|webp)$/i.test(f.name);
					this.loadFile(f, { open: true, title: generic ? 'Pasted image' : f.name });
					return;
				}
			}
			// no image in the clipboard: leave the paste alone (text into inputs keeps working)
		});
	}

	/** the first dropped file decides */
	handleDropped(file) {
		if (ImagePicker.isImageFile(file)) this.loadFile(file, { open: true });
		else if (ImagePicker.isJsonFile(file)) loadJsonFile(file);
		else showToast('Unsupported file: ' + file.name);
	}

	/* ───────────────────────── IndexedDB cache ───────────────────────── */

	db() {
		if (!this.dbPromise) {
			this.dbPromise = new Promise(resolve => {
				try {
					if (!window.indexedDB) { resolve(null); return; }
					const rq = indexedDB.open(this.DB_NAME, 1);
					rq.onupgradeneeded = () => rq.result.createObjectStore('image');
					rq.onsuccess = () => resolve(rq.result);
					rq.onerror = () => resolve(null);
					rq.onblocked = () => resolve(null);
				} catch (e) { resolve(null); }
			});
		}
		return this.dbPromise;
	}
	async idb(mode, fn) {
		try {
			const db = await this.db();
			if (!db) return undefined;
			return await new Promise(resolve => {
				const t = db.transaction('image', mode);
				const rq = fn(t.objectStore('image'));
				t.oncomplete = () => resolve(rq ? rq.result : undefined);
				t.onerror = t.onabort = () => resolve(undefined);
			});
		} catch (e) { return undefined; }   // no cache, no error message
	}
	persist() {
		if (!this.blob) return;
		const rec = { blob: this.blob, title: this.title, markers: JSON.parse(JSON.stringify(this.markers)) };
		this.idb('readwrite', s => s.put(rec, 'current'));
	}
	deleteRecord() { this.idb('readwrite', s => s.delete('current')); }

	/** at app start: bring the cached image back without opening the popup */
	async restore() {
		const rec = await this.idb('readonly', s => s.get('current'));
		if (!rec || !(rec.blob instanceof Blob) || this.bitmap) return;
		const token = ++this.token;
		try {
			const res = await this.decode(rec.blob);
			if (token !== this.token) { res.bitmap.close(); return; }
			this.setImage(res, rec.blob, String(rec.title || 'Image'), rec.markers && typeof rec.markers === 'object' ? rec.markers : {});
			this.refreshMarkers();
		} catch (e) { /* unreadable cache entry: ignore */ }
	}
}
