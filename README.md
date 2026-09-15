# Tanvi Crafts

Static GitHub Pages shop for Tanvi Crafts. Visitors browse products, add them to an enquiry list, and send the enquiry to WhatsApp.

## Managing products

Edit `products.js` (it sets `window.STORE_DATA`; keep commas and quotes valid):

- `store.whatsappNumber` — WhatsApp number in international format, digits only (e.g. `919876543210` for +91 98765 43210).
- `products` — one entry per product:

| Field         | Description                                          |
|---------------|------------------------------------------------------|
| `id`          | Unique id, no spaces (used to remember the cart)     |
| `name`        | Product name                                         |
| `description` | Short description                                    |
| `category`    | Used for the filter buttons                          |
| `image`       | Path to an image, e.g. `assets/products/earrings.jpg` |
| `inStock`     | `false` shows "Sold out" and disables add to enquiry |

Put product photos in `assets/products/`. Any shape works — photos are shown whole, never cropped.

## Running locally

Just open `index.html` in a browser.

## Publishing

Push this repo to GitHub as `tanvicrafts.github.io` (under the `tanvicrafts` account/org). GitHub Pages serves it at https://tanvicrafts.github.io. For other repo names, enable Pages under **Settings → Pages → Deploy from branch → main / root**.
