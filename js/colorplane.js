/**
 * 2D Color Plane Popup for SpectrumStep
 * Opens directly below the selected color component row with the exact width
 * of the row's range slider and a fixed height that never overlaps the gradient swatches.
 */
(function () {
	var activeState = null; // { ix: number, fixedIdx: number, btn: HTMLButtonElement }
	var popupEl = null;
	var canvasEl = null;
	var markerEl = null;
	var axisXEl = null;
	var axisYEl = null;
	var isDragging = false;
	var channelBtns = [[], []];

	function getRemainingIndices(fixedIdx) {
		if (fixedIdx === 0) return [1, 2];
		if (fixedIdx === 1) return [0, 2];
		return [0, 1];
	}

	function getChannelLabel(mode, idx) {
		var m = mode || 'HSL';
		if (typeof channelLabelsForMode !== 'undefined' && channelLabelsForMode[m]) {
			return channelLabelsForMode[m][idx];
		}
		return m.charAt(idx);
	}

	function ensurePopupDom() {
		if (popupEl) return popupEl;
		popupEl = document.createElement('div');
		popupEl.id = 'cmx-color-plane-popup';
		popupEl.className = 'color-plane-popup';
		popupEl.setAttribute('role', 'dialog');
		popupEl.setAttribute('aria-label', '2D Color Plane Picker');

		canvasEl = document.createElement('canvas');
		canvasEl.className = 'color-plane-canvas';
		popupEl.appendChild(canvasEl);

		axisXEl = document.createElement('span');
		axisXEl.className = 'color-plane-axis color-plane-axis-x';
		popupEl.appendChild(axisXEl);

		axisYEl = document.createElement('span');
		axisYEl.className = 'color-plane-axis color-plane-axis-y';
		popupEl.appendChild(axisYEl);

		markerEl = document.createElement('div');
		markerEl.className = 'color-plane-marker';
		popupEl.appendChild(markerEl);

		document.body.appendChild(popupEl);

		popupEl.addEventListener('pointerdown', function (e) {
			if (e.button !== undefined && e.button !== 0) return;
			e.preventDefault();
			if (typeof hideTooltip === 'function') hideTooltip();
			isDragging = true;
			if (popupEl.setPointerCapture && e.pointerId !== undefined) {
				try {
					popupEl.setPointerCapture(e.pointerId);
				} catch (_) {}
			}
			pickColorFromEvent(e);
		});

		window.addEventListener('pointermove', function (e) {
			if (!isDragging || !activeState) return;
			e.preventDefault();
			pickColorFromEvent(e);
		});

		window.addEventListener('pointerup', function (e) {
			if (!isDragging) return;
			isDragging = false;
			if (popupEl && popupEl.releasePointerCapture && e.pointerId !== undefined) {
				try {
					popupEl.releasePointerCapture(e.pointerId);
				} catch (_) {}
			}
		});

		window.addEventListener('pointercancel', function () {
			isDragging = false;
		});

		document.addEventListener('pointerdown', function (e) {
			if (!activeState || !popupEl) return;
			if (popupEl.contains(e.target)) return;
			if (e.target.closest && e.target.closest('.channel-plane-btn')) return;
			var activeRowId = combineToId([inp_cmx_ids[activeState.ix], hslKeys[activeState.fixedIdx], 'row']);
			var activeRowEl = document.getElementById(activeRowId);
			if (activeRowEl && activeRowEl.contains(e.target)) return;
			closeColorPlane();
		});

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && activeState) {
				closeColorPlane();
			}
		});

		window.addEventListener('resize', function () {
			if (activeState) {
				positionAndRenderColorPlane();
			}
		});

		return popupEl;
	}

	function getNormalizedChannels(ix) {
		var mode = colMode[ix] || 'HSL';
		var mins = (typeof rangeMinForMode !== 'undefined' && rangeMinForMode[mode]) ? rangeMinForMode[mode] : [0, 0, 0];
		var maxes = rangeMaxForMode[mode];
		var factors = factorForMode[mode];
		var norm = [0, 0, 0];
		for (var i = 0; i < 3; i++) {
			var val;
			if (hsl[ix] && hsl[ix][i] !== undefined && !isNaN(hsl[ix][i])) {
				val = hsl[ix][i] * factors[i];
			} else {
				val = inp_cmx_arr[ix].get(hslKeys[i]);
			}
			var span = maxes[i] - mins[i];
			norm[i] = span > 0 ? bound((val - mins[i]) / span, 0, 1) : 0;
		}
		return norm;
	}

	function computeFixedPlaneHeight(ix) {
		var lRow0 = document.getElementById(inp_cmx_ids[0] + '-l-row');
		var lRow1 = document.getElementById(inp_cmx_ids[1] + '-l-row');
		var tabEl = document.getElementById('tab-cmx');
		if (!tabEl) return 150;

		var tabRect = tabEl.getBoundingClientRect();
		var refRow = document.getElementById(inp_cmx_ids[ix] + '-l-row') || lRow1 || lRow0;
		var lowestBottom = refRow ? refRow.getBoundingClientRect().bottom : 0;
		if (lRow0 && lRow1) {
			lowestBottom = Math.max(lRow0.getBoundingClientRect().bottom, lRow1.getBoundingClientRect().bottom);
		}
		var gap = 6;
		var available = Math.floor(tabRect.top - lowestBottom - gap);
		return Math.max(72, available);
	}

	function positionAndRenderColorPlane() {
		if (!activeState) return;
		ensurePopupDom();

		var ix = activeState.ix;
		var fixedIdx = activeState.fixedIdx;
		var rangeId = combineToId([inp_cmx_ids[ix], hslKeys[fixedIdx], 'range']);
		var rowId = combineToId([inp_cmx_ids[ix], hslKeys[fixedIdx], 'row']);
		var rangeEl = document.getElementById(rangeId);
		var rowEl = document.getElementById(rowId);
		if (!rangeEl || !rowEl) return;

		var rangeRect = rangeEl.getBoundingClientRect();
		var rowRect = rowEl.getBoundingClientRect();
		var width = Math.max(80, Math.round(rangeRect.width));
		var height = computeFixedPlaneHeight(ix);

		var left = Math.round(rangeRect.left + window.scrollX);
		var top = Math.round(rowRect.bottom + window.scrollY);

		popupEl.style.width = width + 'px';
		popupEl.style.height = height + 'px';
		popupEl.style.left = left + 'px';
		popupEl.style.top = top + 'px';

		renderColorPlaneCanvas(width, height);
		updateMarkerAndLabels();
	}

	function renderColorPlaneCanvas(width, height) {
		if (!activeState || !canvasEl) return;
		var ix = activeState.ix;
		var fixedIdx = activeState.fixedIdx;
		var mode = colMode[ix] || 'HSL';
		var rem = getRemainingIndices(fixedIdx);
		var xIdx = rem[0];
		var yIdx = rem[1];

		var mins = (typeof rangeMinForMode !== 'undefined' && rangeMinForMode[mode]) ? rangeMinForMode[mode] : [0, 0, 0];
		var maxes = rangeMaxForMode[mode];
		var factors = factorForMode[mode];

		var norm = getNormalizedChannels(ix);
		var fixedNorm = norm[fixedIdx];

		if (canvasEl.width !== width || canvasEl.height !== height) {
			canvasEl.width = width;
			canvasEl.height = height;
		}

		var ctx = canvasEl.getContext('2d');
		var imgData = ctx.createImageData(width, height);
		var data = imgData.data;

		var u = [0, 0, 0];
		u[fixedIdx] = (mins[fixedIdx] + fixedNorm * (maxes[fixedIdx] - mins[fixedIdx])) / factors[fixedIdx];

		var wDenom = width > 1 ? width - 1 : 1;
		var hDenom = height > 1 ? height - 1 : 1;
		var ptr = 0;

		var minX = mins[xIdx], spanX = maxes[xIdx] - mins[xIdx], facX = factors[xIdx];
		var minY = mins[yIdx], spanY = maxes[yIdx] - mins[yIdx], facY = factors[yIdx];

		for (var py = 0; py < height; py++) {
			var normY = 1 - py / hDenom;
			u[yIdx] = (minY + normY * spanY) / facY;
			for (var px = 0; px < width; px++) {
				var normX = px / wDenom;
				u[xIdx] = (minX + normX * spanX) / facX;

				var rgbArr;
				if (mode === 'RGB') {
					rgbArr = [
						Math.round(u[0]),
						Math.round(u[1]),
						Math.round(u[2])
					];
				} else {
					rgbArr = colorConvertToRgb(mode, u);
				}

				data[ptr++] = rgbArr[0];
				data[ptr++] = rgbArr[1];
				data[ptr++] = rgbArr[2];
				data[ptr++] = 255;
			}
		}

		ctx.putImageData(imgData, 0, 0);
	}

	function updateMarkerAndLabels() {
		if (!activeState || !markerEl) return;
		var ix = activeState.ix;
		var fixedIdx = activeState.fixedIdx;
		var mode = colMode[ix] || 'HSL';
		var rem = getRemainingIndices(fixedIdx);
		var xIdx = rem[0];
		var yIdx = rem[1];

		var norm = getNormalizedChannels(ix);
		var normX = norm[xIdx];
		var normY = norm[yIdx];

		markerEl.style.left = (normX * 100).toFixed(2) + '%';
		markerEl.style.top = ((1 - normY) * 100).toFixed(2) + '%';
		markerEl.style.backgroundColor = rgbCorrect(rgbh[ix] || '#000000');

		if (axisXEl) {
			axisXEl.textContent = getChannelLabel(mode, xIdx) + ' \u2192';
		}
		if (axisYEl) {
			axisYEl.textContent = '\u2191 ' + getChannelLabel(mode, yIdx);
		}
	}

	function pickColorFromEvent(e) {
		if (!activeState || !canvasEl) return;
		var rect = canvasEl.getBoundingClientRect();
		if (rect.width <= 0 || rect.height <= 0) return;

		var normX = bound((e.clientX - rect.left) / rect.width, 0, 1);
		var normY = bound(1 - (e.clientY - rect.top) / rect.height, 0, 1);

		var ix = activeState.ix;
		var fixedIdx = activeState.fixedIdx;
		var mode = colMode[ix] || 'HSL';
		var rem = getRemainingIndices(fixedIdx);
		var xIdx = rem[0];
		var yIdx = rem[1];

		var mins = (typeof rangeMinForMode !== 'undefined' && rangeMinForMode[mode]) ? rangeMinForMode[mode] : [0, 0, 0];
		var minX = mins[xIdx];
		var minY = mins[yIdx];
		var maxX = rangeMaxForMode[mode][xIdx];
		var maxY = rangeMaxForMode[mode][yIdx];
		var roundX = roundForMode[mode][xIdx];
		var roundY = roundForMode[mode][yIdx];

		var valX = round(minX + normX * (maxX - minX), roundX);
		var valY = round(minY + normY * (maxY - minY), roundY);

		inp_cmx_arr[ix].set(hslKeys[xIdx], valX);
		inp_cmx_arr[ix].set(hslKeys[yIdx], valY);

		calcform_cmx_hsl(ix);
		updateMarkerAndLabels();
	}

	function openColorPlane(ix, fixedIdx, btn) {
		ensurePopupDom();
		if (activeState && activeState.btn) {
			activeState.btn.classList.remove('selected');
			activeState.btn.setAttribute('aria-expanded', 'false');
		}
		activeState = { ix: ix, fixedIdx: fixedIdx, btn: btn };
		if (btn) {
			btn.classList.add('selected');
			btn.setAttribute('aria-expanded', 'true');
		}
		popupEl.classList.add('show');
		positionAndRenderColorPlane();
	}

	function closeColorPlane() {
		if (activeState && activeState.btn) {
			activeState.btn.classList.remove('selected');
			activeState.btn.setAttribute('aria-expanded', 'false');
		}
		activeState = null;
		isDragging = false;
		if (popupEl) {
			popupEl.classList.remove('show');
		}
	}

	function toggleColorPlane(ix, fixedIdx, btn) {
		if (activeState && activeState.ix === ix && activeState.fixedIdx === fixedIdx) {
			closeColorPlane();
		} else {
			openColorPlane(ix, fixedIdx, btn);
		}
	}

	function initColorPlaneButtons() {
		var rowSuffixes = ['-h-row', '-s-row', '-l-row'];
		inp_cmx_ids.forEach(function (id, ix) {
			channelBtns[ix] = [];
			rowSuffixes.forEach(function (suffix, i) {
				var row = document.getElementById(id + suffix);
				if (!row || !row.cells[0]) return;
				var firstCell = row.cells[0];
				firstCell.innerHTML = '';
				delete firstCell.dataset.tooltip;

				var btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 'status-btn channel-plane-btn';
				btn.setAttribute('aria-expanded', 'false');
				btn.textContent = getChannelLabel(colMode[ix], i);
				btn.addEventListener('click', function (e) {
					e.stopPropagation();
					toggleColorPlane(ix, i, btn);
				});

				firstCell.appendChild(btn);
				channelBtns[ix][i] = btn;
			});
			updateColorPlaneButtons(ix);
		});
	}

	function updateColorPlaneButtons(ix) {
		var mode = colMode[ix] || 'HSL';
		var tips = channelTooltipsForMode[mode];
		for (var i = 0; i < 3; i++) {
			var btn = channelBtns[ix] && channelBtns[ix][i];
			if (!btn) continue;
			var label = getChannelLabel(mode, i);
			var rem = getRemainingIndices(i);
			var xLabel = getChannelLabel(mode, rem[0]);
			var yLabel = getChannelLabel(mode, rem[1]);
			btn.textContent = label;
			var baseTip = (tips && tips[i] && tips[i].name) ? tips[i].name : label;
			btn.dataset.tooltip = baseTip + '. Click to fix ' + label + ' and pick ' + xLabel + ' (X) & ' + yLabel + ' (Y) on a 2D color plane.';
			if (typeof updateActiveTooltip === 'function') {
				updateActiveTooltip(btn);
			}
		}
		if (activeState && activeState.ix === ix) {
			positionAndRenderColorPlane();
		}
	}

	function refreshActiveColorPlane(ix) {
		if (!activeState) return;
		if (ix !== undefined && activeState.ix !== ix) return;
		if (isDragging) {
			updateMarkerAndLabels();
		} else if (canvasEl && canvasEl.width > 0 && canvasEl.height > 0) {
			renderColorPlaneCanvas(canvasEl.width, canvasEl.height);
			updateMarkerAndLabels();
		} else {
			positionAndRenderColorPlane();
		}
	}

	window.initColorPlaneButtons = initColorPlaneButtons;
	window.updateColorPlaneButtons = updateColorPlaneButtons;
	window.refreshActiveColorPlane = refreshActiveColorPlane;
	window.closeColorPlane = closeColorPlane;
})();
