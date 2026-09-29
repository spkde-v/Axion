/* Axion theme scripts — small, dependency free. */
(function () {
  'use strict';

  var config = window.Axion || { routes: {}, strings: {} };

  /* ---------- Money ---------- */
  function formatMoney(cents, format) {
    format = format || config.moneyFormat || '${{amount}}';
    if (typeof cents === 'string') cents = cents.replace('.', '');
    cents = Number(cents) || 0;

    function withDelimiters(number, precision, thousands, decimal) {
      thousands = thousands === undefined ? ',' : thousands;
      decimal = decimal === undefined ? '.' : decimal;
      var parts = (number / 100).toFixed(precision).split('.');
      var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
      return dollars + (parts[1] ? decimal + parts[1] : '');
    }

    return format.replace(/\{\{\s*(\w+)\s*\}\}/, function (_, key) {
      switch (key) {
        case 'amount_no_decimals':
          return withDelimiters(cents, 0);
        case 'amount_with_comma_separator':
          return withDelimiters(cents, 2, '.', ',');
        case 'amount_no_decimals_with_comma_separator':
          return withDelimiters(cents, 0, '.', ',');
        case 'amount_with_apostrophe_separator':
          return withDelimiters(cents, 2, "'", '.');
        case 'amount_with_space_separator':
          return withDelimiters(cents, 2, ' ', ',');
        default:
          return withDelimiters(cents, 2);
      }
    });
  }

  /* ---------- Cart helpers ---------- */
  function setCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-empty', !count);
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    });
  }

  function refreshCartCount() {
    return fetch((config.routes.cart || '/cart') + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json();
      })
      .then(function (cart) {
        setCartCount(cart.item_count);
        return cart;
      });
  }

  function addToCart(items) {
    return fetch((config.routes.cartAdd || '/cart/add') + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ items: items })
    }).then(function (r) {
      return r.json().then(function (data) {
        if (!r.ok) throw new Error(data.description || data.message || 'Error');
        return data;
      });
    });
  }

  function toast(message) {
    var el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.innerHTML = message;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () {
      el.classList.remove('is-visible');
    }, 3600);
  }

  window.Axion = Object.assign(config, {
    formatMoney: formatMoney,
    addToCart: addToCart,
    refreshCartCount: refreshCartCount,
    setCartCount: setCartCount,
    toast: toast
  });

  /* ---------- Quantity steppers ---------- */
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-qty-step]');
    if (!button) return;
    var wrapper = button.closest('.quantity');
    var input = wrapper && wrapper.querySelector('input');
    if (!input) return;
    var step = Number(button.getAttribute('data-qty-step'));
    var min = Number(input.min || 0);
    var next = Math.max(min, (Number(input.value) || 0) + step);
    if (input.max) next = Math.min(Number(input.max), next);
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Auto-submitting forms (cart quantities, collection filters) ---------- */
  document.addEventListener('change', function (event) {
    var form = event.target.closest('form[data-autosubmit]');
    if (!form) return;
    clearTimeout(form._t);
    form._t = setTimeout(function () {
      if (typeof form.requestSubmit === 'function') form.requestSubmit();
      else form.submit();
    }, 350);
  });

  /* ---------- Close dropdowns on outside click ---------- */
  document.addEventListener('click', function (event) {
    document.querySelectorAll('details[data-dismissable][open], .header__dropdown[open]').forEach(function (d) {
      if (!d.contains(event.target)) d.removeAttribute('open');
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('details[open]').forEach(function (d) {
      if (d.matches('.header__drawer, .header__dropdown, [data-dismissable]')) {
        d.removeAttribute('open');
        var summary = d.querySelector('summary');
        if (summary) summary.focus();
      }
    });
  });

  /* ---------- Product form ---------- */
  function initProduct(root) {
    var dataEl = root.querySelector('[data-product-json]');
    if (!dataEl) return;
    var product = JSON.parse(dataEl.textContent);
    var form = root.querySelector('form[data-product-form]');
    var idInput = form.querySelector('input[name="id"]');
    var submit = form.querySelector('[type="submit"]');
    var priceEl = root.querySelector('[data-price]');
    var comparePriceEl = root.querySelector('[data-compare-price]');
    var mainImage = root.querySelector('[data-main-media]');

    function selectedOptions() {
      return product.options.map(function (_, i) {
        var checked = root.querySelector('[name="option-' + i + '"]:checked');
        return checked ? checked.value : null;
      });
    }

    function findVariant(options) {
      return product.variants.find(function (v) {
        return v.options.every(function (opt, i) {
          return opt === options[i];
        });
      });
    }

    function updateAvailability(options) {
      // Grey out option values that do not produce an available variant.
      product.options.forEach(function (_, index) {
        root.querySelectorAll('[name="option-' + index + '"]').forEach(function (input) {
          var probe = options.slice();
          probe[index] = input.value;
          var match = findVariant(probe);
          input.parentElement.classList.toggle('is-unavailable', !match || !match.available);
        });
      });
    }

    function update() {
      var options = selectedOptions();
      var variant = findVariant(options);
      updateAvailability(options);
      root.querySelectorAll('.variant-picker').forEach(function (fieldset, i) {
        var label = fieldset.querySelector('legend span');
        if (label) label.textContent = options[i] || '';
      });

      if (!variant) {
        submit.disabled = true;
        submit.querySelector('span').textContent = config.strings.unavailable;
        return;
      }

      idInput.value = variant.id;
      submit.disabled = !variant.available;
      submit.querySelector('span').textContent = variant.available ? config.strings.addToCart : config.strings.soldOut;

      if (priceEl) priceEl.textContent = formatMoney(variant.price);
      if (comparePriceEl) {
        var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
        comparePriceEl.textContent = onSale ? formatMoney(variant.compare_at_price) : '';
        comparePriceEl.hidden = !onSale;
        priceEl.closest('.price').classList.toggle('price--sale', !!onSale);
      }

      if (variant.featured_media && mainImage) {
        var thumb = root.querySelector('[data-media-id="' + variant.featured_media.id + '"]');
        if (thumb) thumb.click();
      }

      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    root.addEventListener('change', function (event) {
      if (event.target.name && event.target.name.indexOf('option-') === 0) update();
    });

    root.querySelectorAll('[data-media-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var img = mainImage && mainImage.querySelector('img');
        if (!img) return;
        img.src = thumb.getAttribute('data-src');
        img.srcset = thumb.getAttribute('data-srcset') || '';
        img.alt = thumb.getAttribute('data-alt') || '';
        root.querySelectorAll('[data-media-thumb]').forEach(function (t) {
          t.setAttribute('aria-current', t === thumb ? 'true' : 'false');
        });
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var qtyInput = form.querySelector('input[name="quantity"]');
      var label = submit.querySelector('span');
      var original = label.textContent;
      submit.disabled = true;
      label.textContent = config.strings.adding;

      addToCart([{ id: Number(idInput.value), quantity: Number(qtyInput ? qtyInput.value : 1) }])
        .then(function () {
          return refreshCartCount();
        })
        .then(function () {
          toast(
            '<strong>' + product.title + '</strong> — ' + config.strings.addedToCart +
              ' <a href="' + config.routes.cart + '">' + config.strings.viewCart + '</a>'
          );
        })
        .catch(function (error) {
          toast(error.message);
        })
        .finally(function () {
          submit.disabled = false;
          label.textContent = original;
        });
    });

    update();
  }


  /* ---------- Key sounds (synthesised, no audio files) ---------- */
  var SOUND_KEY = 'axion-sound';
  var audio = null;
  var soundOn = false;
  try {
    soundOn = window.localStorage.getItem(SOUND_KEY) === '1';
  } catch (e) {}

  var VOICES = {
    linear: { body: 140, band: 850, q: 0.9, level: 0.5 },
    tactile: { body: 170, band: 1300, q: 1.1, level: 0.5 },
    clicky: { body: 210, band: 2400, q: 1.4, level: 0.4, click: true }
  };

  function noiseBurst(ctx, when, duration, filterType, freq, q, gainValue) {
    var length = Math.ceil(ctx.sampleRate * duration);
    var buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    var src = ctx.createBufferSource();
    src.buffer = buffer;
    var filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    var gain = ctx.createGain();
    gain.gain.value = gainValue;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(when);
  }

  function playKey(kind, soft) {
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!audio) audio = new AudioCtx();
    if (audio.state === 'suspended') audio.resume();
    var v = VOICES[kind] || VOICES.tactile;
    var t = audio.currentTime + 0.005;
    var level = v.level * (soft ? 0.35 : 1);
    var jitter = 0.94 + Math.random() * 0.12;

    // Body: a short, low "thock" from the case and plate.
    var osc = audio.createOscillator();
    var body = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(v.body * jitter, t);
    osc.frequency.exponentialRampToValueAtTime(v.body * 0.6, t + 0.08);
    body.gain.setValueAtTime(level * 0.6, t);
    body.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    osc.connect(body).connect(audio.destination);
    osc.start(t);
    osc.stop(t + 0.1);

    // Top: the keycap hitting the housing.
    noiseBurst(audio, t, 0.045, 'bandpass', v.band * jitter, v.q, level);

    // Clicky switches add a sharp click jacket snap just before bottom-out.
    if (v.click && !soft) noiseBurst(audio, t - 0.004, 0.012, 'highpass', 4200, 0.7, level * 0.9);
  }

  function setSound(on) {
    soundOn = on;
    try {
      window.localStorage.setItem(SOUND_KEY, on ? '1' : '0');
    } catch (e) {}
    document.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (on) playKey('tactile');
  }

  document.addEventListener('click', function (event) {
    var toggle = event.target.closest('[data-sound-toggle]');
    if (toggle) setSound(!soundOn);

    var pressable = event.target.closest('[data-press-sound]');
    if (pressable && soundOn) playKey('tactile');

    var listen = event.target.closest('[data-play-switch]');
    if (listen) {
      var kind = listen.getAttribute('data-play-switch');
      var card = listen.closest('[data-switch-card]');
      // Three presses so the difference is easy to hear.
      [0, 260, 520].forEach(function (delay) {
        setTimeout(function () {
          playKey(kind);
          if (card) {
            card.classList.add('is-playing');
            setTimeout(function () {
              card.classList.remove('is-playing');
              playKey(kind, true);
            }, 110);
          }
        }, delay);
      });
    }

    var top = event.target.closest('[data-back-to-top]');
    if (top) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* ---------- Hero keyboard that reacts to real typing ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function isTypingTarget(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  function normalize(code) {
    return String(code || '').toLowerCase().replace(/(left|right)$/, '').replace(/^numpad/, '');
  }

  function charFor(code) {
    if (/^key[a-z]$/.test(code)) return code.slice(3);
    if (/^digit[0-9]$/.test(code)) return code.slice(5);
    var map = { space: ' ', minus: '-', equal: '=', comma: ',', period: '.', slash: '/', semicolon: ';', quote: "'", backquote: '`', bracketleft: '[', bracketright: ']', backslash: '\\' };
    return map[code] || '';
  }

  function initHeroKeyboard(root) {
    if (root._typer) return;
    root._typer = true;
    var textEl = root.querySelector('[data-typer-text]');
    var screen = textEl && textEl.parentElement;
    var visible = false;
    var userTyped = false;

    function write(text) {
      if (!textEl) return;
      textEl.textContent = text.slice(-22);
      screen.classList.toggle('has-text', text.length > 0);
    }

    function press(code, withChar) {
      var keys = root.querySelectorAll('[data-k="' + code + '"]');
      keys.forEach(function (k) {
        k.classList.add('is-down');
        clearTimeout(k._up);
        k._up = setTimeout(function () {
          k.classList.remove('is-down');
        }, 140);
      });
      if (soundOn) playKey('tactile');
      if (!withChar) return;
      var current = textEl ? textEl.textContent : '';
      if (code === 'backspace') write(current.slice(0, -1));
      else if (code === 'enter' || code === 'escape') write('');
      else write(current + charFor(code));
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }).observe(root);
    } else {
      visible = true;
    }

    document.addEventListener('keydown', function (event) {
      if (!visible || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      var code = normalize(event.code);
      if (code === 'slash') return;
      if (code === 'space' && textEl && textEl.textContent.length) event.preventDefault();
      userTyped = true;
      press(code, !event.repeat);
    });

    root.addEventListener('click', function (event) {
      var key = event.target.closest('[data-k]');
      if (!key) return;
      userTyped = true;
      press(key.getAttribute('data-k'), true);
    });

    // A little welcome: the board types its own name once.
    if (!reduceMotion) {
      var word = ['keya', 'keyx', 'keyi', 'keyo', 'keyn'];
      word.forEach(function (code, i) {
        setTimeout(function () {
          if (!userTyped) press(code, true);
        }, 1100 + i * 190);
      });
      setTimeout(function () {
        if (!userTyped) write('');
      }, 4200);
    }
  }

  /* ---------- Force curves draw themselves when scrolled into view ---------- */
  function initCurves(scope) {
    var cards = scope.querySelectorAll('[data-switch-card]');
    if (!cards.length || !('IntersectionObserver' in window) || reduceMotion) return;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-drawn');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    cards.forEach(function (card) {
      card.setAttribute('data-animate', '');
      io.observe(card);
    });
  }

  /* ---------- Mini keyboards drawn from block colours ---------- */
  function initMiniBoards(scope) {
    var boards = scope.querySelectorAll('[data-mini-board]');
    if (!boards.length) return;
    function draw() {
      if (!window.AxionRender) return false;
      boards.forEach(function (el) {
        el.innerHTML = window.AxionRender.keyboard({
          layout: el.getAttribute('data-layout'),
          caseColor: el.getAttribute('data-case'),
          alpha: el.getAttribute('data-alpha'),
          mod: el.getAttribute('data-mod'),
          accent: el.getAttribute('data-accent'),
          label: ''
        });
      });
      return true;
    }
    if (!draw()) window.addEventListener('load', draw);
  }

  /* ---------- Shortcut: "/" opens search ---------- */
  document.addEventListener('keydown', function (event) {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || isTypingTarget(event.target)) return;
    var input = document.querySelector('input[type="search"]');
    event.preventDefault();
    if (input) input.focus();
    else window.location.href = config.routes.search || '/search';
  });

  function initDetails(scope) {
    scope.querySelectorAll('[data-hero-keyboard]').forEach(initHeroKeyboard);
    initCurves(scope);
    initMiniBoards(scope);
    scope.querySelectorAll('[data-sound-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    });
  }

  function init() {
    document.querySelectorAll('[data-product]').forEach(initProduct);
    initDetails(document);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', function (event) {
    event.target.querySelectorAll('[data-product]').forEach(initProduct);
    initDetails(event.target);
  });
})();
