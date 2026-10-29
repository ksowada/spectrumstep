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
			let html = ''
			var settings = this.loadSettings();
			for (var setting in settings) {
				html += '<option value="'+setting+'">'+setting+'</option>';
			}
			this.inputLoadEl = document.getElementById(this.inputLoadId)
			this.inputLoadEl.innerHTML = html
			const btnLoadEl = document.getElementById(this.btnLoadId)
			if (args && args.callback) btnLoadEl.onclick = args.callback
			const tips = (args && args.tooltips) || this.tooltips
			if (tips) {
				if (tips.inputLoad && this.inputLoadEl) this.inputLoadEl.dataset.tooltip = tips.inputLoad
				if (tips.btnLoad && btnLoadEl) btnLoadEl.dataset.tooltip = tips.btnLoad
			}
		}
	}
	this.saveInit = function (args) {
		if (this.storageEn) {
			this.inputSaveEl = document.getElementById(this.inputSaveId)
			const btnSaveEl = document.getElementById(this.btnSaveId)
			if (args && args.callback) btnSaveEl.onclick = args.callback
			const tips = (args && args.tooltips) || this.tooltips
			if (tips) {
				if (tips.inputSave && this.inputSaveEl) this.inputSaveEl.dataset.tooltip = tips.inputSave
				if (tips.btnSave && btnSaveEl) btnSaveEl.dataset.tooltip = tips.btnSave
			}
		}
	}
	this.loadSettings = function (args) {
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		return unitLoaded;
	}
	this.saveSetting = function (args) {
		var name = document.getElementById(this.inputSaveId).value;
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		if (unitLoaded===null) {
			unitLoaded = {};
		}
		unitLoaded[name] = args.data;
		localStorage.setItem(this.unit, JSON.stringify(unitLoaded));
		this.loadInit();
	}
	this.loadSetting = function (args) {
		var name = document.getElementById(this.inputLoadId).value;
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		if (unitLoaded===null) return null;
		if (unitLoaded[name]===undefined) return null;
		return unitLoaded[name];
	}
}