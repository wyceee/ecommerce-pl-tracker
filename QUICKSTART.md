# Quick Start: CJDropshipping Order Import

## 1-Minute Setup

### Get Your CJDropshipping Export
1. Log into CJDropshipping dashboard
2. Navigate to "Orders" or "My Orders"
3. Use export feature to download orders as Excel file
4. Save the file locally

### Import into Revenue Tracker

1. **Open Settings** → Click ⚙ in top right
2. **Find Import & Export** section
3. **Click "Import CJDropshipping"** button (📦 icon)
4. **Select** your CJDropshipping Excel file
5. **Done!** Orders appear as COGS costs

## What Happens Automatically

✅ Reads Excel file (.xls, .xlsx, .csv)
✅ Extracts order numbers and COGS amounts
✅ Parses order payment dates
✅ Creates COGS cost entries
✅ Saves to your app
✅ Shows import summary with count

## View Your Imported Orders

1. Click **Costs** tab
2. Filter by date if needed
3. Each CJDropshipping order shows as:
   - Label: "CJ #[Order ID]"
   - Category: COGS (red)
   - Amount: Order COGS
   - Date: Payment date

## That's It!

Your CJDropshipping orders are now tracked as COGS costs in your P&L calculations.

---

## Excel File Should Contain

| Required | Column | Example |
|---|---|---|
| ✓ | CJ Order Number | CJ2604015272 |
| ✓ | Order COGS | 25.53 |
| ✓ | CJ Paid Time | Apr. 01, 2026 03:03:03 |

## Troubleshooting

| Problem | Solution |
|---|---|
| No data found | Verify Excel file format (.xls/.xlsx) |
| No valid orders | Check COGS amounts are numbers > 0 |
| Orders not visible | Check date filters, try "All Time" |
| Import failed | Ensure Excel columns have exact names |

---

## Features

✨ **Fast**: Client-side processing, no upload needed
✨ **Smart**: Auto date parsing, duplicate prevention
✨ **Safe**: Doesn't overwrite existing data, can import multiple files
✨ **Simple**: One click import with summary

---

**Need help?** See `CJDROPSHIPPING_IMPORT.md` for detailed documentation.

