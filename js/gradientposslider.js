/**
 * GradientPosSlider
 *
 * Interactive gradient bar unit styled similarly to native range sliders.
 * Features:
 * - Thin colored gradient track with native range track styling.
 * - Multiple selectable pos-points (knobs) representing swatches.
 * - Knobs are circular, matching the range slider thumb size and color.
 * - Knobs can be slid across the full extent of the gradient bar and can freely overtake one another.
 * - Displays the percentage position dynamically while moving.
 * - Marks Color 1 and Color 2 with a small label above for easy identification and export.
 * - Selectable pos-points with active focus/selection states and keyboard navigation.
 * - Integrated CSS linear-gradient export snippet.
 */
class GradientPosSlider {
	/**
	 * @param {string|HTMLElement} container
	 * @param {Object} [options]
	 * @param {Function} [options.onMove] Callback on knob drag: ({ index, pos, point, points }) => void
	 * @param {Function} [options.onSelect] Callback on knob selection: ({ index, point }) => void
	 * @param {Function} [options.onCopy] Callback on CSS gradient copy: (gradientCss) => void
	 */
	constructor(container, options = {}) {
		this.container = typeof container === 'string' ? document.getElementById(container) : container;
		if (!this.container) {
			throw new Error('GradientPosSlider: container element not found');
		}

		this.onMove = options.onMove || null;
		this.onSelect = options.onSelect || null;
		this.onCopy = options.onCopy || null;

		this.points = [];
		this.selectedIndex = null;
		this.activeDragIndex = null;
		this.gradientCss = '';
		this.direction = 'right';

		this._initDom();
		this._bindEvents();
	}

	_initDom() {
		this.container.innerHTML = '';
		this.container.classList.add('gradient-slider-container');

		this.unitEl = document.createElement('div');
		this.unitEl.className = 'gradient-slider-unit';

		// Track wrapper (provides padding for knob badges & percentage tooltips)
		this.trackWrap = document.createElement('div');
		this.trackWrap.className = 'gradient-slider-track-wrap';

		// Thin colored bar track
		this.trackEl = document.createElement('div');
		this.trackEl.className = 'gradient-slider-track';
		this.trackEl.dataset.tooltip = 'Click to copy CSS linear-gradient declaration to clipboard';

		// Knobs layer
		this.knobsLayer = document.createElement('div');
		this.knobsLayer.className = 'gradient-slider-knobs-layer';

		this.trackWrap.appendChild(this.trackEl);
		this.trackWrap.appendChild(this.knobsLayer);
		this.unitEl.appendChild(this.trackWrap);

		this.container.appendChild(this.unitEl);
	}

	_bindEvents() {
		// Click on track to copy CSS declaration
		this.trackEl.addEventListener('click', (e) => {
			if (e.target.closest('.gradient-slider-knob')) return;
			if (typeof this.onCopy === 'function') {
				this.onCopy(this.gradientCss, this.trackEl);
			}
		});
	}

	/**
	 * Sets and renders the points.
	 * @param {Array<{ index: number, pos: number, color: string, isC1?: boolean, isC2?: boolean, rel?: number }>} points
	 * @param {Object} [options]
	 */
	setPoints(points, options = {}) {
		this.points = points.map((p, i) => ({
			index: p.index !== undefined ? p.index : i,
			pos: Math.max(0, Math.min(1, p.pos !== undefined ? p.pos : (points.length > 1 ? i / (points.length - 1) : 0))),
			color: p.color || '#888888',
			isC1: Boolean(p.isC1),
			isC2: Boolean(p.isC2),
			rel: p.rel !== undefined ? p.rel : 0
		}));

		if (options.selectedIndex !== undefined) {
			this.selectedIndex = options.selectedIndex;
		}

		this._renderKnobs();
	}

	_renderKnobs() {
		this.knobsLayer.innerHTML = '';

		this.points.forEach((point, i) => {
			const knob = document.createElement('div');
			knob.className = 'gradient-slider-knob';
			if (point.isC1) knob.classList.add('is-c1');
			if (point.isC2) knob.classList.add('is-c2');
			if (this.selectedIndex === i) knob.classList.add('is-selected');

			knob.setAttribute('role', 'slider');
			knob.setAttribute('tabindex', '0');
			knob.setAttribute('aria-valuemin', '0');
			knob.setAttribute('aria-valuemax', '100');
			const pct = Math.round(point.pos * 100);
			knob.setAttribute('aria-valuenow', String(pct));
			const label = point.isC1 ? 'Color 1 position' : (point.isC2 ? 'Color 2 position' : `Swatch ${i + 1} position`);
			knob.setAttribute('aria-label', label);

			knob.style.left = `${(point.pos * 100).toFixed(2)}%`;

			// Percentage tooltip shown on move / hover / focus
			const tooltip = document.createElement('span');
			tooltip.className = 'gradient-knob-tooltip';
			tooltip.textContent = `${pct}%`;
			knob.appendChild(tooltip);

			// Drag and pointer interactions
			this._bindKnobInteractions(knob, i);

			this.knobsLayer.appendChild(knob);
		});
	}

	_bindKnobInteractions(knob, index) {
		const updateFromPointer = (e) => {
			const rect = this.trackEl.getBoundingClientRect();
			if (rect.width <= 0) return;
			let pos = (e.clientX - rect.left) / rect.width;
			pos = Math.max(0, Math.min(1, pos));

			this.points[index].pos = pos;
			knob.style.left = `${(pos * 100).toFixed(2)}%`;

			const pct = Math.round(pos * 100);
			knob.setAttribute('aria-valuenow', String(pct));
			const tooltip = knob.querySelector('.gradient-knob-tooltip');
			if (tooltip) {
				tooltip.textContent = `${pct}%`;
			}

			if (typeof this.onMove === 'function') {
				this.onMove({
					index: index,
					pos: pos,
					point: this.points[index],
					points: this.points
				});
			}
		};

		knob.addEventListener('pointerdown', (e) => {
			e.preventDefault();
			e.stopPropagation();

			this.activeDragIndex = index;
			this.selectedIndex = index;
			this._highlightSelected(index);

			knob.classList.add('is-dragging');
			knob.setPointerCapture(e.pointerId);

			if (typeof this.onSelect === 'function') {
				this.onSelect({ index, point: this.points[index] });
			}

			const onPointerMove = (moveEvt) => {
				if (this.activeDragIndex !== index) return;
				updateFromPointer(moveEvt);
			};

			const onPointerUp = (upEvt) => {
				if (this.activeDragIndex === index) {
					this.activeDragIndex = null;
					knob.classList.remove('is-dragging');
					try {
						knob.releasePointerCapture(upEvt.pointerId);
					} catch (_) {}
				}
				knob.removeEventListener('pointermove', onPointerMove);
				knob.removeEventListener('pointerup', onPointerUp);
				knob.removeEventListener('pointercancel', onPointerUp);
			};

			knob.addEventListener('pointermove', onPointerMove);
			knob.addEventListener('pointerup', onPointerUp);
			knob.addEventListener('pointercancel', onPointerUp);
		});

		// Keyboard navigation for accessibility
		knob.addEventListener('keydown', (e) => {
			let delta = 0;
			const step = e.shiftKey ? 0.05 : 0.01;
			if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
				delta = -step;
			} else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
				delta = step;
			} else if (e.key === 'Home') {
				delta = -this.points[index].pos;
			} else if (e.key === 'End') {
				delta = 1 - this.points[index].pos;
			} else {
				return;
			}

			e.preventDefault();
			const newPos = Math.max(0, Math.min(1, this.points[index].pos + delta));
			this.points[index].pos = newPos;
			knob.style.left = `${(newPos * 100).toFixed(2)}%`;

			const pct = Math.round(newPos * 100);
			knob.setAttribute('aria-valuenow', String(pct));
			const tooltip = knob.querySelector('.gradient-knob-tooltip');
			if (tooltip) {
				tooltip.textContent = `${pct}%`;
			}

			if (typeof this.onMove === 'function') {
				this.onMove({
					index: index,
					pos: newPos,
					point: this.points[index],
					points: this.points
				});
			}
		});

		knob.addEventListener('focus', () => {
			this.selectedIndex = index;
			this._highlightSelected(index);
			if (typeof this.onSelect === 'function') {
				this.onSelect({ index, point: this.points[index] });
			}
		});
	}

	_highlightSelected(index) {
		const knobs = this.knobsLayer.querySelectorAll('.gradient-slider-knob');
		knobs.forEach((k, i) => {
			if (i === index) {
				k.classList.add('is-selected');
			} else {
				k.classList.remove('is-selected');
			}
		});
	}

	/**
	 * Selects a point by index and highlights its knob.
	 * @param {number} index
	 */
	selectPoint(index) {
		this.selectedIndex = index;
		this._highlightSelected(index);
	}

	/**
	 * Updates the track CSS linear-gradient background and the text snippet.
	 * @param {string} gradientCss CSS linear-gradient expression
	 * @param {string} [direction='right'] Cardinal direction
	 */
	updateGradient(gradientCss, direction = 'right') {
		this.gradientCss = gradientCss;
		this.direction = direction;

		if (this.trackEl) {
			this.trackEl.style.background = gradientCss;
		}
		if (this.cssTextEl) {
			this.cssTextEl.textContent = gradientCss;
		}
	}

	/**
	 * Updates a single point's color and updates any associated attribute.
	 * @param {number} index
	 * @param {string} color
	 */
	setPointColor(index, color) {
		if (this.points[index]) {
			this.points[index].color = color;
		}
	}

	/**
	 * Returns current points array.
	 * @returns {Array<{ index: number, pos: number, color: string, isC1: boolean, isC2: boolean, rel: number }>}
	 */
	getPoints() {
		return this.points.map(p => ({ ...p }));
	}

	/**
	 * Returns current array of position numbers (0 to 1).
	 * @returns {number[]}
	 */
	getPositions() {
		return this.points.map(p => p.pos);
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = GradientPosSlider;
}
