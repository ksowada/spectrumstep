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
			if (args && args.callback) document.getElementById(this.btnLoadId).onclick = args.callback
		}
	}
	this.saveInit = function (args) {
		if (this.storageEn) {
			this.inputSaveEl = document.getElementById(this.inputSaveId)
			document.getElementById(this.btnSaveId).onclick = args.callback
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