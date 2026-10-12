
/** Macht aus einem String unabh&auml;ngig, ob mit Komma oder Punkt
 geschrieben einen float zurück */
function getFloatOfText(preis) {
  if (preis.length == 0) preis="0";
  preis = preis.replace(/[,]/,'.');
  preis = parseFloat(preis);
  return preis;
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
function getTextOfFloat(wert) {
  wert = String(wert);  // konvertiere nach String
  // wert = wert.replace(/[.]/,',');
  return wert;
}
// add missing zeros after digits, standard is integer
function getTextOfRound(wert,decimals) {
  decimals = (decimals !== undefined) ? decimals : 0;
  wert = Number.parseFloat(wert).toFixed(-decimals);
  wert = String(wert);  // konvertiere nach String
  wert = wert.replace(/[.]/,',');
  return wert;
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
  if (hue<0) hue = hue+1;
  if (hue>1) hue = hue-1;
  return hue;
}
function rgbCorrect(value) {  
  value = (value.charAt(0)=='#') ? value : '#'+value; // set # if not given
  value = (value.charAt(1)=='#') ? value.substr(1) : value; // delete # if given ##
  return value;
}
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
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
function rgbToHsl(args){
  var r = args[0];
  var g = args[1];
  var b = args[2];

  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if(max == min){
      h = s = 0; // achromatic
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
/** convert array of r,g,b into hexcolor  */
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
  if (hue === undefined) {
    return x1 + (x2-x1)*r;
  } else {
    var xd = x2 - x1;
    var xh = xd;
    // hue is bigger than half, other way is right
    if (xd>0.5) xh = -1 + xd; 
    if (xd<-0.5) xh = 1 + xd;
    // if (xd<0.5) xh = -1 + xd;
    // var xh = (xd>0.5) ? -1 + xd :  xd;
    var hueBounded = hueBound(x1 + xh*r);
    return hueBounded;
  }
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
  var rgbStringShorted = rgbString.substr(1);
  for (var i=0;i<3;i++) {
    var rgbToken = rgbString.substr(0+i*2,2);
    var rgbValue = parseInt(rgbToken, 16);
    rgbArray.push(rgbValue);
  }
  return rgbArray;
}
