/* Axion — Build Your Keyboard */
(function () {
  'use strict';

  var KEY_COUNTS = { '60': 61, '65': 68, '75': 84, tkl: 87 };
  var STEPS = ['base', 'switch', 'caps'];
  var CHECK =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4.5 10.5 3.5 3.5 7.5-8"/></svg>';
  var SWITCH_STEMS = { linear: '#DB9558', tactile: '#8C6B4F', clicky: '#7E9BA6' };

  /* Demo catalogue so the builder looks alive before collections are connected. */
  function demoOption(id, title, price, tags) {
    return { id: id, demo: true, title: title, image: null, tags: tags, variants: [{ id: null, title: 'Default Title', price: price, available: true }] };
  }

  var DEMO = {
    base: [
      demoOption('d-b1', 'Axion 65 · Sage', 14900, ['layout:65', 'case:#97A87A']),
      demoOption('d-b2', 'Axion 75 · Oat', 17900, ['layout:75', 'case:#EDE5CC']),
      demoOption('d-b3', 'Axion 60 · Clay', 12900, ['layout:60', 'case:#DB9558']),
      demoOption('d-b4', 'Axion TKL · Moss', 19900, ['layout:tkl', 'case:#6F7F5A'])
    ],
    switch: [
      demoOption('d-s1', 'Oat Linear 45g', 3900, ['switch:linear', 'stem:#DB9558']),
      demoOption('d-s2', 'Walnut Tactile 62g', 4500, ['switch:tactile', 'stem:#8C6B4F']),
      demoOption('d-s3', 'Lake Clicky 55g', 3900, ['switch:clicky', 'stem:#7E9BA6'])
    ],
    caps: [
      demoOption('d-c1', 'Meadow PBT', 6900, ['cap:#FCF9EA', 'mod:#A8BBA3', 'accent:#DB9558']),
      demoOption('d-c2', 'Terracotta PBT', 7400, ['cap:#FFF6E8', 'mod:#DB9558', 'accent:#97A87A']),
      demoOption('d-c3', 'Olive Grove PBT', 7400, ['cap:#E4EAD9', 'mod:#97A87A', 'accent:#2F2B22']),
      demoOption('d-c4', 'Sandstone PBT', 6900, ['cap:#F1E4CF', 'mod:#CDB48F', 'accent:#DB9558'])
    ]
  };

  function parseTags(tags) {
    var out = {};
    (tags || []).forEach(function (tag) {
      var i = tag.indexOf(':');
      if (i < 1) return;
      out[tag.slice(0, i).trim().toLowerCase()] = tag.slice(i + 1).trim();
    });
    if (out.layout) out.layout = out.layout.toLowerCase().replace('%', '');
    if (out.switch) out.switch = out.switch.toLowerCase();
    return out;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function Builder(root) {
    this.root = root;
    this.data = JSON.parse(root.querySelector('[data-builder-data]').textContent);
    this.render = window.AxionRender;
    this.money = (window.Axion && window.Axion.formatMoney) || function (c) { return (c / 100).toFixed(2); };
    this.options = {};
    this.selection = {};
    this.init();
  }

  Builder.prototype.init = function () {
    var self = this;
    var params = new URLSearchParams(window.location.search);

    STEPS.forEach(function (step) {
      var list = (self.data.steps[step] || DEMO[step]).map(function (option) {
        option.meta = parseTags(option.tags);
        return option;
      });
      if (self.data.allowSkip[step]) {
        list.push({ id: 'none', skip: true, title: self.data.strings.skipTitle, meta: {}, variants: [{ id: null, price: 0, available: true }] });
      }
      self.options[step] = list;

      var wanted = params.get(step);
      var index = list.findIndex(function (o) {
        return String(o.id) === wanted;
      });
      if (index < 0) {
        index = list.findIndex(function (o) {
          return o.variants.some(function (v) { return v.available; });
        });
      }
      self.selection[step] = { index: Math.max(0, index), variant: 0 };
      var firstAvailable = list[self.selection[step].index].variants.findIndex(function (v) { return v.available; });
      self.selection[step].variant = Math.max(0, firstAvailable);
    });

    STEPS.forEach(function (step) {
      self.renderOptions(step);
    });

    this.root.addEventListener('change', function (event) {
      var target = event.target;
      if (target.matches('input[data-step-input]')) {
        var step = target.getAttribute('data-step-input');
        var option = self.options[step][Number(target.value)];
        var variantIndex = option.variants.findIndex(function (v) { return v.available; });
        self.selection[step] = { index: Number(target.value), variant: Math.max(0, variantIndex) };
        var select = target.closest('.option').querySelector('select');
        if (select) select.value = String(self.selection[step].variant);
        self.update();
      } else if (target.matches('select[data-variant-select]')) {
        var s = target.getAttribute('data-variant-select');
        var card = target.closest('.option');
        var radio = card.querySelector('input[type="radio"]');
        radio.checked = true;
        self.selection[s] = { index: Number(radio.value), variant: Number(target.value) };
        self.update();
      } else if (target.matches('[data-assembly]')) {
        self.update();
      }
    });

    this.root.querySelectorAll('[data-add-build]').forEach(function (button) {
      button.addEventListener('click', function () {
        self.addToCart(button);
      });
    });

    this.update();
  };

  Builder.prototype.optionMedia = function (step, option) {
    if (option.skip) return '<span class="option__media option__media--skip" aria-hidden="true"></span>';
    if (option.image) {
      return '<span class="option__media"><img src="' + option.image + '" alt="" loading="lazy" width="600" height="450"></span>';
    }
    var m = option.meta;
    var svg = '';
    if (!this.render) return '<span class="option__media"></span>';
    if (step === 'base') {
      svg = this.render.keyboard({ layout: m.layout, caseColor: m.case, label: option.title });
    } else if (step === 'switch') {
      svg = this.render.keySwitch({ stem: m.stem || SWITCH_STEMS[m.switch], label: option.title });
    } else {
      svg = this.render.keycaps({ alpha: m.cap, mod: m.mod, accent: m.accent, label: option.title });
    }
    return '<span class="option__media">' + svg + '</span>';
  };

  Builder.prototype.optionTag = function (step, option) {
    var m = option.meta;
    var s = this.data.strings;
    if (option.skip) return s.skipText;
    if (step === 'base' && m.layout) return (m.layout === 'tkl' ? 'TKL' : m.layout + '%') + ' ' + s.layout;
    if (step === 'switch' && m.switch) return s.switchLabels[m.switch] || m.switch;
    return '';
  };

  Builder.prototype.renderOptions = function (step) {
    var self = this;
    var container = this.root.querySelector('[data-options="' + step + '"]');
    var selected = this.selection[step];
    container.innerHTML = this.options[step]
      .map(function (option, i) {
        var available = option.variants.some(function (v) { return v.available; });
        var price = option.variants[0].price;
        var variantSelect = '';
        if (option.variants.length > 1) {
          variantSelect =
            '<select class="select" data-variant-select="' + step + '" aria-label="' + escapeHtml(option.title) + '">' +
            option.variants
              .map(function (v, vi) {
                return (
                  '<option value="' + vi + '"' + (vi === (i === selected.index ? selected.variant : 0) ? ' selected' : '') +
                  (v.available ? '' : ' disabled') + '>' + escapeHtml(v.title) + '</option>'
                );
              })
              .join('') +
            '</select>';
        }
        return (
          '<label class="option' + (available ? '' : ' is-unavailable') + '">' +
          '<input type="radio" name="builder-' + step + '-' + self.root.id + '" value="' + i + '" data-step-input="' + step + '"' +
          (i === selected.index ? ' checked' : '') + (available ? '' : ' disabled') + '>' +
          '<span class="option__check">' + CHECK + '</span>' +
          self.optionMedia(step, option) +
          '<span class="option__title">' + escapeHtml(option.title) + '</span>' +
          '<span class="option__meta"><span>' +
          (option.skip ? '—' : available ? self.money(price) : self.data.strings.soldOut) +
          '</span><span class="muted">' + escapeHtml(self.optionTag(step, option)) + '</span></span>' +
          variantSelect +
          '</label>'
        );
      })
      .join('');
  };

  Builder.prototype.current = function (step) {
    var sel = this.selection[step];
    var option = this.options[step][sel.index];
    return { option: option, variant: option.variants[sel.variant] || option.variants[0] };
  };

  Builder.prototype.switchQuantity = function (layout) {
    var keys = KEY_COUNTS[layout] || KEY_COUNTS['65'];
    if (this.data.switchQuantity === 'per_switch') return { qty: keys, keys: keys };
    return { qty: Math.max(1, Math.ceil(keys / (this.data.switchPack || 70))), keys: keys };
  };

  Builder.prototype.buildId = function () {
    var self = this;
    var seed = STEPS.map(function (s) {
      var c = self.current(s);
      return String(c.variant.id || c.option.id);
    }).join('|');
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return 'AX-' + String(1000 + (h % 9000));
  };

  Builder.prototype.update = function () {
    var self = this;
    var base = this.current('base');
    var sw = this.current('switch');
    var caps = this.current('caps');
    var layout = base.option.meta.layout || '65';
    var switchType = sw.option.meta.switch;
    var switchQty = this.switchQuantity(layout);

    // Preview
    if (this.render) {
      this.root.querySelector('[data-preview]').innerHTML = this.render.keyboard({
        layout: layout,
        caseColor: base.option.meta.case,
        alpha: caps.option.meta.cap,
        mod: caps.option.meta.mod,
        accent: caps.option.meta.accent,
        label: [base.option.title, sw.option.title, caps.option.title].join(', ')
      });
      this.root.querySelector('[data-switch-preview]').innerHTML = this.render.keySwitch({
        stem: sw.option.meta.stem || SWITCH_STEMS[switchType]
      });
    }
    this.root.querySelector('[data-switch-name]').textContent =
      sw.option.skip ? sw.option.title : sw.option.title + (switchType ? ' · ' + (this.data.strings.switchLabels[switchType] || switchType) : '');
    this.root.querySelector('[data-build-id]').textContent = this.buildId();

    // Summary
    var total = 0;
    var rows = [];
    [
      ['base', base, 1, ''],
      ['switch', sw, switchQty.qty, this.data.strings.switchesQty.replace('[count]', switchQty.keys)],
      ['caps', caps, 1, '']
    ].forEach(function (row) {
      var item = row[1];
      if (item.option.skip) return;
      var line = item.variant.price * row[2];
      total += line;
      var variantTitle = item.variant.title && item.variant.title !== 'Default Title' ? item.variant.title : '';
      var sub = [variantTitle, row[3]].filter(Boolean).join(' · ');
      rows.push(
        '<li><span>' + escapeHtml(item.option.title) + (sub ? '<small>' + escapeHtml(sub) + '</small>' : '') +
          '</span><span>' + self.money(line) + '</span></li>'
      );
    });
    var assembly = this.root.querySelector('[data-assembly]');
    if (assembly && assembly.checked) total += Number(assembly.getAttribute('data-price')) || 0;

    this.root.querySelector('[data-summary]').innerHTML = rows.join('');
    this.root.querySelectorAll('[data-total]').forEach(function (el) {
      el.textContent = self.money(total);
    });

    // Progress pills
    STEPS.forEach(function (step) {
      var pill = self.root.querySelector('[data-progress="' + step + '"]');
      if (pill) pill.classList.toggle('is-done', !self.current(step).option.skip);
    });

    // Shareable URL
    var url = new URL(window.location.href);
    STEPS.forEach(function (step) {
      url.searchParams.set(step, String(self.current(step).option.id));
    });
    window.history.replaceState({}, '', url.toString());
  };

  Builder.prototype.addToCart = function (button) {
    var self = this;
    var message = this.root.querySelector('[data-build-message]');
    var buildId = this.buildId();
    var base = this.current('base');
    var layout = base.option.meta.layout || '65';
    var items = [];
    var hasDemo = false;

    STEPS.forEach(function (step) {
      var c = self.current(step);
      if (c.option.skip) return;
      if (c.option.demo || !c.variant.id) {
        hasDemo = true;
        return;
      }
      items.push({
        id: c.variant.id,
        quantity: step === 'switch' ? self.switchQuantity(layout).qty : 1,
        properties: { Build: buildId }
      });
    });

    var assembly = this.root.querySelector('[data-assembly]');
    if (assembly && assembly.checked) {
      items.push({ id: Number(assembly.value), quantity: 1, properties: { Build: buildId } });
    }

    if (hasDemo || !items.length) {
      message.textContent = this.data.strings.demo;
      message.classList.add('bump');
      return;
    }

    var buttons = this.root.querySelectorAll('[data-add-build]');
    buttons.forEach(function (b) { b.disabled = true; });

    window.Axion.addToCart(items)
      .then(function () {
        message.textContent = self.data.strings.added;
        window.location.href = window.Axion.routes.cart;
      })
      .catch(function (error) {
        message.textContent = error.message;
        buttons.forEach(function (b) { b.disabled = false; });
      });
  };

  function init(scope) {
    (scope || document).querySelectorAll('[data-builder]').forEach(function (root) {
      if (!root._builder) root._builder = new Builder(root);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(); });
  else init();

  document.addEventListener('shopify:section:load', function (event) {
    init(event.target);
  });
})();
