# Layover Overlap Mapper — User Guide

This guide explains how to use the tool. You do not need any technical background.

## What this tool does

The **Layover Overlap Mapper** helps you compare two lists of airport destinations:

1. **API destinations** — Where your hotel program or API has coverage (with a volume for each airport).
2. **Client layovers** — Where your prospect or client has crew layovers (with a volume for each airport).

After you load both lists, the tool shows:

- A **world map** with bubbles sized by volume.
- **Overlap** — airports that appear in **both** lists.
- **API-only** and **client-only** airports — places that appear in only one list.
- **Percentages** that summarize how much of the client’s footprint overlaps your API coverage.

---

## Before you start

- You need **two spreadsheet files** saved as **CSV** (Comma-Separated Values). Excel and similar apps can export CSV.
- Each airport must be identified by a **three-letter IATA code** (for example, `LHR` for London Heathrow).
- Every code in your files must exist in the tool’s **airport reference list**. If a code is missing from that list, the tool will flag it and **that row will not appear on the map** until the airport is added (see [Airport reference and “unknown” codes](#airport-reference-and-unknown-codes) below).

---

## Quick start

1. Open the app in your browser.
2. Either:
   - Click **Load Demo Data** to try the tool with sample files, or  
   - Upload your **API** CSV and **client** CSV using the two upload areas.
3. Wait until **both** files are loaded. The map and tables fill in once both sides are ready.
4. Use **Tune the View** to adjust labels, filter by region, or change map colors if you like.

**Start Over** clears the current data so you can load different files.

---

## Your upload files (CSV format)

### Required columns

Each upload file must have exactly these column headers (spelling can be upper or lower case):

| Column   | Meaning |
|----------|---------|
| **IATA** | Three-letter airport code. |
| **volume** | A number for that airport (for example room nights, contracts, or trips—whatever you use internally). Must be zero or greater. |

Example:

```csv
IATA,volume
LHR,320
JFK,220
```

### Tips

- **Duplicate airports:** If the same IATA appears more than once, the tool **adds the volumes together** and treats it as one airport.
- **Invalid rows:** Rows with bad codes, missing values, or negative volumes are listed in the **validation** panel for that file so you can fix the source spreadsheet and upload again.
- **Templates:** Use **Download template** under each upload area to get a starter CSV.

---

## Airport reference and “unknown” codes

The map only plots airports that the tool **knows**—city, country, region, and map position are taken from the shared **airport reference**.

- If your CSV includes a code **not** in that reference, it shows as an **unknown IATA** in the validation summary.
- Unknown codes are **not** included in the map or in overlap calculations until they are added to the reference.

**If you see many unknown codes:** Someone with **Admin** access may need to add or bulk-import airports (see [Admin: managing the airport list](#admin-managing-the-airport-list)). If you do not have admin access, ask the person who manages the tool.

---

## Reading the screen

### Upload section

- Each side (**API** and **client**) shows the file name and a short validation summary.
- Expand **validation details** to see issues and any unknown IATA codes.
- After both files are loaded, you can **collapse** the upload section or use **Change files** to replace one or both CSVs.

### Tune the View

- **Client name** — Replaces the generic “Client” label in titles, the map, and summaries (for example your prospect’s name).
- **Volume units** — A short label for what “volume” means (for example “room nights”). This appears next to numbers in tables and tooltips.
- **Region filter** — Limits the map and all numbers to one geographic region (regions come from the airport reference). Choose **All regions** to see everything.

### Map colors

You can pick colors for:

- API-only destinations  
- Client-only destinations  
- Overlap (shared) destinations  

---

## The map

- **Bubble size** reflects volume. The same scale is used for all three categories so you can compare fairly.
- You can switch between **flat (2D)** and **globe (3D)** views if your screen offers that control.
- **Layer toggles** let you hide or show API-only, client-only, or overlap markers so the map is easier to read.
- **Zoom and pan** (or rotate on the globe) help you focus on an area. Hover or focus a bubble to see details.

If the map looks empty, check that you have at least one **recognized** airport in both files and that your **region filter** is not hiding everything.

---

## Summary numbers

- **Mapped destinations** — Counts of airports with API volume, client volume, and **overlap** (in both lists), after applying your region filter.
- **Current overlap %** — Of the client’s **mapped** destinations, what share also appears in the API list (same IATA in both files).
- **Potential overlap %** — An estimate that includes extra client-only airports that might still relate to your API footprint because they sit in the **same city, country, or region** as an API airport. It is a planning hint, not a guarantee of contract coverage.

The **Top overlap** list highlights airports with strong overlap (sorted with client volume in mind when relevant).

### Tables

Below the map you’ll find sortable tables for **overlap**, **API-only**, and **client-only** destinations.

---

## Light and dark mode

Use the theme control (usually near the top of the page). Your choice is remembered for the next visit.

---

## Admin: managing the airport list

If you have an **Admin** account, open **Admin Login** from the main page, sign in, and you’ll reach **Airport Reference Admin**.

From there you can:

- **Add or edit** a single airport (IATA, city, country, region, latitude, longitude).
- **Delete** an airport from the reference.
- **Bulk upload** a master spreadsheet of airports.

### Bulk upload format

The master file must include these columns:

`IATA`, `city`, `country`, `region`, `latitude`, `longitude`

Download the **airport master template** from the admin screen if you need a sample.

---

## Need help?

- Use **Load Demo Data** to see a full example without your own files.
- Fix CSV issues shown in **validation details**, then upload again.
- For missing airports or access problems, contact whoever runs or hosts the tool for your organization.
