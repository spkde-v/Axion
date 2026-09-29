/**
 * Axion render kit — draws flat, soft SVG illustrations of keyboards and
 * switches. Used by the Build Your Keyboard section for the live preview.
 *
 * Layout rows are strings of space separated tokens:
 *   "1"      a 1u key         "2.25m"  a 2.25u modifier key
 *   "1x"     accent key       "-0.5"   a 0.5u gap
 * A row equal to "gap" inserts a quarter-unit vertical gap.
 */
(function (root) {
  'use strict';

  var LAYOUTS = {
    '60': [
      '1x 1 1 1 1 1 1 1 1 1 1 1 1 2m',
      '1.5m 1 1 1 1 1 1 1 1 1 1 1 1 1.5m',
      '1.75m 1 1 1 1 1 1 1 1 1 1 1 2.25x',
      '2.25m 1 1 1 1 1 1 1 1 1 1 2.75m',
      '1.25m 1.25m 1.25m 6.25 1.25m 1.25m 1.25m 1.25m'
    ],
    '65': [
      '1x 1 1 1 1 1 1 1 1 1 1 1 1 2m 1m',
      '1.5m 1 1 1 1 1 1 1 1 1 1 1 1 1.5m 1m',
      '1.75m 1 1 1 1 1 1 1 1 1 1 1 2.25x 1m',
      '2.25m 1 1 1 1 1 1 1 1 1 1 1.75m 1m 1m',
      '1.25m 1.25m 1.25m 6.25 1m 1m 1m 1m 1m 1m'
    ],
    '75': [
      '1x -0.5 1m 1m 1m 1m -0.5 1 1 1 1 -0.5 1m 1m 1m 1m -0.5 1m',
      'gap',
      '1 1 1 1 1 1 1 1 1 1 1 1 1 2m 1m',
      '1.5m 1 1 1 1 1 1 1 1 1 1 1 1 1.5m 1m',
      '1.75m 1 1 1 1 1 1 1 1 1 1 1 2.25x 1m',
      '2.25m 1 1 1 1 1 1 1 1 1 1 1.75m 1m 1m',
      '1.25m 1.25m 1.25m 6.25 1m 1m 1m 1m 1m 1m'
    ],
    tkl: [
      '1x -1 1m 1m 1m 1m -0.5 1 1 1 1 -0.5 1m 1m 1m 1m -0.25 1m 1m 1m',
      'gap',
      '1 1 1 1 1 1 1 1 1 1 1 1 1 2m -0.25 1m 1m 1m',
      '1.5m 1 1 1 1 1 1 1 1 1 1 1 1 1.5m -0.25 1m 1m 1m',
      '1.75m 1 1 1 1 1 1 1 1 1 1 1 2.25x',
      '2.25m 1 1 1 1 1 1 1 1 1 1 2.75m -1.25 1m',
      '1.25m 1.25m 1.25m 6.25 1.25m 1.25m 1.25m 1.25m -0.25 1m 1m 1m'
    ]
  };

  // Key legends per layout row (gaps excluded). Each label maps to a
  // KeyboardEvent.code-like name so pages can light keys as people type.
  var ROW_65 = [
    'Esc 1 2 3 4 5 6 7 8 9 0 - = Bksp Del',
    'Tab Q W E R T Y U I O P [ ] \\ PgUp',
    "Caps A S D F G H J K L ; ' Enter PgDn",
    'Shift Z X C V B N M , . / Shift ↑ End',
    'Ctrl Win Alt Space Alt Fn Ctrl ← ↓ →'
  ];
  var LEGENDS = {
    '60': [
      'Esc 1 2 3 4 5 6 7 8 9 0 - = Bksp',
      'Tab Q W E R T Y U I O P [ ] \\',
      "Caps A S D F G H J K L ; ' Enter",
      'Shift Z X C V B N M , . / Shift',
      'Ctrl Win Alt Space Alt Fn Menu Ctrl'
    ],
    '65': ROW_65,
    '75': ['Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 Del', 'gap', '` 1 2 3 4 5 6 7 8 9 0 - = Bksp Home'].concat(ROW_65.slice(1))
  };

  var CODES = {
    Esc: 'escape', '`': 'backquote', '-': 'minus', '=': 'equal', Bksp: 'backspace', Tab: 'tab', '[': 'bracketleft',
    ']': 'bracketright', '\\': 'backslash', Caps: 'capslock', ';': 'semicolon', "'": 'quote', Enter: 'enter',
    Shift: 'shift', ',': 'comma', '.': 'period', '/': 'slash', Ctrl: 'control', Win: 'meta', Alt: 'alt', Space: 'space',
    Fn: 'fn', Menu: 'contextmenu', Del: 'delete', Home: 'home', PgUp: 'pageup', PgDn: 'pagedown', End: 'end',
    '←': 'arrowleft', '→': 'arrowright', '↑': 'arrowup', '↓': 'arrowdown'
  };

  function codeFor(label) {
    if (/^[A-Z]$/.test(label)) return 'key' + label.toLowerCase();
    if (/^[0-9]$/.test(label)) return 'digit' + label;
    if (/^F[0-9]+$/.test(label)) return label.toLowerCase();
    return CODES[label] || label.toLowerCase();
  }

  /** Normalises a KeyboardEvent.code to the names used in data-k attributes. */
  function normalizeCode(code) {
    return String(code || '').toLowerCase().replace(/(left|right)$/, '').replace(/^numpad/, '');
  }

  var DEFAULTS = {
    layout: '65',
    caseColor: '#97A87A',
    alpha: '#FCF9EA',
    mod: '#A8BBA3',
    accent: '#DB9558',
    stem: '#DB9558'
  };

  function hexToRgb(hex) {
    var h = String(hex || '').replace('#', '').trim();
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(h)) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }

  function rgbToHex(rgb) {
    return (
      '#' +
      rgb
        .map(function (v) {
          var s = Math.max(0, Math.min(255, Math.round(v))).toString(16);
          return s.length === 1 ? '0' + s : s;
        })
        .join('')
    );
  }

  /** Mixes a color with black (amount > 0) or white (amount < 0). */
  function shade(hex, amount) {
    var rgb = hexToRgb(hex);
    if (!rgb) return hex;
    var target = amount > 0 ? 0 : 255;
    var t = Math.abs(amount);
    return rgbToHex(
      rgb.map(function (v) {
        return v + (target - v) * t;
      })
    );
  }

  function isColor(value) {
    return !!hexToRgb(value);
  }

  function parseRows(layout) {
    var rows = LAYOUTS[layout] || LAYOUTS[DEFAULTS.layout];
    return rows.map(function (row) {
      if (row === 'gap') return 'gap';
      return row.split(' ').map(function (token) {
        var width = parseFloat(token);
        var role = token.replace(/[-0-9.]/g, '') || 'a';
        return { width: Math.abs(width), gap: width < 0, role: role };
      });
    });
  }

  /**
   * Renders a keyboard SVG string.
   * @param {object} opts - { layout, caseColor, alpha, mod, accent, id }
   */
  function keyboard(opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    ['caseColor', 'alpha', 'mod', 'accent'].forEach(function (k) {
      if (!isColor(o[k])) o[k] = DEFAULTS[k];
    });

    var U = 54;
    var PAD = 26;
    var rows = parseRows(o.layout);
    var colors = { a: o.alpha, m: o.mod, x: o.accent };

    var legendRows = LEGENDS[o.layout] || null;
    var keys = [];
    var y = 0;
    var maxX = 0;
    rows.forEach(function (row, rowIndex) {
      if (row === 'gap') {
        y += U * 0.25;
        return;
      }
      var labels = legendRows && legendRows[rowIndex] ? legendRows[rowIndex].split(' ') : [];
      var x = 0;
      var i = 0;
      row.forEach(function (k) {
        if (!k.gap) {
          var label = labels[i++] || '';
          keys.push({ x: x, y: y, w: k.width * U, role: k.role, label: label });
        }
        x += k.width * U;
      });
      maxX = Math.max(maxX, x);
      y += U;
    });

    var w = maxX + PAD * 2;
    var h = y + PAD * 2;
    var shadowH = 26;
    var out = [];

    out.push(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        w +
        ' ' +
        (h + shadowH) +
        '" role="img" aria-label="' +
        (o.label || 'Keyboard preview') +
        '">'
    );
    // Soft ground shadow
    out.push(
      '<ellipse cx="' + w / 2 + '" cy="' + (h + 4) + '" rx="' + (w / 2 - 20) + '" ry="16" fill="#2F2B22" opacity=".09"/>'
    );
    // Case: bottom lip + top
    out.push('<rect x="0" y="6" width="' + w + '" height="' + h + '" rx="30" fill="' + shade(o.caseColor, 0.2) + '"/>');
    out.push('<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="30" fill="' + o.caseColor + '"/>');
    // Plate well
    out.push(
      '<rect x="' +
        (PAD - 8) +
        '" y="' +
        (PAD - 8) +
        '" width="' +
        (maxX + 16) +
        '" height="' +
        (y + 16) +
        '" rx="16" fill="' +
        shade(o.caseColor, 0.28) +
        '"/>'
    );

    keys.forEach(function (k) {
      var c = colors[k.role] || o.alpha;
      var kx = PAD + k.x + 2.5;
      var ky = PAD + k.y + 2.5;
      var kw = k.w - 5;
      var kh = U - 5;
      out.push('<g class="kb-key"' + (k.label ? ' data-k="' + codeFor(k.label) + '"' : '') + '>');
      out.push(
        '<rect x="' + kx + '" y="' + ky + '" width="' + kw + '" height="' + kh + '" rx="9" fill="' + shade(c, 0.16) + '"/>'
      );
      out.push(
        '<rect x="' +
          (kx + 5) +
          '" y="' +
          (ky + 3) +
          '" width="' +
          (kw - 10) +
          '" height="' +
          (kh - 12) +
          '" rx="7" fill="' +
          c +
          '"/>'
      );
      // Homing bars on the space bar give the board some character.
      if (k.w >= U * 6) {
        out.push(
          '<rect x="' +
            (kx + kw / 2 - 18) +
            '" y="' +
            (ky + kh / 2 - 4) +
            '" width="36" height="3" rx="1.5" fill="' +
            shade(c, 0.22) +
            '"/>'
        );
      } else if (o.legends && k.label) {
        var text = k.label.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        out.push(
          '<text x="' + (kx + 11) + '" y="' + (ky + 17) + '" font-size="' + (text.length > 2 ? 9 : 11) +
            '" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" fill="' + shade(c, 0.55) + '">' + text + '</text>'
        );
      }
      out.push('</g>');
    });

    out.push('</svg>');
    return out.join('');
  }

  /** Renders a single mechanical switch (front view). */
  function keySwitch(opts) {
    var o = Object.assign({ stem: DEFAULTS.stem, housing: '#F1EBD3', base: '#97A87A' }, opts || {});
    if (!isColor(o.stem)) o.stem = DEFAULTS.stem;
    if (!isColor(o.housing)) o.housing = '#F1EBD3';
    var line = shade(o.housing, 0.22);
    if (!isColor(o.base)) o.base = '#97A87A';
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" role="img" aria-label="' + (o.label || 'Switch') + '">',
      '<ellipse cx="100" cy="206" rx="70" ry="9" fill="#2F2B22" opacity=".09"/>',
      // pins
      '<rect x="72" y="176" width="6" height="24" rx="3" fill="#C9A66B"/>',
      '<rect x="122" y="176" width="6" height="18" rx="3" fill="#C9A66B"/>',
      '<rect x="95" y="176" width="10" height="16" rx="5" fill="' + shade(o.base, 0.25) + '"/>',
      // bottom housing
      '<path d="M34 118h132l-8 54a10 10 0 0 1-10 8H52a10 10 0 0 1-10-8z" fill="' + o.base + '"/>',
      '<rect x="26" y="108" width="148" height="18" rx="7" fill="' + shade(o.base, 0.12) + '"/>',
      // top housing
      '<path d="M46 64h108a8 8 0 0 1 8 7.5l2.5 38.5H35.5L38 71.5A8 8 0 0 1 46 64z" fill="' + o.housing + '" stroke="' + line + '" stroke-width="3" stroke-linejoin="round"/>',
      '<path d="M58 76h84" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".7"/>',
      '<rect x="60" y="88" width="10" height="10" rx="3" fill="' + line + '" opacity=".6"/>',
      // stem
      '<rect x="84" y="28" width="32" height="40" rx="6" fill="' + shade(o.stem, 0.14) + '"/>',
      '<rect x="92" y="14" width="16" height="34" rx="4" fill="' + o.stem + '"/>',
      '<rect x="80" y="26" width="40" height="12" rx="4" fill="' + o.stem + '"/>',
      '</svg>'
    ].join('');
  }

  /** Renders a small cluster of loose keycaps. */
  function keycaps(opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    function cap(x, y, w, color, rot) {
      return (
        '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')">' +
        '<path d="M0 12a12 12 0 0 1 12-12h' + (w - 24) + 'a12 12 0 0 1 12 12v54a12 12 0 0 1-12 12H12A12 12 0 0 1 0 66z" fill="' + shade(color, 0.18) + '"/>' +
        '<rect x="10" y="4" width="' + (w - 20) + '" height="56" rx="10" fill="' + color + '"/>' +
        '<rect x="' + (w / 2 - 9) + '" y="28" width="18" height="3" rx="1.5" fill="' + shade(color, 0.25) + '" opacity=".6"/>' +
        '</g>'
      );
    }
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 220" role="img" aria-label="' + (o.label || 'Keycaps') + '">',
      '<ellipse cx="150" cy="200" rx="120" ry="10" fill="#2F2B22" opacity=".09"/>',
      cap(40, 96, 150, o.mod, -4),
      cap(196, 92, 78, o.accent, 6),
      cap(60, 18, 78, o.alpha, -8),
      cap(146, 12, 78, o.alpha, 3),
      '</svg>'
    ].join('');
  }

  var api = { normalizeCode: normalizeCode, keyboard: keyboard, keySwitch: keySwitch, keycaps: keycaps, shade: shade, isColor: isColor, layouts: Object.keys(LAYOUTS), defaults: DEFAULTS };

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.AxionRender = api;
  }
})(typeof window !== 'undefined' ? window : this);
