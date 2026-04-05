# ecommerce-pl-tracker

Single-process app server (frontend + Shopify proxy) so users only run one command.

## Run

```bash
npm start
```

Open:

`http://127.0.0.1:3001/`

## One-click local start (Windows)

Starts the server and opens the app URL automatically:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\windows\start-app.ps1
```

Or via npm:

```powershell
npm run start:app
```

## One-click local start (macOS)

Make scripts executable once:

```bash
chmod +x ./apple/start-app.sh ./apple/start-app.command
```

Start from terminal:

```bash
bash ./apple/start-app.sh
```

Or via npm:

```bash
npm run start:app:mac
```

Or double-click `apple/start-app.command` in Finder.

## Shopify sync setup

1. Open Settings -> Shopify Integration
2. Fill:
   - Store Domain (for example `your-store.myshopify.com`)
   - Client ID
   - Client Secret
3. Click Save Settings, then Sync Orders

No separate proxy process is required.
