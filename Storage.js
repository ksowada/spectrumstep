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
			if (this.loadCallBackName === undefined) this.loadCallBackName = args.callbackName;
			if (this.loadEl === undefined) this.loadEl = args.el;
			var html = '<form><div class="form-group">';
			html += '<label>Settings:</label>';
			html += '<input list="'+this.unit+'-load-datalist" id="'+this.unit+'-load-list" /><datalist id="'+this.unit+'-load-datalist">';
			var settings = this.loadSettings();
			for (var setting in settings) {
				html += '<option value="'+setting+'">'+setting+'</option>';
			}
			html += '</datalist>';
			html += '<a href="javascript:'+this.loadCallBackName+'()">Load</a>';
			html += '</div>';
			html += '</form>';
			document.getElementById(this.loadEl).innerHTML = html;
		}
	}
	this.saveInit = function (args) {
		if (this.storageEn) {
			if (this.saveCallBackName === undefined) this.saveCallBackName = args.callbackName;
			if (this.saveEl === undefined) this.saveEl = args.el;
			var html = '<form><div class="form-group">';
			html += '<label>Settings:</label>';
			html += '<input list="'+this.unit+'-save-datalist" id="'+this.unit+'-save-list" /><datalist id="'+this.unit+'-save-datalist">';
			var settings = this.loadSettings();
			for (var setting in settings) {
				html += '<option value="'+setting+'">'+setting+'</option>';
			}
			html += '</datalist>';
			html += '<a href="javascript:'+this.saveCallBackName+'()">Save</a>';
			html += '</div>';
			html += '</form>';
			document.getElementById(this.saveEl).innerHTML = html;
		}
	}
	this.loadSettings = function (args) {
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		return unitLoaded;
	}
	this.saveSetting = function (args) {
		var name = document.getElementById(this.unit+'-save-list').value;
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		if (unitLoaded===null) {
			unitLoaded = {};
		}
		unitLoaded[name] = args.data;
		localStorage.setItem(this.unit, JSON.stringify(unitLoaded));
		this.loadInit();
		this.saveInit();
	}
	this.loadSetting = function (args) {
		var name = document.getElementById(this.unit+'-load-list').value;
		var unitLoaded = JSON.parse(localStorage.getItem(this.unit));
		if (unitLoaded===null) return null;
		if (unitLoaded[name]===undefined) return null;
		return unitLoaded[name];
	}
}