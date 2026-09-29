// Axion demo catalogue. Used by seed.mjs (store data) and render-images.mjs (product images).
// Tags drive the Build Your Keyboard preview: layout/case for boards, switch/stem for switches,
// cap/mod/accent for keycaps.

export const VENDOR = 'Axion';

const plate = (base) => ({
  name: 'Plate',
  values: [
    { name: 'FR4', price: base },
    { name: 'Aluminium', price: base + 10 },
    { name: 'POM', price: base + 15 }
  ]
});

const lube = (base) => ({
  name: 'Lube',
  values: [
    { name: 'Factory lubed', price: base },
    { name: 'Hand-lubed', price: base + 15 }
  ]
});

const kit = (base) => ({
  name: 'Kit',
  values: [
    { name: 'Base kit', price: base },
    { name: 'Base + novelties', price: base + 15 }
  ]
});

const keyboardBody = (layout, extra) => `
<p>${extra}</p>
<ul>
  <li><strong>Layout:</strong> ${layout}</li>
  <li><strong>Mount:</strong> gasket, with poron case foam</li>
  <li><strong>PCB:</strong> hot-swap, 5-pin, south-facing LEDs</li>
  <li><strong>Connection:</strong> USB-C, VIA / QMK compatible</li>
  <li><strong>Stabilisers:</strong> screw-in, clipped and lubed</li>
</ul>
<p>Switches and keycaps are sold separately — or put the whole board together in our builder.</p>`;

const switchBody = (kind, force, extra) => `
<p>${extra}</p>
<ul>
  <li><strong>Type:</strong> ${kind}</li>
  <li><strong>Actuation force:</strong> ${force}</li>
  <li><strong>Total travel:</strong> 4.0 mm</li>
  <li><strong>Pins:</strong> 5-pin, fits any hot-swap board</li>
  <li><strong>Pack:</strong> 70 switches</li>
</ul>`;

const capsBody = (extra) => `
<p>${extra}</p>
<ul>
  <li><strong>Material:</strong> 1.5 mm PBT, dye-sublimated legends</li>
  <li><strong>Profile:</strong> Cherry</li>
  <li><strong>Base kit:</strong> 60%, 65%, 75% and TKL (ANSI)</li>
  <li><strong>Novelties:</strong> 12 extra accent keys</li>
</ul>`;

export const PRODUCTS = [
  // ---------------- Keyboards ----------------
  {
    handle: 'axion-65-sage', title: 'Axion 65 · Sage', type: 'Keyboard',
    tags: ['layout:65', 'case:#97A87A', 'staff-pick', 'hot-swap'],
    option: plate(149), stock: 24,
    art: { kind: 'keyboard', layout: '65', caseColor: '#97A87A', alpha: '#FCF9EA', mod: '#A8BBA3', accent: '#DB9558', bg: '#E4EAD9' },
    body: keyboardBody('65% (68 keys)', 'Our everyday board. Compact, with arrows and a soft, deep sound thanks to the gasket mount.')
  },
  {
    handle: 'axion-65-oat', title: 'Axion 65 · Oat', type: 'Keyboard',
    tags: ['layout:65', 'case:#EDE5CC', 'hot-swap'],
    option: plate(149), stock: 18,
    art: { kind: 'keyboard', layout: '65', caseColor: '#EDE5CC', alpha: '#FFFDF4', mod: '#DB9558', accent: '#97A87A', bg: '#F6EBDD' },
    body: keyboardBody('65% (68 keys)', 'The same 65% in a warm oat case that disappears on a light desk.')
  },
  {
    handle: 'axion-75-clay', title: 'Axion 75 · Clay', type: 'Keyboard',
    tags: ['layout:75', 'case:#DB9558', 'staff-pick', 'hot-swap'],
    option: plate(179), stock: 14,
    art: { kind: 'keyboard', layout: '75', caseColor: '#DB9558', alpha: '#FFF6E8', mod: '#F1E4CF', accent: '#97A87A', bg: '#F5E1CC' },
    body: keyboardBody('75% (84 keys)', 'Function row, arrows and a knob-free top in a terracotta case. The sweet spot for writers.')
  },
  {
    handle: 'axion-75-moss', title: 'Axion 75 · Moss', type: 'Keyboard',
    tags: ['layout:75', 'case:#6F7F5A', 'hot-swap'],
    option: plate(179), stock: 12,
    art: { kind: 'keyboard', layout: '75', caseColor: '#6F7F5A', alpha: '#E4EAD9', mod: '#97A87A', accent: '#DB9558', bg: '#DDE3D3' },
    body: keyboardBody('75% (84 keys)', 'A deep moss case with a muted, low-pitched sound profile.')
  },
  {
    handle: 'axion-60-cream', title: 'Axion 60 · Cream', type: 'Keyboard',
    tags: ['layout:60', 'case:#F6F0DC', 'hot-swap'],
    option: plate(129), stock: 20,
    art: { kind: 'keyboard', layout: '60', caseColor: '#F6F0DC', alpha: '#FFFDF4', mod: '#A8BBA3', accent: '#DB9558', bg: '#EFEBD6' },
    body: keyboardBody('60% (61 keys)', 'Nothing extra. The smallest board we make, and the easiest to carry around.')
  },
  {
    handle: 'axion-tkl-stone', title: 'Axion TKL · Stone', type: 'Keyboard',
    tags: ['layout:tkl', 'case:#B9B2A0', 'hot-swap'],
    option: plate(199), stock: 8,
    art: { kind: 'keyboard', layout: 'tkl', caseColor: '#B9B2A0', alpha: '#FCF9EA', mod: '#8C8676', accent: '#DB9558', bg: '#E9E5D8' },
    body: keyboardBody('Tenkeyless (87 keys)', 'Full-size feel without the numpad. For people who never let go of Home and End.')
  },

  // ---------------- Switches ----------------
  {
    handle: 'oat-linear-switches', title: 'Oat Linear Switches · 45g', type: 'Switches',
    tags: ['switch:linear', 'stem:#DB9558', 'staff-pick'],
    option: lube(39), stock: 60,
    art: { kind: 'switch', stem: '#DB9558', bg: '#F5E1CC' },
    body: switchBody('Linear', '45 gf', 'Smooth from top to bottom with a rounded, creamy bottom-out. Our best seller.')
  },
  {
    handle: 'silk-linear-switches', title: 'Silk Linear Switches · 38g', type: 'Switches',
    tags: ['switch:linear', 'stem:#E8C9A0'],
    option: lube(42), stock: 40,
    art: { kind: 'switch', stem: '#E8C9A0', bg: '#F6EBDD' },
    body: switchBody('Linear', '38 gf', 'Our lightest switch. Barely-there springs for long writing sessions.')
  },
  {
    handle: 'walnut-tactile-switches', title: 'Walnut Tactile Switches · 62g', type: 'Switches',
    tags: ['switch:tactile', 'stem:#8C6B4F', 'staff-pick'],
    option: lube(45), stock: 50,
    art: { kind: 'switch', stem: '#8C6B4F', bg: '#E9E1D3' },
    body: switchBody('Tactile', '62 gf', 'A round, pronounced bump right at the top of the press and a deep thud.')
  },
  {
    handle: 'hazel-tactile-switches', title: 'Hazel Tactile Switches · 55g', type: 'Switches',
    tags: ['switch:tactile', 'stem:#B08A63'],
    option: lube(44), stock: 35,
    art: { kind: 'switch', stem: '#B08A63', bg: '#EFE6D6' },
    body: switchBody('Tactile', '55 gf', 'A gentler bump than Walnut. Tactile without getting in the way.')
  },
  {
    handle: 'lake-clicky-switches', title: 'Lake Clicky Switches · 55g', type: 'Switches',
    tags: ['switch:clicky', 'stem:#7E9BA6'],
    option: lube(39), stock: 30,
    art: { kind: 'switch', stem: '#7E9BA6', bg: '#DFE6E3' },
    body: switchBody('Clicky', '55 gf', 'A crisp click-bar for a bright, typewriter-like sound.')
  },
  {
    handle: 'reed-clicky-switches', title: 'Reed Clicky Switches · 60g', type: 'Switches',
    tags: ['switch:clicky', 'stem:#5E7F73'],
    option: lube(41), stock: 25,
    art: { kind: 'switch', stem: '#5E7F73', bg: '#DCE3DA' },
    body: switchBody('Clicky', '60 gf', 'Heavier and a touch lower in pitch than Lake. Loud, but not shrill.')
  },

  // ---------------- Keycaps ----------------
  {
    handle: 'meadow-pbt-keycaps', title: 'Meadow PBT Keycaps', type: 'Keycaps',
    tags: ['cap:#FCF9EA', 'mod:#A8BBA3', 'accent:#DB9558', 'staff-pick'],
    option: kit(69), stock: 40,
    art: { kind: 'keycaps', alpha: '#FCF9EA', mod: '#A8BBA3', accent: '#DB9558', bg: '#E4EAD9' },
    body: capsBody('Cream alphas, sage modifiers and a single caramel Escape. Our house colours.')
  },
  {
    handle: 'terracotta-pbt-keycaps', title: 'Terracotta PBT Keycaps', type: 'Keycaps',
    tags: ['cap:#FFF6E8', 'mod:#DB9558', 'accent:#97A87A'],
    option: kit(74), stock: 30,
    art: { kind: 'keycaps', alpha: '#FFF6E8', mod: '#DB9558', accent: '#97A87A', bg: '#F5E1CC' },
    body: capsBody('Warm clay modifiers with an olive accent. Looks great on Oat and Clay cases.')
  },
  {
    handle: 'olive-grove-pbt-keycaps', title: 'Olive Grove PBT Keycaps', type: 'Keycaps',
    tags: ['cap:#E4EAD9', 'mod:#97A87A', 'accent:#2F2B22'],
    option: kit(74), stock: 25,
    art: { kind: 'keycaps', alpha: '#E4EAD9', mod: '#97A87A', accent: '#2F2B22', bg: '#DDE3D3' },
    body: capsBody('Green on green with a charcoal accent. Calm and a little serious.')
  },
  {
    handle: 'sandstone-pbt-keycaps', title: 'Sandstone PBT Keycaps', type: 'Keycaps',
    tags: ['cap:#F1E4CF', 'mod:#CDB48F', 'accent:#DB9558'],
    option: kit(69), stock: 35,
    art: { kind: 'keycaps', alpha: '#F1E4CF', mod: '#CDB48F', accent: '#DB9558', bg: '#F1E8D8' },
    body: capsBody('Beige and sand tones, like old office keyboards but softer.')
  },
  {
    handle: 'night-garden-pbt-keycaps', title: 'Night Garden PBT Keycaps', type: 'Keycaps',
    tags: ['cap:#3B3F33', 'mod:#6F7F5A', 'accent:#DB9558'],
    option: kit(79), stock: 20,
    art: { kind: 'keycaps', alpha: '#3B3F33', mod: '#6F7F5A', accent: '#DB9558', bg: '#D6DACE' },
    body: capsBody('Our only dark set: charcoal alphas, moss modifiers and a warm accent.')
  },

  // ---------------- Accessories & services ----------------
  {
    handle: 'assembly-and-lubing', title: 'Assembly & lubing', type: 'Service',
    tags: ['service'], price: 35, shipping: false, stock: null,
    art: { kind: 'service', bg: '#E4EAD9' },
    body: '<p>We lube your switches and stabilisers, assemble the board, and type-test every key before it ships. Adds about one workday.</p>'
  },
  {
    handle: 'switch-tester', title: 'Switch tester · 12 switches', type: 'Accessories',
    tags: ['accessory', 'staff-pick'], price: 19, stock: 80,
    art: { kind: 'tester', bg: '#F5E1CC' },
    body: '<p>Twelve of our switches on a small acrylic base. Try them at your desk; we refund the tester with your first build.</p>'
  },
  {
    handle: 'coiled-cable-sage', title: 'Coiled USB-C cable · Sage', type: 'Accessories',
    tags: ['accessory'], price: 29, stock: 45,
    art: { kind: 'cable', bg: '#E4EAD9' },
    body: '<p>Double-sleeved coiled cable with an aviator connector. 1.5 m, USB-C to USB-C.</p>'
  },
  {
    handle: 'keycap-switch-puller', title: 'Keycap & switch puller', type: 'Accessories',
    tags: ['accessory'], price: 9, stock: 120,
    art: { kind: 'puller', bg: '#F6EBDD' },
    body: '<p>Two-in-one steel puller with a wooden grip. Gentle on keycaps, firm on switches.</p>'
  },
  {
    handle: 'desk-mat-meadow', title: 'Desk mat · Meadow', type: 'Accessories',
    tags: ['accessory'], price: 32, stock: 40,
    art: { kind: 'deskmat', bg: '#EFEBD6' },
    body: '<p>90 × 40 cm, stitched edges, natural rubber base. Printed with our meadow pattern.</p>'
  }
];

export const COLLECTIONS = [
  { handle: 'keyboards', title: 'Keyboards', rules: [['TYPE', 'EQUALS', 'Keyboard']], body: '<p>Hot-swap, gasket-mounted boards in four sizes.</p>' },
  { handle: 'switches', title: 'Switches', rules: [['TYPE', 'EQUALS', 'Switches']], body: '<p>Every switch here was tested and lubed in our workshop.</p>' },
  { handle: 'keycaps', title: 'Keycaps', rules: [['TYPE', 'EQUALS', 'Keycaps']], body: '<p>Thick PBT sets in calm colours.</p>' },
  { handle: 'accessories', title: 'Accessories', rules: [['TYPE', 'EQUALS', 'Accessories']], body: '<p>Cables, testers, tools and desk mats.</p>' },
  { handle: 'linear-switches', title: 'Linear switches', rules: [['TAG', 'EQUALS', 'switch:linear']], body: '<p>Smooth all the way down.</p>' },
  { handle: 'tactile-switches', title: 'Tactile switches', rules: [['TAG', 'EQUALS', 'switch:tactile']], body: '<p>A bump you can feel.</p>' },
  { handle: 'clicky-switches', title: 'Clicky switches', rules: [['TAG', 'EQUALS', 'switch:clicky']], body: '<p>Crisp, loud and satisfying.</p>' },
  { handle: 'staff-picks', title: 'Staff picks', rules: [['TAG', 'EQUALS', 'staff-pick']], body: '<p>What we type on ourselves.</p>' }
];

export const PAGES = [
  { handle: 'build', title: 'Build your keyboard', templateSuffix: 'builder', body: '' },
  { handle: 'contact', title: 'Contact', templateSuffix: 'contact', body: '' },
  {
    handle: 'about', title: 'About Axion',
    body: `<p>Axion started on a kitchen table with a bag of switches and a tub of lube. Today we are a small workshop of five people who build, tune and test every keyboard we sell.</p>
<p>We keep the catalogue short on purpose: a few boards we love, switches we have typed on for weeks, and keycaps in colours that are easy to live with.</p>
<p>Come by the workshop any weekday — the tester board is always out.</p>`
  },
  {
    handle: 'shipping-returns', title: 'Shipping & returns',
    body: `<h3>Shipping</h3><p>In-stock parts ship within 1–2 workdays. Custom builds ship in 3–5 workdays. Free shipping on builds over $150.</p>
<h3>Returns</h3><p>Not clicking with it? Return anything within 30 days of delivery. Custom builds can be returned too — we just ask that the switches are not desoldered.</p>`
  },
  {
    handle: 'warranty', title: 'Warranty',
    body: `<p>Every board we assemble is covered for two years. If a key chatters, double-types or feels scratchy, send us a short video and we will swap the switch or the whole board.</p>`
  }
];

export const ARTICLES = [
  {
    handle: 'how-to-choose-your-first-switch', title: 'How to choose your first switch',
    tags: ['switches', 'guide'],
    summary: 'Linear, tactile or clicky? A short guide that skips the jargon.',
    body: `<p>If you are not sure, start with a tactile switch around 55–62 g. It gives you a clear signal that the key registered without the noise of a clicky switch.</p>
<p>Gamers and fast typists often end up on linears. Writers who love feedback tend to stay tactile. And if you want everyone in the room to know you are working, clicky is for you.</p>
<p>Still unsure? Order the 12-switch tester — we refund it with your first build.</p>`
  },
  {
    handle: 'why-we-hand-lube', title: 'Lubing 101: why we hand-lube',
    tags: ['switches', 'workshop'],
    summary: 'What lubing changes, and why we still do it one switch at a time.',
    body: `<p>Lube smooths out the friction between the stem and the housing and deepens the sound. Factory lube is good; hand-lubing is better and more consistent.</p>
<p>We use a thin layer of Krytox 205g0 on the stem and housing rails, and a lighter oil on springs. A full 70-switch pack takes about two hours.</p>`
  },
  {
    handle: 'keycap-profiles-explained', title: 'Keycap profiles, explained',
    tags: ['keycaps', 'guide'],
    summary: 'Cherry, OEM, SA — what the letters mean for your fingers.',
    body: `<p>The profile is the shape and height of a keycap set. Cherry profile is low and sculpted, which makes it comfortable for long sessions — that is why all our sets use it.</p>
<p>Taller profiles like SA look dramatic and sound deeper, but take some getting used to.</p>`
  }
];

export const MENUS = {
  'main-menu': [
    { title: 'Keyboards', collection: 'keyboards' },
    {
      title: 'Switches', collection: 'switches', items: [
        { title: 'Linear', collection: 'linear-switches' },
        { title: 'Tactile', collection: 'tactile-switches' },
        { title: 'Clicky', collection: 'clicky-switches' }
      ]
    },
    { title: 'Keycaps', collection: 'keycaps' },
    { title: 'Accessories', collection: 'accessories' },
    { title: 'Journal', blog: true }
  ],
  footer: [
    { title: 'Shipping & returns', page: 'shipping-returns' },
    { title: 'Warranty', page: 'warranty' },
    { title: 'About', page: 'about' },
    { title: 'Contact', page: 'contact' }
  ]
};

export const POLICIES = {
  REFUND_POLICY: '<p>You can return any item within 30 days of delivery for a full refund. Custom builds are returnable as long as switches have not been desoldered. Contact hello@axion.store to start a return.</p>',
  SHIPPING_POLICY: '<p>In-stock parts ship within 1–2 workdays, custom builds within 3–5 workdays. Shipping is free on orders over $150.</p>'
};
