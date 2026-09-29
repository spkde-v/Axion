# Store seed

Fills the Axion store with a ready-to-sell demo catalogue that matches the theme.

| What | Count | Notes |
|------|-------|-------|
| Products | 22 | 6 keyboards (Plate variants), 6 switch packs (Lube variants), 5 keycap sets (Kit variants), assembly service, 4 accessories. Images, stock, SKUs, builder tags |
| Smart collections | 8 | keyboards, switches, keycaps, accessories, linear/tactile/clicky switches, staff picks |
| Pages | 5 | Build (template `page.builder`), Contact (`page.contact`), About, Shipping & returns, Warranty |
| Journal | 3 articles | in the `news` blog |
| Menus | 2 | `main-menu` (with a Switches dropdown) and `footer` |
| Policies | 2 | refund and shipping |

The theme's templates already point at these handles, so the home page, the builder and the switch guide fill in as soon as the script finishes.

## Run it

1. Get an Admin API access token (`shpat_…`) for your app with these scopes:
   `write_products, write_inventory, read_locations, write_publications, write_files, write_content, write_online_store_pages, write_online_store_navigation, write_legal_policies`

   If you installed the app through OAuth, exchange the one-time `code` for the token:

   ```bash
   curl -X POST "https://YOUR-STORE.myshopify.com/admin/oauth/access_token" \
     -H "Content-Type: application/json" \
     -d '{"client_id":"…","client_secret":"…","code":"…"}'
   ```

2. Run the script (Node 18+):

   ```bash
   SHOPIFY_STORE=axion-hzvjugzo.myshopify.com \
   SHOPIFY_ADMIN_TOKEN=shpat_… \
   node scripts/store-seed/seed.mjs
   ```

   - `--dry-run` shows what would be created without calling the API.
   - `--only=products,collections` runs selected steps (`products, collections, pages, blog, menus, policies`).
   - Re-running is safe: anything that already exists (by handle) is skipped.

## Edit the catalogue

Everything lives in `catalog.mjs`. Product images are rendered from the theme's own illustration kit:

```bash
node scripts/store-seed/render-images.mjs   # needs the playwright package
```

Builder tags: keyboards use `layout:60|65|75|tkl` and `case:#HEX`, switches `switch:linear|tactile|clicky` and `stem:#HEX`, keycaps `cap:#HEX`, `mod:#HEX`, `accent:#HEX`.
