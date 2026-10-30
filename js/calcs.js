
/** Macht aus einem String unabh&auml;ngig, ob mit Komma oder Punkt
 geschrieben einen float zurück */
function getFloatOfText(preis) {
  if (preis === undefined || preis === null) return 0;
  preis = String(preis);
  if (preis.length == 0) preis = "0";
  preis = preis.replace(/[,]/,'.');
  preis = parseFloat(preis);
  return isNaN(preis) ? 0 : preis;
}
function round(wert, decimals) {
  decimalsStd = (decimals !== undefined) ? decimals : -2;
  return Math.round10(wert, decimalsStd);
}
// force number bounds min max
function bound(v,vmin,vmax) {
  if (v < vmin) return vmin;
  if (v > vmax) return vmax;
  return v;
}
// sum arr to ix [5, 4, 3, 2, 1], 1 => 5+4=9
function sum(arr, ix) {
  if (ix === undefined) {
    var sum = _.reduce (arr, function(memo, num){ return memo + num; }, 0);
    return sum;
  } else {
    if (ix < 0) return 0;
    var ini = _.initial(arr, arr.length - 1 - ix);
    var sum = _.reduce (ini, function(memo, num){ return memo + num; }, 0);
    return sum;
  }
}
function ratio(ratio, min, max) {
    return min + (max - min) * ratio;
}
// factor goldener Golden_ratio
function growth(val, pow) {
    return Math.pow(1.6180339887498948482045, pow) * val;
}

/**
 * generates random number
 * @param max exclusive maximum number
 * @returns {number} integer range 0..max-1
 */
function randomInt(max) {
  return Math.floor(Math.random() * max);
}
function getTextOfFloat(wert) {
  wert = String(wert);  // konvertiere nach String
  // wert = wert.replace(/[.]/,',');
  return wert;
}
// format number with decimals; trims redundant trailing zeros if clean integer
function getTextOfRound(wert, decimals) {
  decimals = (decimals !== undefined) ? decimals : 0;
  if (isNaN(wert)) return '';
  var fixed = Number.parseFloat(wert).toFixed(-decimals);
  if (decimals !== 0 && fixed.indexOf('.') !== -1) {
    fixed = fixed.replace(/\.?0+$/, '');
  }
  return fixed;
}
function getEuroOfFloat(wert) {
  wert = String(round(wert).toFixed(2));  // konvertiere nach String
  wert = wert.replace(/[.]/,',');
  return wert+" €";
}
function getTimeTextOfMin (wert,excludePrefix) {
  var hour = wert / 60.0;
  var prefix = (excludePrefix)?"":"+";
  var min = ""+parseInt(wert % 60.0);
  if (min<0) {
    prefix = "-";
    min = -min;
  }
  // hour wird auch noch negativ, außer min, wenn h größer 0 ist
  if (hour<0) {
    hour = -hour;
  }
  if (min.length==1) min = "0" + min;
  return prefix + parseInt(hour)+":"+min;
}
function setColoredRelativeTimeOfMin (wert, comp, invertColor) {
  wert = parseInt(wert);
  if (wert>0 && !invertColor) colorText = "green";
  if (wert<0 && !invertColor) colorText = "red";
  if (wert>0 && invertColor) colorText = "red";
  if (wert<0 && invertColor) colorText = "green";
  if (wert==0) colorText = "black";
  comp.style.color = colorText;
  comp.value = getTimeTextOfMin(wert);
}
function setColoredRelativeEuro(wert, comp, invertColor) {
  wert = parseInt(wert*100);
  var prefix = "";
  if (wert>0) prefix = "+";
  if (wert>0 && !invertColor) colorText = "green";
  if (wert<0 && !invertColor) colorText = "red";
  if (wert>0 && invertColor) colorText = "red";
  if (wert<0 && invertColor) colorText = "green";
  if (wert==0) colorText = "black";
  comp.style.color = colorText;
  comp.value = prefix + getEuroOfFloat(wert/100);
}
/** automize input reading and back writing after bounding return bounded value */
function getBoundOfInput(formName,inputName,min,max) {
  var readed = getFloatOfText(document[formName][inputName].value);
  var bounded = bound(readed,min,max);
  var rounded = round(bounded);
  document[formName][inputName].value = getTextOfFloat(bounded);
  return bounded;
}
function combineToId(args) {
  var id = args[0];
  for (var i=1;i<args.length;i++) {
    id += '-'+args[i];
  }
  return id;
}
// Code from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Math/round
// Closure
(function() {
  /**
   * Decimal adjustment of a number.
   *
   * @param {String}  type  The type of adjustment.
   * @param {Number}  value The number.
   * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base). -2: 0.01
   * @returns {Number} The adjusted value.
   */
  function decimalAdjust(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }
  // Decimal round
  if (!Math.round10) {
    Math.round10 = function(value, exp) {
      return decimalAdjust('round', value, exp);
    };
  }
  // Decimal floor
  if (!Math.floor10) {
    Math.floor10 = function(value, exp) {
      return decimalAdjust('floor', value, exp);
    };
  }
  // Decimal ceil
  if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
      return decimalAdjust('ceil', value, exp);
    };
  }
})();

/** replace Math.sin through ramp, with same parameters */
function ramp(rad) {
  rad = rad % (Math.PI*2);
  var rel = rad / (Math.PI/2);
  if (rel < 1) return rel;
  rel -= 1;
  if (rel < 1) return 1-rel;
  rel -= 1;
  if (rel < 1) return -rel;
  rel -= 1;
  if (rel < 1) return -1+rel;
  return 0; // impossible
}
function shortName(name) {
  var ix = name.indexOf('(');
  if (ix == -1) return name;
  return name.substr(0,ix-1);
}
/** hue is rotating so beware difference from bound */
function hueBound(hue) {
  hue = hue % 1;
  if (hue < 0) hue += 1;
  return hue;
}
function rgbCorrect(value) {
  // 1. Remove leading '#' if present
  value = (value.charAt(0) === '#') ? value.slice(1) : value;
  // 2. Handle accidental double '#' (e.g. "##333")
  value = (value.charAt(0) === '#') ? value.slice(1) : value;
  // 3. Expand short form (3 chars) to long form (6 chars)
  if (value.length === 3) {
    value = value[0] + value[0]
        + value[1] + value[1]
        + value[2] + value[2];
  }
  // 4. Re-add the single leading '#'
  return '#' + value;
}
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * they might be supplied single value or as array
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {Array}           The RGB representation
 *
 * from https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
 */
function hslToRgb() {
  let h, s, l
  if (arguments.length===3) {
    [h,s,l] = arguments
  } else {
    [h,s,l] = arguments[0]
  }
  var r, g, b;
  if(s == 0){
      r = g = b = l; // achromatic
  }else{
      var hue2rgb = function hue2rgb(p, q, t){
          if(t < 0) t += 1;
          if(t > 1) t -= 1;
          if(t < 1/6) return p + (q - p) * 6 * t;
          if(t < 1/2) return q;
          if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
      }
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/**
 * Converts an HSV color value to RGB.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {Array}  args   [h, s, v]
 * @return  {Array}         The RGB representation [r, g, b]
 */
function hsvToRgb(args){
  var h = args[0];
  var s = args[1];
  var v = args[2];

  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch(i % 6){
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
function rgbToHsl(args, fallbackHue){
  var r = args[0];
  var g = args[1];
  var b = args[2];

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = (fallbackHue !== undefined && !isNaN(fallbackHue)) ? fallbackHue : 0; // achromatic
      s = 0;
  }else{
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch(max){
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
  }

  return [h, s, l];
}
/**
 * Converts an RGB color value to HSV.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and v in the set [0, 1].
 *
 * @param   {Array}  args   [r, g, b]
 * @param   {number} [fallbackHue] Optional hue to preserve when achromatic
 * @return  {Array}         The HSV representation [h, s, v]
 */
function rgbToHsv(args, fallbackHue){
  var r = args[0];
  var g = args[1];
  var b = args[2];

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if(max == min){
    h = (fallbackHue !== undefined && !isNaN(fallbackHue)) ? fallbackHue : 0; // achromatic
  }else{
    switch(max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h, s, v];
}
/**
 * convert hex color to rgb array [0..255]
 * @param {string} hex hex version of RGB Color, may be with leading # 
 * @returns {number[]} array with 0..255 per color
 */
function hexToRgb(hex) {
  if (hex.charAt(0)=='#') hex = hex.substr(1);
  var bigint = parseInt(hex, 16);
  var r = (bigint >> 16) & 255;
  var g = (bigint >> 8) & 255;
  var b = bigint & 255;
  return [r,g,b];
}
/** convert array of r,g,b into hexcolor
 * @param {number[]} args r,g,b given as integer from 0..255 */
function rgbToColor(args) {
  var hexString = '';
  for (var i in args) {
    var hex = args[i].toString(16);
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    hexString += hex;
  }
  return hexString.toLowerCase();
}
// function hexToRgb(hex) {
//   // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
//   var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
//   hex = hex.replace(shorthandRegex, function(m, r, g, b) {
//     return r + r + g + g + b + b;
//   });

//   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//   // return result ? {
//   //   r: parseInt(result[1], 16),
//   //   g: parseInt(result[2], 16),
//   //   b: parseInt(result[3], 16)
//   // } : null;
//   return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
// }

function interpolate(r,x1,x2,hue) {
  if (!hue) {
    return x1 + (x2-x1)*r;
  } else {
    var xd = x2 - x1;
    var xh = xd;
    if (hue === 'longer') {
      if (xd > 0 && xd < 0.5) xh = -1 + xd;
      else if (xd < 0 && xd > -0.5) xh = 1 + xd;
      else if (xd === 0) xh = 1;
    } else {
      // shorter way (default): hue is bigger than half, other way is right
      if (xd > 0.5) xh = -1 + xd;
      if (xd < -0.5) xh = 1 + xd;
    }
    var hueBounded = hueBound(x1 + xh*r);
    return hueBounded;
  }
}
function srgbChannelToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearChannelToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function oklabToLinearSrgb(L, a, b) {
  var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  var l = l_ * l_ * l_;
  var m = m_ * m_ * m_;
  var s = s_ * s_ * s_;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ];
}
function isLinearRgbInGamut(rgbLin) {
  var eps = 1e-6;
  return rgbLin[0] >= -eps && rgbLin[0] <= 1 + eps &&
         rgbLin[1] >= -eps && rgbLin[1] <= 1 + eps &&
         rgbLin[2] >= -eps && rgbLin[2] <= 1 + eps;
}
/**
 * Converts an OKLab color [L, a, b] (L in [0, 1], a & b in [-0.4, 0.4]) to sRGB [0..255].
 * Out-of-gamut colors are gamut-mapped by reducing chroma (scaling a and b equally
 * while preserving lightness L and hue angle) until the color fits within sRGB.
 */
function oklabToRgb() {
  var L, a, b;
  if (arguments.length === 3) {
    L = arguments[0]; a = arguments[1]; b = arguments[2];
  } else {
    L = arguments[0][0]; a = arguments[0][1]; b = arguments[0][2];
  }
  if (L <= 0) return [0, 0, 0];
  if (L >= 1) return [255, 255, 255];

  var rgbLin = oklabToLinearSrgb(L, a, b);
  if (!isLinearRgbInGamut(rgbLin)) {
    var low = 0;
    var high = 1;
    for (var iter = 0; iter < 18; iter++) {
      var mid = (low + high) * 0.5;
      var testLin = oklabToLinearSrgb(L, a * mid, b * mid);
      if (isLinearRgbInGamut(testLin)) {
        low = mid;
        rgbLin = testLin;
      } else {
        high = mid;
      }
    }
    rgbLin = oklabToLinearSrgb(L, a * low, b * low);
  }

  return [
    Math.round(bound(linearChannelToSrgb(bound(rgbLin[0], 0, 1)), 0, 1) * 255),
    Math.round(bound(linearChannelToSrgb(bound(rgbLin[1], 0, 1)), 0, 1) * 255),
    Math.round(bound(linearChannelToSrgb(bound(rgbLin[2], 0, 1)), 0, 1) * 255)
  ];
}
/**
 * Converts an sRGB color [r, g, b] in [0..255] to OKLab [L, a, b] (L in [0, 1]).
 */
function rgbToOklab(args) {
  var r = srgbChannelToLinear(args[0] / 255);
  var g = srgbChannelToLinear(args[1] / 255);
  var b = srgbChannelToLinear(args[2] / 255);

  var l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  var m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  var s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  var l_ = Math.cbrt(l);
  var m_ = Math.cbrt(m);
  var s_ = Math.cbrt(s);

  var L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  var okA = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  var okB = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return [bound(L, 0, 1), okA, okB];
}
/**
 * Converts an OKLCH color [L, C, h] (L in [0, 1], C >= 0, h in [0, 1]) to sRGB [0..255]
 * using chroma reduction gamut mapping when out of sRGB gamut.
 */
function oklchToRgb() {
  var L, C, h;
  if (arguments.length === 3) {
    L = arguments[0]; C = arguments[1]; h = arguments[2];
  } else {
    L = arguments[0][0]; C = arguments[0][1]; h = arguments[0][2];
  }
  var cSafe = Math.max(0, C);
  var rad = h * 2 * Math.PI;
  var a = cSafe * Math.cos(rad);
  var b = cSafe * Math.sin(rad);
  return oklabToRgb(L, a, b);
}
/**
 * Converts an sRGB color [r, g, b] in [0..255] to OKLCH [L, C, h] (L in [0, 1], h in [0, 1]).
 */
function rgbToOklch(args, fallbackHue) {
  var lab = rgbToOklab(args);
  var L = lab[0];
  var a = lab[1];
  var b = lab[2];
  var C = Math.sqrt(a * a + b * b);
  var h;
  if (C <= 0.0001) {
    h = (fallbackHue !== undefined && !isNaN(fallbackHue)) ? fallbackHue : 0;
    C = 0;
  } else {
    h = Math.atan2(b, a) / (2 * Math.PI);
    if (h < 0) h += 1;
  }
  return [L, C, h];
}
function colorConvertFromRgb(mode, rgb, fallbackHue) {
  if (mode==='RGB') return rgb;
  if (mode==='HSL') return rgbToHsl(rgb, fallbackHue);
  if (mode==='HSV') return rgbToHsv(rgb, fallbackHue);
  if (mode==='Oklab') return rgbToOklab(rgb);
  if (mode==='Oklch') return rgbToOklch(rgb, fallbackHue);
}
function colorConvertToRgb(mode, col) {
  if (mode==='RGB') return col;
  if (mode==='HSL') return hslToRgb(col);
  if (mode==='HSV') return hsvToRgb(col);
  if (mode==='Oklab') return oklabToRgb(col);
  if (mode==='Oklch') return oklchToRgb(col);
}
/** calculate HSL colors from h1 to h2, and so on, period is repetition
 * give out hex rgb with leading # for css user */
function getHSLColors(args) {
  args.len = parseInt(args.len);
  var overdrive = (args.overdrive!==undefined) ? parseInt(args.overdrive) : 0;
  var rgbColors = [];
  for (var i=-overdrive;i<args.len+overdrive;i++) {
    var rel = i/(args.len-1);
    var h = interpolate(rel,args.hsl1[0],args.hsl2[0],true);
    h = hueBound(h);
    var s = interpolate(rel,args.hsl1[1],args.hsl2[1]);
    s = bound(s, 0, 1);
    var l = interpolate(rel,args.hsl1[2],args.hsl2[2]);
    l = bound(l, 0, 1);
    var rgb = hslToRgb(h,s,l);
    rgbColors.push('#'+rgbToColor(rgb));
  }
  return rgbColors;
}
/** calculate RGB colors interpolationg from 2 values
 * from c1,c2 given as 6-digit-hexstring with leading # or
 * from rgb1,rgb2 as rgb Array 0..255*/
function getRGBColors(args) {
  args.len = parseInt(args.len);
  var overdrive = (args.overdrive!==undefined) ? parseInt(args.overdrive) : 0;
  var rgbAr1 = (args.c1!==undefined) ? getRGBColorByStr(args.c1) : args.rgb1;
  var rgbAr2 = (args.c1!==undefined) ? getRGBColorByStr(args.c2) : args.rgb2;
  var period = (args.period!==undefined) ? args.period : args.len;
  var rgbColors = [];
  for (var i=-overdrive;i<args.len+overdrive;i++) {
    var rel = i/(args.len-1);
    var r = interpolate(rel,rgbAr1[0],rgbAr2[0]);
    var g = interpolate(rel,rgbAr1[1],rgbAr2[1]);
    var b = interpolate(rel,rgbAr1[2],rgbAr2[2]);
    var rgb = getRGBColor(r,g,b);
    rgbColors.push('#'+rgbToColor(rgb));
  }
  return rgbColors;
}
/** calculate colors interpolating from c1 to c2 in RGB, HSL, HSV, Oklab, or Oklch space, overdrive extrapolates linearly
 * args: { len, overdrive,
 *         mode:   'RGB'|'HSL'|'HSV'|'Oklab'|'Oklch' (default 'RGB') = Raum, in dem interpoliert wird,
 *         c1, c1Mode: 'RGB'|'HSL'|'HSV'|'Oklab'|'Oklch' (default = mode),
 *         c2, c2Mode: 'RGB'|'HSL'|'HSV'|'Oklab'|'Oklch' (default = mode),
 *         hueWay: 'shorter'|'longer' (default 'shorter') }
 * c1, c2 can be
 *   - 6-digit-hexstring with leading # (c1Mode/c2Mode wird ignoriert)
 *   - array in the units of its own mode: RGB 0..255, HSL/HSV [h,s,x] 0..1, Oklab [L,a,b], Oklch [L,C,h]
 * or (old style) rgb1, rgb2 as array 0..255
 * give out hex rgb with leading # for css user */
function getColors(args) {
  var mode = args.mode || 'RGB';
  var hueWay = args.hueWay || 'shorter';
  args.len = parseInt(args.len);
  var overdrive = (args.overdrive !== undefined) ? parseInt(args.overdrive) : 0;
  var isHue = (mode === 'HSL' || mode === 'HSV' || mode === 'Oklch');

  var conv = {
    RGB: { toRgb: function (a, b, c) { return getRGBColor(a, b, c); },
      fromRgb: function (rgb) { return rgb; } },
    HSL: { toRgb: function (h, s, l) { return hslToRgb(h, s, l); },
      fromRgb: rgbToHsl },
    HSV: { toRgb: function (h, s, v) { return hsvToRgb([h, s, v]); },
      fromRgb: rgbToHsv },
    Oklab: { toRgb: function (l, a, b) { return oklabToRgb(l, a, b); },
      fromRgb: rgbToOklab },
    Oklch: { toRgb: function (l, c, h) { return oklchToRgb(l, c, h); },
      fromRgb: rgbToOklch }
  };

  // Farbe aus ihrem eigenen Modus in den Interpolationsraum bringen
  function resolve(c, cMode, rgbAlt) {
    if (typeof c === 'string') {
      return conv[mode].fromRgb(getRGBColorByStr(c));
    }
    if (c === undefined) {          // alter Stil: rgb1 / rgb2
      c = rgbAlt;
      cMode = 'RGB';
    }
    cMode = cMode || mode;
    if (cMode === mode) return c;   // gleicher Raum: keine verlustbehaftete Umrechnung
    var rgb = conv[cMode].toRgb(c[0], c[1], c[2]);
    return conv[mode].fromRgb(rgb);
  }
  var p1 = resolve(args.c1, args.c1Mode, args.rgb1);
  var p2 = resolve(args.c2, args.c2Mode, args.rgb2);

  if (isHue && Array.isArray(p1) && Array.isArray(p2)) {
    p1 = p1.slice();
    p2 = p2.slice();

    var hueIdx = (mode === 'Oklch') ? 2 : 0;
    var isAchromatic1, isAchromatic2;
    if (mode === 'HSL') {
      isAchromatic1 = (p1[2] <= 0.0001 || p1[2] >= 0.9999 || p1[1] <= 0.0001);
      isAchromatic2 = (p2[2] <= 0.0001 || p2[2] >= 0.9999 || p2[1] <= 0.0001);
    } else if (mode === 'HSV') {
      isAchromatic1 = (p1[2] <= 0.0001 || p1[1] <= 0.0001);
      isAchromatic2 = (p2[2] <= 0.0001 || p2[1] <= 0.0001);
    } else {
      // Oklch: [L, C, h]
      isAchromatic1 = (p1[0] <= 0.0001 || p1[0] >= 0.9999 || p1[1] <= 0.0001);
      isAchromatic2 = (p2[0] <= 0.0001 || p2[0] >= 0.9999 || p2[1] <= 0.0001);
    }

    if (isAchromatic2 && !isAchromatic1) {
      p2[hueIdx] = p1[hueIdx];
    } else if (isAchromatic1 && !isAchromatic2) {
      p1[hueIdx] = p2[hueIdx];
    }
  }

  var rgbColors = [];
  for (var i = -overdrive; i < args.len + overdrive; i++) {
    var rel = args.len > 1 ? i / (args.len - 1) : 0;
    var a, b, c;
    if (mode === 'HSL' || mode === 'HSV') {
      a = hueBound(interpolate(rel, p1[0], p2[0], hueWay));
      b = bound(interpolate(rel, p1[1], p2[1]), 0, 1);
      c = bound(interpolate(rel, p1[2], p2[2]), 0, 1);
    } else if (mode === 'Oklch') {
      a = bound(interpolate(rel, p1[0], p2[0]), 0, 1);
      b = bound(interpolate(rel, p1[1], p2[1]), 0, 0.4);
      c = hueBound(interpolate(rel, p1[2], p2[2], hueWay));
    } else if (mode === 'Oklab') {
      a = bound(interpolate(rel, p1[0], p2[0]), 0, 1);
      b = interpolate(rel, p1[1], p2[1]);
      c = interpolate(rel, p1[2], p2[2]);
    } else {
      a = interpolate(rel, p1[0], p2[0]);
      b = interpolate(rel, p1[1], p2[1]);
      c = interpolate(rel, p1[2], p2[2]);
    }
    rgbColors.push('#' + rgbToColor(conv[mode].toRgb(a, b, c)));
  }
  return rgbColors;
}
/** calculate RGB colors from r1 to r2, and so on, period is repetition */
function getRGBColor(r,g,b) {
  return [
    Math.round(bound(r,0,255)), 
    Math.round(bound(g,0,255)), 
    Math.round(bound(b,0,255)),
  ];
}
/** calculate RGB colors from r1 to r2, and so on, period is repetition */
function getRGBColorByStr(rgbString) {
  var rgbArray = [];
  var rgbStringShorted = (rgbString.charAt(0) === '#') ? rgbString.substr(1) : rgbString;
  for (var i=0;i<3;i++) {
    var rgbToken = rgbStringShorted.substr(0+i*2,2);
    var rgbValue = parseInt(rgbToken, 16);
    rgbArray.push(rgbValue);
  }
  return rgbArray;
}

function relativeLuminance([r, g, b]) {
  const linearize = (value) => {
    const channel = value / 255;

    return channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
// // Beispiel: weißer Text auf blauem Hintergrund
// const foreground = [255, 255, 255];
// const background = [40, 80, 120];

// const result = getContrastInfo(foreground, background);

// console.log(result.ratioText);      // z. B. "5.12:1"
// console.log(result.normalTextAA);   // true/false
// console.log(result.largeTextAA);    // true/false
// console.log(result.normalTextAAA);  // true/false
// console.log(result.largeTextAAA);   // true/false
function getContrastInfo(color1, color2) {
  const L1 = relativeLuminance(color1);
  const L2 = relativeLuminance(color2);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  let badge = '✕ Fail';
  let badgeClass = 'fail';
  let badgeTitle = 'Fails WCAG (< 3:1)';

  if (ratio >= 7) {
    badge = '✓ AAA';
    badgeClass = 'pass aaa';
    badgeTitle = 'Passes WCAG AAA (Enhanced contrast >= 7:1)';
  } else if (ratio >= 4.5) {
    badge = '✓ AA';
    badgeClass = 'pass aa';
    badgeTitle = 'Passes WCAG AA (Normal text >= 4.5:1)';
  } else if (ratio >= 3) {
    badge = '✓ AA+';
    badgeClass = 'pass large';
    badgeTitle = 'Passes WCAG AA for Large text only (>= 3:1)';
  }

  const infoColor = ((L2 + 0.05) / 0.05 >= 1.05 / (L2 + 0.05)) ? '#000000' : '#ffffff';

  return {
    ratio,
    ratioText: `${ratio.toFixed(2)}:1`,
    badge,
    badgeClass,
    badgeTitle,
    infoColor,
    normalTextAA: ratio >= 4.5,
    normalTextAAA: ratio >= 7,
    largeTextAA: ratio >= 3,
    largeTextAAA: ratio >= 4.5,
  };
}

