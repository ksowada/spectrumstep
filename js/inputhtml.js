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
            // empty/invalid initial value would give "#" which <input type="color"> rejects
            if (!/^#[0-9a-f]{6}$/.test(param.value)) param.value = '#000000';
            html_range = '<td class="form-value color"><div class="color-bar" style="--bar-color:' + param.value + '"><input id="' + combineToId([this.el, varName, 'range']) + '" class="form-control" type="color" value="' + param.value + '"/></div></td>';
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
      } else if (this.params[cp].type === 'number' && this.params[cp].dir !== 'output') {
        this.bindNumberEvents(cp);
      }
    }
  }
  /** text of a number value: hex byte (param.hex), fixed decimals (param.pad) or rounded without trailing zeros */
  this.format = function (param, value) {
    if (param.hex) {
      var hex = Math.round(bound(value, 0, 255)).toString(16);
      return hex.length < 2 ? '0' + hex : hex;
    }
    if (param.round === undefined) return value;
    if (param.pad) return isNaN(value) ? '' : Number(value).toFixed(Math.max(0, -param.round));
    return getTextOfRound(value, param.round);
  }
  /** flag an erroneous entry: the text stays as typed, red border, tooltip explains the problem */
  this.setInvalid = function (el, message) {
    el.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
    el.dataset.tooltip = message;
    if (typeof positionTooltip === 'function') {
      positionTooltip(el);
      window.activeTooltipTarget = el;
    }
  }
  this.clearInvalid = function (el) {
    if (!el || !el.classList.contains('is-invalid')) return;
    el.classList.remove('is-invalid');
    el.setAttribute('aria-invalid', 'false');
    if (el.dataset.originalTooltip) el.dataset.tooltip = el.dataset.originalTooltip;
    if (typeof hideTooltip === 'function' && window.activeTooltipTarget === el) hideTooltip();
  }
  /** while typing the text is left alone; a valid entry is normalised when the field is left (or on Enter),
   *  an erroneous one stays as typed and keeps its red border */
  this.bindNumberEvents = function (varName) {
    var self = this;
    var el = document.getElementById(combineToId([this.el, varName]));
    if (!el) return;
    el.addEventListener('blur', function () {
      var param = self.params[varName];
      if (el.classList.contains('is-invalid')) {
        // focusout hides every tooltip: show the complaint again for a moment
        setTimeout(function () {
          if (el.classList.contains('is-invalid') && typeof positionTooltip === 'function') {
            positionTooltip(el);
            window.activeTooltipTarget = el;
          }
        }, 20);
        if (el._invalidTipTimeout) clearTimeout(el._invalidTipTimeout);
        el._invalidTipTimeout = setTimeout(function () {
          if (window.activeTooltipTarget === el && document.activeElement !== el && typeof hideTooltip === 'function') hideTooltip();
        }, 2800);
        return;
      }
      el.value = self.format(param, param.value);
    });
    el.addEventListener('keydown', function (e) {
      var param = self.params[varName];
      if (e.key === 'Enter') {
        el.blur();
      } else if (param.hex && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        // hex bytes are a text field without spin buttons: arrow keys step by one
        e.preventDefault();
        var next = bound(Math.round(param.value) + (e.key === 'ArrowUp' ? 1 : -1), param.min, param.max);
        el.value = self.format(param, next);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
  this.clickEvent = function (callbackName, callbackArgs, varName, paramtype, rangeInput) {
    callbackName = callbackName.name;
    this.rangeInput = rangeInput; // just a bit to remember if it was range Input
    this.activeVar = varName;     // which input is being edited during the callback
    // spin buttons / arrow keys fire 'input' without inputType: then the text may be normalised at once
    this.stepInput = !(window.event && window.event.inputType);
    window[callbackName](callbackArgs);
    this.activeVar = undefined;
    this.stepInput = false;
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
        var numEl = document.getElementById(combineToId([this.el, varName]));
        var numText = numEl.value.trim();
        var numVal;      // undefined: empty field, keeps the last valid value
        var numErr = '';
        if (param.hex) {
          // 1 or 2 hex digits in any case; "8" means 08
          if (numText !== '') {
            if (/^[0-9a-fA-F]{1,2}$/.test(numText)) numVal = parseInt(numText, 16);
            else numErr = 'Invalid hex byte "' + numText + '": enter 1 or 2 hexadecimal digits (0–9, a–f), 00 to ff';
          }
        } else if (numEl.validity && numEl.validity.badInput) {
          numErr = 'Not a number: enter digits with a decimal point only';
        } else if (numText !== '') {
          numVal = Number(numText.replace(',', '.'));
          if (isNaN(numVal)) numErr = 'Not a number: enter digits with a decimal point only';
        }
        if (!numErr && numVal !== undefined && param.min !== undefined) {
          if (numVal > param.max) numErr = 'Value too high: the maximum is ' + this.format(param, param.max) + (param.hex ? '' : param.unit);
          else if (numVal < param.min) numErr = 'Value too low: the minimum is ' + this.format(param, param.min) + (param.hex ? '' : param.unit);
        }
        if (numErr) {
          // erroneous entry: leave the text as typed, keep the last valid value
          this.setInvalid(numEl, numErr);
          return param.value;
        }
        this.clearInvalid(numEl);
        if (numVal === undefined) return param.value;
        param.value = numVal;
        // do not rewrite the text under the caret (normalised on blur), except when stepping
        if (document.activeElement !== numEl || this.stepInput) numEl.value = this.format(param, param.value);
        var numRangeEl = document.getElementById(combineToId([this.el, varName, 'range']));
        if (numRangeEl) numRangeEl.value = param.value;
        return param.value;
    }
  }
  this.getRange = function (varName) {
    var param = this.params[varName];
    param.value = document.getElementById(combineToId([this.el, varName, 'range'])).value; // change slider
    if (param.type !== 'color') {
      param.value = parseFloat(param.value);
      document.getElementById(combineToId([this.el, varName])).value = this.format(param, param.value);
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
        param.value = value;
        this.clearInvalid(document.getElementById(combineToId([this.el, varName])));
        document.getElementById(combineToId([this.el, varName])).value = this.format(param, value);
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

    // The colour is painted by .color-bar (not by the native swatch, see CSS): keep
    // --bar-color in sync with picks by the user and with programmatic `.value = …` writes.
    var bar = rangeEl.parentElement;
    var valueDesc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    var syncBar = function () { bar.style.setProperty('--bar-color', valueDesc.get.call(rangeEl)); };
    Object.defineProperty(rangeEl, 'value', {
      configurable: true,
      get: function () { return valueDesc.get.call(this); },
      set: function (v) { valueDesc.set.call(this, v); syncBar(); }
    });
    rangeEl.addEventListener('input', syncBar);
    rangeEl.addEventListener('change', syncBar);
    syncBar();

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