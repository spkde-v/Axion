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

  function init() {
    document.querySelectorAll('[data-product]').forEach(initProduct);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', function (event) {
    event.target.querySelectorAll('[data-product]').forEach(initProduct);
  });
})();
