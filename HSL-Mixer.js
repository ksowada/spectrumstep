var hslInit = false; // hsl initialition possible
// TODO need swap colors sometimes as action next to use c1
var params_cmx = {
  p1: { name: 'Color 1', type: 'place'},
  // a1: { type: 'popup',value: 'Action', callbackName: 'calcform_cmx_col1_action'},
  c1: { name: 'RGB', type: 'color', unit: 'hex', callbackName: 'calcform_cmx_rgb1'},
  h1: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, max: 360, round:0, callbackName: 'calcform_cmx_hsl1' },
  s1: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, max: 100, round:0, callbackName: 'calcform_cmx_hsl1' },
  l1: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, max: 100, round:0, callbackName: 'calcform_cmx_hsl1' },
  p2: { name: 'Color 2', type: 'place'},
  a2: { type: 'button',value: 'Use C1', callbackName: 'calcform_cmx_col2_action'},
  c2: { name: 'RGB', type: 'color', unit: 'hex',callbackName: 'calcform_cmx_rgb2'},
  h2: { name: 'H', type: 'number', unit: '°', value: 0, min: 0, max: 360, round:0, callbackName: 'calcform_cmx_hsl2' },
  s2: { name: 'S', type: 'number', unit: '%', value: 0, min: 0, max: 100, round:0, callbackName: 'calcform_cmx_hsl2' },
  l2: { name: 'L', type: 'number', unit: '%', value: 0, min: 0, max: 100, round:0, callbackName: 'calcform_cmx_hsl2' },
  p3: { name: 'Option', type: 'place'},
  chc: { name: 'Count', type: 'number', value: 4, min: 2, max: 16, step: 1, callbackName: 'calcform_cmx_dyna' },
  hsl: { name: 'HSL-Gradient', type: 'checkbox',value:hslInit,callbackName:'calcform_cmx_dyna'},
  inv: { name: 'Inversion', type: 'checkbox',value:false,callbackName:'calcform_cmx_dyna'},
};
var colCnt = 1;
var rgbPreArr1 = ['#ff0000', '#00ff00', '#0000ff'];
var rgbPreArr2 = ['#ff8080', '#80ff80', '#8080ff'];
var hslPreArr1 = [[200,50,50],[350,50,50],[80,50,50]];
var hslPreArr2 = [[200,50,90],[350,50,90],[80,50,90]];
var params_cmx_arr = [];
var inp_cmx_arr = [];
var c = [];
var rgb1 = [[]];
var rgb2 = [[]];
var rgb1h = rgbPreArr1;
var rgb2h = rgbPreArr2;
var hsl1 = [[],[],[]];
var hsl2 = [[],[],[]];
var rowCnt = [];
var inversEn = [];
for (var i = 0; i < colCnt; i++) {
  params_cmx_arr[i] = params_cmx;
  params_cmx_arr[i].c1.value = rgbPreArr1[i];
  params_cmx_arr[i].c2.value = rgbPreArr2[i];
  inp_cmx_arr[i] = new InputHtml({obj: 'inp_cmx_arr['+i+']', params: params_cmx_arr[i], el: 'form-cmx'+i, callbackName: 'calcform_cmx_doml', callbackArgs: i, callAtInit: false, storageEn:true});
}
var storage = new Storage({unit:'color-mixer',storageEn:true});

/** initialisiere Anfangsfarben */
function calcform_cmx_init() {
  storage.loadInit({el:'loadSelect-cmx',callbackName:'calcform_cmx_onLoad'});
  storage.saveInit({el:'saveSelect-cmx',callbackName:'calcform_cmx_onSave'});
  for (var i=0; i<colCnt; i++) {
    inp_cmx_arr[i].init();
    if (hslInit) {
      inp_cmx_arr[i].set('h1',hslPreArr1[i][0]);
      inp_cmx_arr[i].set('s1',hslPreArr1[i][1]);
      inp_cmx_arr[i].set('l1',hslPreArr1[i][2]);
      inp_cmx_arr[i].set('h2',hslPreArr2[i][0]);
      inp_cmx_arr[i].set('s2',hslPreArr2[i][1]);
      inp_cmx_arr[i].set('l2',hslPreArr2[i][2]);
    } else {
      inp_cmx_arr[i].set('c1',rgbPreArr1[i]);
      inp_cmx_arr[i].set('c2',rgbPreArr2[i]);
    }
  }
}
/** berechne HSL */
function calcform_cmx_doml(i) {
    if (hslInit) {
      calcform_cmx_hsl1(i, true);
      calcform_cmx_hsl2(i, true);
    } else {
      calcform_cmx_rgb1(i, true);
      calcform_cmx_rgb2(i, true);
    }
    calcform_cmx_dyna(i);
}
/** berechne HSL */
function calcform_cmx_hsl_range(i, nr, h, s, l) {
  document.getElementById(inp_cmx_arr[i].getId('h'+nr,'range')).style.background = `linear-gradient(90deg in hsl longer hue, hsl(0, ${s}%, ${l}%), hsl(0, ${s}%, ${l}%)`;
  document.getElementById(inp_cmx_arr[i].getId('s'+nr,'range')).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%)`;
  document.getElementById(inp_cmx_arr[i].getId('l'+nr,'range')).style.background = `linear-gradient(90deg in hsl shorter hue, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 100%)`;

}
function calcform_cmx_rgb1(i, init) {
  inp_cmx_arr[i].set('hsl',false);
  c[i] = inp_cmx_arr[i].get('c1');
  rgb1[i] = hexToRgb(c[i]);
  hsl1[i] = rgbToHsl(rgb1[i]);
  const hsl_0 = Math.round(hsl1[i][0] * 360)
  const hsl_1 = Math.round(hsl1[i][1] * 100)
  const hsl_2 = Math.round(hsl1[i][2] * 100)
  calcform_cmx_hsl_range(i, 1, hsl_0, hsl_1, hsl_2)
  inp_cmx_arr[i].set('h1', hsl1[i][0] * 360);
  inp_cmx_arr[i].set('s1', hsl1[i][1] * 100);
  inp_cmx_arr[i].set('l1', hsl1[i][2] * 100);
  var rgb_per = hslToRgb(hsl1[i][0],hsl1[i][1],hsl1[i][2]);
  rgb1h[i] = rgbToColor(rgb_per);
  inp_cmx_arr[i].set('c1', rgb1h[i]);
  if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne RGB von HSL */
function calcform_cmx_rgb2(i, init) {
  inp_cmx_arr[i].set('hsl',false);
  c[i] = inp_cmx_arr[i].get('c2');
  rgb2[i] = hexToRgb(c[i]);
  hsl2[i] = rgbToHsl(rgb2[i]);
  const hsl_0 = Math.round(hsl2[i][0] * 360)
  const hsl_1 = Math.round(hsl2[i][1] * 100)
  const hsl_2 = Math.round(hsl2[i][2] * 100)
  calcform_cmx_hsl_range(i, 2, hsl_0, hsl_1, hsl_2)
  inp_cmx_arr[i].set('h2', hsl2[i][0] * 360);
  inp_cmx_arr[i].set('s2', hsl2[i][1] * 100);
  inp_cmx_arr[i].set('l2', hsl2[i][2] * 100);
  var rgb_per = hslToRgb(hsl2[i][0],hsl2[i][1],hsl2[i][2]);
  rgb2h[i] = rgbToColor(rgb_per);
  inp_cmx_arr[i].set('c2', rgb2h[i]);
  if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne RGB von HSL */
function calcform_cmx_hsl1(i, init) {
  inp_cmx_arr[i].set('hsl',true);
  hsl1[i][0] = inp_cmx_arr[i].get('h1')/360;
  hsl1[i][1] = inp_cmx_arr[i].get('s1')/100;
  hsl1[i][2] = inp_cmx_arr[i].get('l1')/100;
  const hsl_0 = Math.round(hsl1[i][0] * 360)
  const hsl_1 = Math.round(hsl1[i][1] * 100)
  const hsl_2 = Math.round(hsl1[i][2] * 100)
  calcform_cmx_hsl_range(i, 1, hsl_0, hsl_1, hsl_2)
  var rgb_per = hslToRgb(hsl1[i][0],hsl1[i][1],hsl1[i][2]);
  rgb1h[i] = rgbToColor(rgb_per);
  inp_cmx_arr[i].set('c1', rgb1h[i]);
  if (init == undefined) calcform_cmx_dyna(i);
}
function calcform_cmx_hsl2(i, init) {
  inp_cmx_arr[i].set('hsl',true);
  hsl2[i][0] = inp_cmx_arr[i].get('h2')/360;
  hsl2[i][1] = inp_cmx_arr[i].get('s2')/100;
  hsl2[i][2] = inp_cmx_arr[i].get('l2')/100;
  const hsl_0 = Math.round(hsl2[i][0] * 360)
  const hsl_1 = Math.round(hsl2[i][1] * 100)
  const hsl_2 = Math.round(hsl2[i][2] * 100)
  calcform_cmx_hsl_range(i, 2, hsl_0, hsl_1, hsl_2)
  var rgb_per = hslToRgb(hsl2[i][0],hsl2[i][1],hsl2[i][2]);
  rgb2h[i] = rgbToColor(rgb_per);
  inp_cmx_arr[i].set('c2', rgb2h[i]);
  if (init == undefined) calcform_cmx_dyna(i);
}
/** berechne Farbtabelle */
function calcform_cmx_dyna(i) {
  rowCnt[i] = inp_cmx_arr[i].get('chc');
  inversEn[i] = inp_cmx_arr[i].get('inv');
  var hslMixEn = inp_cmx_arr[i].get('hsl');
  var colArr;
  var colArrInv;
  // vergleiche rgb1 und rgb2 um in beide Richtungen zu blenden
  if (hslMixEn) {
    colArr = getHSLColors({len: rowCnt[i], hsl1: hsl1[i], hsl2: hsl2[i]});
    if (inversEn[i]) {
      var hsl0 = [];
      for (var j=0; j<3; j++) {
        var xd = hsl2[i][j]-hsl1[i][j];
        var xh = xd;
        if (xd>0.5) xh = -1 + xd; 
        if (xd<-0.5) xh = 1 + xd;
        hsl0[j] = hsl1[i][j]-xh;
      }    
      hsl0[0] = hueBound(hsl0[0]);
      hsl0[1] = bound(hsl0[1],0,1);
      hsl0[2] = bound(hsl0[2],0,1);
      colArrInv = getHSLColors({len: rowCnt[i], hsl1: hsl0, hsl2: hsl1[i]});
    }
    // this hack is for accuracy of rgb c1 and c2. When hsl interpolated sometimes calc is inaccurate
    colArr[0] = inp_cmx_arr[i].get('c1');
    colArr[rowCnt[i]-1] = inp_cmx_arr[i].get('c2');
  } else {
    c[i] = inp_cmx_arr[i].get('c1');
    rgb1[i] = hexToRgb(c[i]);
    c[i] = inp_cmx_arr[i].get('c2');
    rgb2[i] = hexToRgb(c[i]);
    colArr = getRGBColors({len: rowCnt[i], c1: rgb1h[i], c2: rgb2h[i]});
    if (inversEn[i]) {
      var rgbD = [];
      var rgb0 = [];
      for (var j=0; j<3; j++) {
        rgbD[j] = rgb2[i][j]-rgb1[i][j];
        rgb0[j] = rgb1[i][j]-rgbD[j];
      }
      var rgb0h = rgbToColor(rgb0);
      colArrInv = getRGBColors({len: rowCnt[i], rgb1: rgb0, rgb2: rgb1[i]});
    }
  }
  var html = '<table class="plain"><tbody>';
  if (inversEn[i]) for (var rowIx = 0; rowIx < rowCnt[i]-1; rowIx++) {
    html += '<tr>';
    html += '<td><input value="'+colArrInv[rowIx]+'" style="background-color:'+colArrInv[rowIx]+'"/></td>';
    html += '</tr>';
  }  
  for (var rowIx = 0; rowIx < rowCnt[i]; rowIx++) {
    html += '<tr>';
    html += '<td><input value="'+colArr[rowIx]+'" style="background-color:'+colArr[rowIx]+'"/></td>';
    html += '</tr>';
  }
  html += '</tbody>';
  html += '</table>';
  document.getElementById('tab-cmx'+i).innerHTML = html;
}
function calcform_cmx_onLoad() {
  var data = storage.loadSetting();
  if (data===null) return;
  rgb1h = data.rgb1h;
  rgb2h = data.rgb2h;
  rowCnt = data.rowCnt;
  inversEn = data.inversEn;
  for (i=0; i<colCnt; i++) {
    inp_cmx_arr[i].set('c1', rgb1h[i]);
    inp_cmx_arr[i].set('c2', rgb2h[i]);
    calcform_cmx_rgb1(i,true);
    calcform_cmx_rgb2(i,true);
    inp_cmx_arr[i].set('chc',rowCnt[i]);
    inp_cmx_arr[i].set('inv' ,inversEn[i]);
    calcform_cmx_dyna(i);
  }
}
function calcform_cmx_onSave() {
  var data = {rgb1h:rgb1h, rgb2h:rgb2h, rowCnt:rowCnt, inversEn:inversEn};
  storage.saveSetting({data:data});
}
function calcform_cmx_col1_action(args) {
  log('popup:'+args);
}
function calcform_cmx_col2_action(i) {
  inp_cmx_arr[i].set('c2', rgb1h[i]);
  calcform_cmx_rgb2(i);
}
document.addEventListener('DOMContentLoaded', function () {
  calcform_cmx_init();
  for (i=0; i<colCnt; i++) {
    calcform_cmx_doml(i);
  }
});