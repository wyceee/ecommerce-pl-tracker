# ecommerce-pl-tracker

Single-process app server (frontend + Shopify proxy) so users only run one command.

## Run

```bash
npm start
```

Open:

`http://127.0.0.1:3001/`

## Shopify sync setup

1. Open Settings -> Shopify Integration
2. Fill:
   - Store Domain (for example `your-store.myshopify.com`)
   - Client ID
   - Client Secret
3. Click Save Settings, then Sync Orders

No separate proxy process is required.
