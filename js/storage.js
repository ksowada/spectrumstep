/** this unit use LocalStorage of Browser
*/
function Storage(args) {

	// copy args into this
	for (var arg in args) {
		this[arg] = args[arg];
	}
	this.storageEn = (this.storageEn === undefined) ? false : this.storageEn; // storage is default disabled

	this.loadInit = function (args) {
		if (this.storageEn) {
			var settings = this.loadSettings() || {};
			var orderKey = this.unit + '-order';
			var order = [];
			try {
				order = JSON.parse(localStorage.getItem(orderKey)) || [];
			} catch (e) {
				order = [];
			}
			order = order.filter(function (n) { return settings[n] !== undefined; });
			for (var key in settings) {
				if (!order.includes(key)) {
					order.push(key);
				}
			}
			var lastSaved = localStorage.getItem(this.unit + '-last-saved');
			if (!lastSaved || settings[lastSaved] === undefined) {
				lastSaved = order.length > 0 ? order[order.length - 1] : null;
			}

			let html = '';
			if (order.length === 0) {
				html = '<option value="" disabled selected>No saved palettes</option>';
			} else {
				for (var i = 0; i < order.length; i++) {
					var setting = order[i];
					var isSelected = (setting === lastSaved) ? ' selected' : '';
					html += '<option value="' + setting + '"' + isSelected + '>' + setting + '</option>';
				}
			}

			this.inputLoadEl = document.getElementById(this.inputLoadId);
			if (this.inputLoadEl) {
				this.inputLoadEl.innerHTML = html;
				if (lastSaved && settings[lastSaved] !== undefined) {
					this.inputLoadEl.value = lastSaved;
				}
			}
			const btnLoadEl = document.getElementById(this.btnLoadId);
			if (btnLoadEl) {
				btnLoadEl.disabled = (order.length === 0);
				if (args && args.callback) btnLoadEl.onclick = args.callback;
			}
			const tips = (args && args.tooltips) || this.tooltips;
			if (tips) {
				if (tips.inputLoad && this.inputLoadEl) this.inputLoadEl.dataset.tooltip = tips.inputLoad;
				if (tips.btnLoad && btnLoadEl) btnLoadEl.dataset.tooltip = tips.btnLoad;
			}
		}
	}
	this.saveInit = function (args) {
		if (this.storageEn) {
			this.inputSaveEl = document.getElementById(this.inputSaveId);
			const btnSaveEl = document.getElementById(this.btnSaveId);
			if (args && args.callback) btnSaveEl.onclick = args.callback;
			const tips = (args && args.tooltips) || this.tooltips;
			if (tips) {
				if (tips.inputSave && this.inputSaveEl) this.inputSaveEl.dataset.tooltip = tips.inputSave;
				if (tips.btnSave && btnSaveEl) btnSaveEl.dataset.tooltip = tips.btnSave;
			}
		}
	}
	this.loadSettings = function (args) {
		try {
			var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
			return unitLoaded;
		} catch (e) {
			return null;
		}
	}
	this.saveSetting = function (args) {
		var name = (args && args.name) || (this.inputSaveEl ? this.inputSaveEl.value : null) || (document.getElementById(this.inputSaveId) ? document.getElementById(this.inputSaveId).value : null);
		if (!name || !name.trim()) return;
		name = name.trim();
		var unitLoaded = this.loadSettings();
		if (unitLoaded === null) {
			unitLoaded = {};
		}
		unitLoaded[name] = args.data;
		localStorage.setItem(this.unit, JSON.stringify(unitLoaded));

		var orderKey = this.unit + '-order';
		var order = [];
		try {
			order = JSON.parse(localStorage.getItem(orderKey)) || [];
		} catch (e) {
			order = [];
		}
		order = order.filter(function (n) { return n !== name; });
		order.push(name);
		localStorage.setItem(orderKey, JSON.stringify(order));
		localStorage.setItem(this.unit + '-last-saved', name);

		this.loadInit();
	}
	this.loadSetting = function (args) {
		var name = (args && args.name) || (this.inputLoadEl ? this.inputLoadEl.value : null) || (document.getElementById(this.inputLoadId) ? document.getElementById(this.inputLoadId).value : null);
		if (!name) return null;
		var unitLoaded = this.loadSettings();
		if (unitLoaded === null) return null;
		if (unitLoaded[name] === undefined) return null;
		return unitLoaded[name];
	}
	this.saveState = function (data) {
		if (!this.storageEn) return;
		localStorage.setItem(this.unit + '-state', JSON.stringify(data));
	}
	this.loadState = function () {
		if (!this.storageEn) return null;
		try {
			return JSON.parse(localStorage.getItem(this.unit + '-state'));
		} catch (e) {
			return null;
		}
	}
}