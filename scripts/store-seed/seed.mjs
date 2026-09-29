#!/usr/bin/env node
/**
 * Fills a Shopify store with the Axion demo catalogue: products (with images,
 * variants, stock and builder tags), smart collections, pages, blog articles,
 * navigation menus and store policies.
 *
 * Usage:
 *   SHOPIFY_STORE=axion-hzvjugzo.myshopify.com \
 *   SHOPIFY_ADMIN_TOKEN=shpat_xxx \
 *   node scripts/store-seed/seed.mjs [--dry-run] [--only=products,collections,pages,blog,menus,policies]
 *
 * Safe to re-run: anything that already exists (matched by handle) is skipped.
 *
 * Required Admin API scopes:
 *   write_products, write_inventory, read_locations, write_publications,
 *   write_files, write_content, write_online_store_pages,
 *   write_online_store_navigation, write_legal_policies
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { VENDOR, PRODUCTS, COLLECTIONS, PAGES, ARTICLES, MENUS, POLICIES } from './catalog.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-07';
const STORE = (process.env.SHOPIFY_STORE || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const DRY = process.argv.includes('--dry-run');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7).split(',') : null;
const want = (step) => !ONLY || ONLY.includes(step);

if (!DRY && (!STORE || !TOKEN)) {
  console.error('Set SHOPIFY_STORE and SHOPIFY_ADMIN_TOKEN (or pass --dry-run).');
  process.exit(1);
}

const log = (...a) => console.log(...a);
const ok = (msg) => log('  ✓', msg);
const skip = (msg) => log('  ·', msg, '(exists, skipped)');

async function gql(query, variables = {}) {
  if (DRY) return null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN },
      body: JSON.stringify({ query, variables })
    });
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    const json = await res.json();
    if (json.errors) {
      const throttled = json.errors.some((e) => e.extensions && e.extensions.code === 'THROTTLED');
      if (throttled) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw new Error(JSON.stringify(json.errors, null, 2));
    }
    return json.data;
  }
  throw new Error('Too many retries');
}

function userErrors(result, label) {
  const errs = result && result.userErrors;
  if (errs && errs.length) throw new Error(`${label}: ${errs.map((e) => `${(e.field || []).join('.')} ${e.message}`).join('; ')}`);
}

/* ---------------- lookups ---------------- */
async function findByHandle(connection, handle, extra = '') {
  const data = await gql(
    `query($q: String!) { ${connection}(first: 1, query: $q) { nodes { id handle ${extra} } } }`,
    { q: `handle:${handle}` }
  );
  const node = data && data[connection].nodes[0];
  return node && node.handle === handle ? node : null;
}

async function onlineStorePublication() {
  const data = await gql(`{ publications(first: 20) { nodes { id name } } }`);
  if (!data) return null;
  const pub = data.publications.nodes.find((p) => /online store/i.test(p.name));
  return pub ? pub.id : null;
}

async function publish(id, publicationId) {
  if (!publicationId || DRY) return;
  const data = await gql(
    `mutation($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
    { id, input: [{ publicationId }] }
  );
  userErrors(data.publishablePublish, 'publish');
}

/* ---------------- images ---------------- */
async function uploadImage(file) {
  const buffer = fs.readFileSync(file);
  const filename = path.basename(file);
  const data = await gql(
    `mutation($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { field message }
      }
    }`,
    { input: [{ filename, mimeType: 'image/png', resource: 'IMAGE', httpMethod: 'POST', fileSize: String(buffer.length) }] }
  );
  userErrors(data.stagedUploadsCreate, 'stagedUploadsCreate');
  const target = data.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  target.parameters.forEach((p) => form.append(p.name, p.value));
  form.append('file', new Blob([buffer], { type: 'image/png' }), filename);
  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed for ${filename}: ${res.status} ${await res.text()}`);
  return target.resourceUrl;
}

/* ---------------- products ---------------- */
async function seedProducts(ctx) {
  log('\nProducts');
  for (const p of PRODUCTS) {
    const existing = await findByHandle('products', p.handle);
    if (existing) {
      skip(p.handle);
      continue;
    }
    if (DRY) {
      ok(`would create ${p.title} (${p.type})`);
      continue;
    }

    const tracked = p.stock !== null && p.stock !== undefined;
    const inventory = (qty) => (tracked && ctx.locationId ? [{ locationId: ctx.locationId, name: 'available', quantity: qty }] : undefined);
    const inventoryItem = { tracked, requiresShipping: p.shipping !== false };

    let productOptions;
    let variants;
    if (p.option) {
      productOptions = [{ name: p.option.name, position: 1, values: p.option.values.map((v) => ({ name: v.name })) }];
      variants = p.option.values.map((v, i) => ({
        optionValues: [{ optionName: p.option.name, name: v.name }],
        price: v.price.toFixed(2),
        inventoryPolicy: 'DENY',
        inventoryItem: { ...inventoryItem, sku: `${p.handle}-${i + 1}`.toUpperCase() },
        inventoryQuantities: inventory(Math.max(2, Math.round(p.stock / (i + 1))))
      }));
    } else {
      productOptions = [{ name: 'Title', position: 1, values: [{ name: 'Default Title' }] }];
      variants = [
        {
          optionValues: [{ optionName: 'Title', name: 'Default Title' }],
          price: p.price.toFixed(2),
          inventoryPolicy: tracked ? 'DENY' : 'CONTINUE',
          inventoryItem: { ...inventoryItem, sku: p.handle.toUpperCase() },
          inventoryQuantities: inventory(p.stock)
        }
      ];
    }

    const files = [];
    const image = path.join(here, 'images', `${p.handle}.png`);
    if (fs.existsSync(image)) {
      files.push({ originalSource: await uploadImage(image), alt: p.title, contentType: 'IMAGE' });
    }

    const data = await gql(
      `mutation($input: ProductSetInput!) {
        productSet(input: $input, synchronous: true) {
          product { id handle }
          userErrors { field message }
        }
      }`,
      {
        input: {
          title: p.title,
          handle: p.handle,
          descriptionHtml: p.body.trim(),
          vendor: VENDOR,
          productType: p.type,
          tags: p.tags,
          status: 'ACTIVE',
          productOptions,
          variants,
          files
        }
      }
    );
    userErrors(data.productSet, `productSet ${p.handle}`);
    await publish(data.productSet.product.id, ctx.publicationId);
    ok(`created ${p.title}`);
  }
}

/* ---------------- collections ---------------- */
async function seedCollections(ctx) {
  log('\nCollections');
  for (const c of COLLECTIONS) {
    const existing = await findByHandle('collections', c.handle);
    if (existing) {
      ctx.collections[c.handle] = existing.id;
      skip(c.handle);
      continue;
    }
    if (DRY) {
      ok(`would create ${c.title}`);
      continue;
    }
    const data = await gql(
      `mutation($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id handle } userErrors { field message } }
      }`,
      {
        input: {
          title: c.title,
          handle: c.handle,
          descriptionHtml: c.body,
          sortOrder: 'BEST_SELLING',
          ruleSet: {
            appliedDisjunctively: false,
            rules: c.rules.map(([column, relation, condition]) => ({ column, relation, condition }))
          }
        }
      }
    );
    userErrors(data.collectionCreate, `collectionCreate ${c.handle}`);
    ctx.collections[c.handle] = data.collectionCreate.collection.id;
    await publish(data.collectionCreate.collection.id, ctx.publicationId);
    ok(`created ${c.title}`);
  }
}

/* ---------------- pages ---------------- */
async function seedPages(ctx) {
  log('\nPages');
  for (const page of PAGES) {
    const existing = await findByHandle('pages', page.handle);
    if (existing) {
      ctx.pages[page.handle] = existing.id;
      skip(page.handle);
      continue;
    }
    if (DRY) {
      ok(`would create ${page.title}${page.templateSuffix ? ` (template page.${page.templateSuffix})` : ''}`);
      continue;
    }
    const data = await gql(
      `mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { id handle } userErrors { field message } } }`,
      {
        page: {
          title: page.title,
          handle: page.handle,
          body: page.body || '',
          isPublished: true,
          ...(page.templateSuffix ? { templateSuffix: page.templateSuffix } : {})
        }
      }
    );
    userErrors(data.pageCreate, `pageCreate ${page.handle}`);
    ctx.pages[page.handle] = data.pageCreate.page.id;
    ok(`created ${page.title}`);
  }
}

/* ---------------- blog ---------------- */
async function seedBlog(ctx) {
  log('\nJournal');
  if (DRY) {
    ARTICLES.forEach((a) => ok(`would create article ${a.title}`));
    return;
  }
  let blogs = await gql(`{ blogs(first: 10) { nodes { id handle title } } }`);
  let blog = blogs.blogs.nodes.find((b) => b.handle === 'news') || blogs.blogs.nodes[0];
  if (!blog) {
    const created = await gql(
      `mutation($blog: BlogCreateInput!) { blogCreate(blog: $blog) { blog { id handle title } userErrors { field message } } }`,
      { blog: { title: 'Journal', handle: 'news' } }
    );
    userErrors(created.blogCreate, 'blogCreate');
    blog = created.blogCreate.blog;
    ok('created blog Journal');
  }
  ctx.blog = blog;

  for (const a of ARTICLES) {
    const existing = await findByHandle('articles', a.handle);
    if (existing) {
      skip(a.handle);
      continue;
    }
    const data = await gql(
      `mutation($article: ArticleCreateInput!) { articleCreate(article: $article) { article { id } userErrors { field message } } }`,
      {
        article: {
          blogId: blog.id,
          title: a.title,
          handle: a.handle,
          body: a.body,
          summary: a.summary,
          tags: a.tags,
          isPublished: true,
          author: { name: 'Axion workshop' }
        }
      }
    );
    userErrors(data.articleCreate, `articleCreate ${a.handle}`);
    ok(`created article ${a.title}`);
  }
}

/* ---------------- menus ---------------- */
function menuItems(items, ctx) {
  return items
    .map((item) => {
      const out = { title: item.title };
      if (item.collection && ctx.collections[item.collection]) {
        out.type = 'COLLECTION';
        out.resourceId = ctx.collections[item.collection];
      } else if (item.page && ctx.pages[item.page]) {
        out.type = 'PAGE';
        out.resourceId = ctx.pages[item.page];
      } else if (item.blog && ctx.blog) {
        out.type = 'BLOG';
        out.resourceId = ctx.blog.id;
      } else {
        out.type = 'HTTP';
        out.url = item.collection ? `/collections/${item.collection}` : item.page ? `/pages/${item.page}` : '/blogs/news';
      }
      if (item.items) out.items = menuItems(item.items, ctx);
      return out;
    });
}

async function seedMenus(ctx) {
  log('\nNavigation');
  if (DRY) {
    Object.keys(MENUS).forEach((h) => ok(`would set menu ${h}`));
    return;
  }
  // Make sure lookups exist even when running --only=menus.
  for (const c of COLLECTIONS) {
    if (!ctx.collections[c.handle]) {
      const node = await findByHandle('collections', c.handle);
      if (node) ctx.collections[c.handle] = node.id;
    }
  }
  for (const p of PAGES) {
    if (!ctx.pages[p.handle]) {
      const node = await findByHandle('pages', p.handle);
      if (node) ctx.pages[p.handle] = node.id;
    }
  }
  if (!ctx.blog) {
    const blogs = await gql(`{ blogs(first: 10) { nodes { id handle } } }`);
    ctx.blog = blogs.blogs.nodes.find((b) => b.handle === 'news') || blogs.blogs.nodes[0] || null;
  }

  const menus = await gql(`{ menus(first: 25) { nodes { id handle title } } }`);
  for (const [handle, items] of Object.entries(MENUS)) {
    const existing = menus.menus.nodes.find((m) => m.handle === handle);
    const title = handle === 'main-menu' ? 'Main menu' : 'Footer menu';
    const mapped = menuItems(items, ctx);
    if (existing) {
      const data = await gql(
        `mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
          menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
        }`,
        { id: existing.id, title: existing.title, handle, items: mapped }
      );
      userErrors(data.menuUpdate, `menuUpdate ${handle}`);
      ok(`updated menu ${handle}`);
    } else {
      const data = await gql(
        `mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
          menuCreate(title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
        }`,
        { title, handle, items: mapped }
      );
      userErrors(data.menuCreate, `menuCreate ${handle}`);
      ok(`created menu ${handle}`);
    }
  }
}

/* ---------------- policies ---------------- */
async function seedPolicies() {
  log('\nPolicies');
  for (const [type, body] of Object.entries(POLICIES)) {
    if (DRY) {
      ok(`would set ${type}`);
      continue;
    }
    const data = await gql(
      `mutation($shopPolicy: ShopPolicyInput!) { shopPolicyUpdate(shopPolicy: $shopPolicy) { shopPolicy { id } userErrors { field message } } }`,
      { shopPolicy: { type, body } }
    );
    userErrors(data.shopPolicyUpdate, `shopPolicyUpdate ${type}`);
    ok(`set ${type}`);
  }
}

/* ---------------- run ---------------- */
const ctx = { collections: {}, pages: {}, blog: null, publicationId: null, locationId: null };

log(DRY ? 'Dry run — nothing will be written.' : `Seeding ${STORE} (API ${API_VERSION})`);
if (!DRY) {
  const shop = await gql(`{ shop { name } locations(first: 1) { nodes { id name } } }`);
  log(`Shop: ${shop.shop.name}`);
  ctx.locationId = shop.locations.nodes[0] ? shop.locations.nodes[0].id : null;
  ctx.publicationId = await onlineStorePublication();
  if (!ctx.publicationId) log('  ! Online Store sales channel not found — items will be created but not published.');
}

try {
  if (want('products')) await seedProducts(ctx);
  if (want('collections')) await seedCollections(ctx);
  if (want('pages')) await seedPages(ctx);
  if (want('blog')) await seedBlog(ctx);
  if (want('menus')) await seedMenus(ctx);
  if (want('policies')) await seedPolicies();
  log('\nDone.');
} catch (error) {
  console.error('\nStopped:', error.message);
  process.exit(1);
}
