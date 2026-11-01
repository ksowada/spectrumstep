/** this unit represents a table of unit input 
 *  - it has following cells:
 * 		- name
 * 		- range
 * 		- value
 * 		- unit
 *  - give following args
 * 		- param
 * 		- el 			this is a div id
 * 		- callbackName called when value changes, give following args (callbackArgs: used for ix for multiple instances of table, true when range input changes)
*/
function InputHtml(args) {

  // copy args into this
  for (var arg in args) {
    this[arg] = args[arg];
  }
  if (args.params) {
    this.params = JSON.parse(JSON.stringify(args.params));
  }
  this.callbackArgs = (this.callbackArgs === undefined) ? undefined : this.callbackArgs;
  this.storageEn = (this.storageEn === undefined) ? false : this.storageEn; // storage is default disabled

  /** init module and print out HTML  */
  this.init = function () {
    var html = '<table class="inputs"><tbody>';
    var callAtInit = (this.callAtInit === undefined) ? 'true' : this.callAtInit;
    for (var varName in this.params) {
      var param = this.params[varName];
      param.name = (param.name === undefined) ? '' : param.name;
      param.type = (param.type === undefined) ? 'number' : param.type;
      param.step = (param.step === undefined) ? '1' : param.step;
      param.rangeStep = (param.rangeStep === undefined) ? param.step : param.rangeStep;
      param.unit = (param.unit === undefined) ? '' : param.unit;
      param.value = (param.value === undefined) ? '' : param.value;// this.storageGet(varName,param); // change only if given from storage, uses array if unit is also array
      param.class = (param.class === undefined) ? '' : param.class;
      html += '<tr id="' + combineToId([this.el, varName, 'row']) + '" class="'+param.type+' '+param.class+'">';

      var html_name = '<td class="form-name">' + param.name + '</td>';
      var html_unit = '<td class="form-unit">' + param.unit + '</td>';
      var html_range = '<td></td>';

      var callbackName = (param.callbackName !== undefined) ? param.callbackName : this.callbackName;
      var html_oninput = this.obj + '.inputCall(' + callbackName + ',' + this.callbackArgs + ',\'' + varName+'\'' + ',\'' + param.type+'\'';
      if (param.dir=='output') {
        html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-control" readonly="readonly" value="' + param.value + '"/></td>' + html_unit;
      } else {
        switch (param.type) {
          case 'number':
            if (param.min !== undefined) {
              html_range = '<td class="form-value"><input id="' + combineToId([this.el, varName, 'range']) + '" class="form-control" type="range" step="' + param.rangeStep + '" value="' + param.value + '" min="' + param.min + '" max="' + param.max + '" oninput="'+html_oninput+',true)"/></td>';
            }
            html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-control" type="number" step="' + param.step + '" value="' + param.value + '" oninput="'+html_oninput+',false)"/></td>' + html_unit;
            break;
          case 'text':
            html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-control" value="' + param.value + '" onchange="'+html_oninput+',false)"/></td>' + html_unit;
            break;
          case 'color':
            param.value = rgbCorrect(param.value);
            html_range = '<td class="form-value color"><input id="' + combineToId([this.el, varName, 'range']) + '" class="form-control" type="color" value="' + param.value + '"/></td>';
            html += html_name + html_range + '<td class="form-value color"><input id="' + combineToId([this.el, varName]) + '" type="text" class="form-control" value="' + param.value + '" autocomplete="off" spellcheck="false"/></td>' + html_unit;
            break;
          case 'button':
          case 'popup':
              html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-button trigger" type="button" value="' + param.value + '" onclick="'+html_oninput+',false)"/></td>' + html_unit;
              break;
          case 'range':
            html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-control" type="range" step="' + param.step + '" value="' + param.value + '" min="' + param.min + '" max="' + param.max + '" oninput="'+html_oninput+',false)"/></td>' + html_unit;
            break;
          case 'checkbox':
            html_checked =  (param.value) ? 'checked="checked" ' : '';
            html += '<td colspan="4"><input id="' + combineToId([this.el, varName]) + '" class="form-check-input" type="checkbox" '+html_checked+' oninput="'+html_oninput+',false)"/><label class="form-check-label">'+param.name+'</label></td>';
            break;
          case 'output':
            html += html_name + html_range + '<td class="form-value"><input id="' + combineToId([this.el, varName]) + '" class="form-control" readonly="readonly" value="' + param.value + '" /></td>' + html_unit;
            break;
          case 'select':
            html += html_name + '<td class="form-value" colspan="2"><select id="' + combineToId([this.el, varName]) + '" class="form-control" oninput="'+html_oninput+',false)">';
            for (var i in param.values) {
              html += '<option>' + param.values[i] + '</option>';
            }
            html += '</select></td>' + html_unit;
            break;
          case 'place':
            html += html_name + html_range + '<td></td><td></td>' + html_unit; 
            break;
          case 'empty':
            html += '<td colspan="4" class="empty"></td>'
        }
      }
      html += '</tr>';
    }
    html += '</tbody>';
    html += '</table>';
    document.getElementById(this.el).innerHTML = html;

    // add a function to calling obj to remember if it was range Input
    // handle when obj is array
    if (this.obj.endsWith(']')) {
      var arrIx = this.obj.indexOf('[');
      var objName = this.obj.substr(0, arrIx);
      var objIx = this.obj.substr(arrIx+1, 1);
      window[objName][objIx]['inputCall'] = this.clickEvent;
    } else {
      window[this.obj]['inputCall'] = this.clickEvent;
    }

    for (var k in this.params) {
      var tip = (this.tooltips && this.tooltips[k]) || this.params[k].tooltip;
      if (tip) {
        this.setTooltip(k, tip);
      }
    }

    for (var cp in this.params) {
      if (this.params[cp].type === 'color') {
        this.bindColorEvents(cp);
      }
    }
  }
  this.clickEvent = function (callbackName, callbackArgs, varName, paramtype, rangeInput) {
    callbackName = callbackName.name;
    this.rangeInput = rangeInput; // just a bit to remember if it was range Input
    window[callbackName](callbackArgs);
    if (paramtype=='popup') {
      var html_popup = '<div id="'+combineToId([this.el, varName,'modal'])+'" class="modal show-modal"><div class="modal-content"><span class="close-button">&times;</span><h1>Hello, I am a popup!</h1></div></div>';
      document.getElementById(combineToId([this.el])).insertAdjacentHTML('afterend', html_popup);
      var closeButton = document.querySelector(".close-button");
      closeButton.addEventListener("click", this.toggleModal.bind(this));
      window.addEventListener("click", this.windowOnClick.bind(this)); 
    }
    this.rangeInput = false;
  }
  this.toggleModal = function ()  {
    document.querySelector(".modal").remove();
  }
  this.windowOnClick = function (event)  {
    var modal = document.querySelector(".modal");
    if (event.target === modal) {
      this.toggleModal();
    }
  }
  this.getText = function (varName) {
    var param = this.params[varName];
    param.value = document.getElementById(combineToId([this.el, varName])).value;
    return param.value;
  }
  this.getIns = function (ins) {
    var i = {};
    for (var ix in ins) {
      i[ins[ix]] = this.get(ins[ix]);
    }
    return i;
  }
  this.setOuts = function (outs,i) {
    for (var ix in outs) {
      this.set(outs[ix],i[outs[ix]]);
    }
    return i;
  }
  this.getInsAuto = function (ins) {
    var x = {};
    for (var varName in this.params) {
      var param = this.params[varName];
      if (param.dir !== 'output') {
        x[varName] = this.get(varName);
      }
    }
    return x;
  }
  this.getAuto = function (ins) {
    var x = {};
    for (var varName in this.params) {
      var param = this.params[varName];
      x[varName] = param.value;
    }
    return x;
  }
  this.getOutsAuto = function (x) {
    for (var varName in this.params) {
      var param = this.params[varName];
      if (param.dir == 'output') {
        x[varName] = param.value;
      }
    }
    return x;
  }
  this.setOutsAuto = function (x) {
    for (var varName in this.params) {
      var param = this.params[varName];
      if (param.dir == 'output') {
        this.set(varName,x[varName]);
      }
    }
    return x;
  }
  this.get = function (varName) {
    var param = this.params[varName];
    switch (param.type) {
      case 'text':
      case 'select':
        param.value = document.getElementById(combineToId([this.el, varName])).value;
        return param.value;
      case 'color':
        if (this.rangeInput) return this.getRange(varName);
        var inputEl = document.getElementById(combineToId([this.el, varName]));
        var val = inputEl ? inputEl.value.trim() : param.value;
        if (/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val)) {
          var corrected = rgbCorrect(val).toLowerCase();
          param.value = corrected;
          this.setRange(varName, corrected);
          return corrected;
        }
        return param.value;
      case 'checkbox':
        param.value = document.getElementById(combineToId([this.el, varName])).checked;
        return param.value;
      default:
        if (this.rangeInput) return this.getRange(varName);
        param.value = document.getElementById(combineToId([this.el, varName])).value;
        param.value = getFloatOfText(param.value);
        param.value = (param.min !== undefined) ? bound(param.value, param.min, param.max) : param.value;
        document.getElementById(combineToId([this.el, varName])).value = (param.round !== undefined) ? getTextOfRound(param.value, param.round) : param.value;
        document.getElementById(combineToId([this.el, varName, 'range'])).value = param.value;
        return param.value;
    }
  }
  this.getRange = function (varName) {
    var param = this.params[varName];
    param.value = document.getElementById(combineToId([this.el, varName, 'range'])).value; // change slider
    if (param.type !== 'color') {
      param.value = parseFloat(param.value);
      document.getElementById(combineToId([this.el, varName])).value = (param.round !== undefined) ? getTextOfRound(param.value, param.round) : param.value;
    }
    return param.value;
  }
  this.setRange = function (varName, value) {
    var rangeEl = document.getElementById(combineToId([this.el, varName, 'range']));
    if (rangeEl) rangeEl.value = value; // change slider
  }
  this.getId = function (varName, varSuffix) {
    return combineToId([this.el, varName, varSuffix])
  }
  this.set = function (varName, value) {
    var param = this.params[varName];
    param.value = value;
    switch (param.type) {
      case 'text':
        document.getElementById(combineToId([this.el, varName])).value = value;
        break;
      case 'checkbox':
        document.getElementById(combineToId([this.el, varName])).checked = value;
        break;
      case 'color':
        value = rgbCorrect(value);
        param.value = value;
        var textEl = document.getElementById(combineToId([this.el, varName]));
        var rangeEl = document.getElementById(combineToId([this.el, varName, 'range']));
        if (textEl) {
          textEl.value = value;
          textEl.classList.remove('is-invalid');
          textEl.setAttribute('aria-invalid', 'false');
          if (textEl.dataset.originalTooltip) {
            textEl.dataset.tooltip = textEl.dataset.originalTooltip;
          }
          if (typeof hideTooltip === 'function' && window.activeTooltipTarget === textEl) {
            hideTooltip();
          }
        }
        if (rangeEl) {
          rangeEl.value = value;
        }
        break;
      default:
        value = (param.min !== undefined) ? bound(value, param.min, param.max) : value;
        document.getElementById(combineToId([this.el, varName])).value = (param.round !== undefined) ? getTextOfRound(value, param.round) : value;
        if (document.getElementById(combineToId([this.el, varName, 'range'])) !== null) {
          document.getElementById(combineToId([this.el, varName, 'range'])).value = round(value, param.round);
        }
        break;
    }
  }
  this.setText = function (varName, value) {
    var param = this.params[varName];
    param.value = value;
    document.getElementById(combineToId([this.el, varName])).value = value;
  }
  this.setStyle = function (varName, value) {
    var param = this.params[varName];
    document.getElementById(combineToId([this.el, varName])).style = value;
  }
  this.setTooltip = function (varName, tooltip) {
    if (!tooltip) return;
    var rowEl = document.getElementById(combineToId([this.el, varName, 'row']));
    var rangeEl = document.getElementById(combineToId([this.el, varName, 'range']));
    var inputEl = document.getElementById(combineToId([this.el, varName]));
    var nameTip = typeof tooltip === 'object' ? (tooltip.name || tooltip.range || tooltip.input) : tooltip;
    var rangeTip = typeof tooltip === 'object' ? (tooltip.range || tooltip.input) : tooltip;
    var inputTip = typeof tooltip === 'object' ? (tooltip.input || tooltip.range) : tooltip;
    if (rowEl && rowEl.cells[0] && !rowEl.cells[0].querySelector('button') && nameTip) {
      rowEl.cells[0].dataset.tooltip = nameTip;
    }
    if (rangeEl && rangeTip) rangeEl.dataset.tooltip = rangeTip;
    if (inputEl && inputTip) {
      inputEl.dataset.originalTooltip = inputTip;
      if (!inputEl.classList.contains('is-invalid')) {
        inputEl.dataset.tooltip = inputTip;
      }
    }
  }
  this.triggerColorCallback = function (varName, isRange) {
    var param = this.params[varName];
    var callbackName = (param.callbackName !== undefined) ? param.callbackName : this.callbackName;
    this.rangeInput = !!isRange;
    if (typeof callbackName === 'function') {
      callbackName(this.callbackArgs);
    } else if (typeof window[callbackName] === 'function') {
      window[callbackName](this.callbackArgs);
    } else if (typeof callbackName === 'object' && callbackName.name && typeof window[callbackName.name] === 'function') {
      window[callbackName.name](this.callbackArgs);
    }
    this.rangeInput = false;
  }
  this.bindColorEvents = function (varName) {
    var self = this;
    var textEl = document.getElementById(combineToId([this.el, varName]));
    var rangeEl = document.getElementById(combineToId([this.el, varName, 'range']));
    if (!textEl || !rangeEl) return;

    var param = this.params[varName];
    var getOrigTooltip = function () {
      return textEl.dataset.originalTooltip || (param.tooltip && (param.tooltip.input || param.tooltip)) || '';
    };

    textEl.addEventListener('input', function () {
      var raw = textEl.value;
      var trimmed = raw.trim();
      var isValidColor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
      var isValidPrefix = /^#?[0-9a-fA-F]{0,6}$/.test(trimmed);
      var origTip = getOrigTooltip();

      if (isValidColor) {
        textEl.classList.remove('is-invalid');
        textEl.setAttribute('aria-invalid', 'false');
        textEl.dataset.tooltip = origTip;
        if (typeof hideTooltip === 'function' && window.activeTooltipTarget === textEl) {
          hideTooltip();
        }

        var normalized = rgbCorrect(trimmed).toLowerCase();
        param.value = normalized;
        self.setRange(varName, normalized);
        self.triggerColorCallback(varName, false);
      } else if (!isValidPrefix) {
        textEl.classList.add('is-invalid');
        textEl.setAttribute('aria-invalid', 'true');
        textEl.dataset.tooltip = 'invalid entry';
        if (typeof positionTooltip === 'function') {
          positionTooltip(textEl);
          window.activeTooltipTarget = textEl;
        }
      } else {
        textEl.classList.remove('is-invalid');
        textEl.setAttribute('aria-invalid', 'false');
        textEl.dataset.tooltip = origTip;
        if (typeof hideTooltip === 'function' && window.activeTooltipTarget === textEl) {
          hideTooltip();
        }
      }
    });

    textEl.addEventListener('blur', function () {
      var raw = textEl.value;
      var trimmed = raw.trim();
      var isValidColor = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed);
      var origTip = getOrigTooltip();

      if (isValidColor) {
        var normalized = rgbCorrect(trimmed).toLowerCase();
        textEl.value = normalized;
        param.value = normalized;
        self.setRange(varName, normalized);
        textEl.classList.remove('is-invalid');
        textEl.setAttribute('aria-invalid', 'false');
        textEl.dataset.tooltip = origTip;
        if (typeof hideTooltip === 'function' && window.activeTooltipTarget === textEl) {
          hideTooltip();
        }
      } else {
        textEl.classList.add('is-invalid');
        textEl.setAttribute('aria-invalid', 'true');
        textEl.dataset.tooltip = 'invalid entry';

        setTimeout(function () {
          if (textEl.classList.contains('is-invalid')) {
            if (typeof positionTooltip === 'function') {
              positionTooltip(textEl);
              window.activeTooltipTarget = textEl;
            }
          }
        }, 20);

        if (textEl._invalidTipTimeout) clearTimeout(textEl._invalidTipTimeout);
        textEl._invalidTipTimeout = setTimeout(function () {
          if (window.activeTooltipTarget === textEl && document.activeElement !== textEl) {
            if (typeof hideTooltip === 'function') hideTooltip();
          }
        }, 2800);
      }
    });

    textEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        textEl.blur();
      } else if (e.key === 'Escape') {
        textEl.value = param.value;
        textEl.classList.remove('is-invalid');
        textEl.setAttribute('aria-invalid', 'false');
        textEl.dataset.tooltip = getOrigTooltip();
        if (typeof hideTooltip === 'function') hideTooltip();
      }
    });

    var onPickerChange = function () {
      var val = rangeEl.value;
      param.value = val;
      textEl.value = val;
      textEl.classList.remove('is-invalid');
      textEl.setAttribute('aria-invalid', 'false');
      textEl.dataset.tooltip = getOrigTooltip();
      if (typeof hideTooltip === 'function' && window.activeTooltipTarget === textEl) {
        hideTooltip();
      }
      self.triggerColorCallback(varName, true);
    };

    rangeEl.addEventListener('input', onPickerChange);
    rangeEl.addEventListener('change', onPickerChange);
  }
  // this.storageGet = function (varName,param) {
  //   if (!this.storageEn) return param.value;
  //   var paramId = varName;
  //   if (this.obj.endsWith(']')) {
  //     var arrIx = this.obj.indexOf('[');
  //     var objName = this.obj.substr(0, arrIx);
  //     var objIx = this.obj.substr(arrIx+1, 1);
  //     paramId = combineToId([varName,objIx]);
  //   }
  //   var v = localStorage.getItem(paramId);
  //   if (v===null) return param.value;
  //   return v;
  // }
}