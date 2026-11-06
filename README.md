# poc-gpa-kms

Custom SPFx web part **Wiki Space Gallery** untuk Knowledge Management System (Merauke Sugar Group): menampilkan kartu-kartu wiki space (divisi & SOP) lengkap dengan filter kategori, pencarian, dan link per kartu.

![version](https://img.shields.io/badge/version-1.24.1-green.svg)

## Features

- Grid kartu responsif (auto-fill, minimal 210px → 5 kolom di desktop, turun sampai 1 kolom di mobile)
- Tiap kartu: icon tile Fluent (nama icon + warna bisa diatur per data), judul, deskripsi 3 baris, panah chevron, dan hover effect
- Kartu opsi dengan foto background (kolom `TileImage`) — deskripsi otomatis disembunyikan
- Filter kategori berbentuk chip (`All` + daftar kategori diambil otomatis dari data)
- Pencarian real-time terhadap judul + deskripsi (debounce 250ms)
- State loading (skeleton), error (tombol retry), dan empty state
- Mengikuti tema SharePoint (light/dark) via `semanticColors`
- Property pane: judul section, nama list, toggle search, toggle filter, buka link di tab baru

## Struktur

```
src/webparts/kmsDashboard/
├── KmsDashboardWebPart.ts          # web part + property pane + theme
├── KmsDashboardWebPart.manifest.json
├── model/IWikiSpace.ts             # tipe data kartu
├── services/WikiSpaceService.ts    # fetch list via PnPjs
└── components/
    ├── KmsDashboard.tsx            # container: state search & filter
    ├── FilterChips.tsx             # chip kategori
    ├── WikiSpaceCard.tsx           # 1 kartu
    ├── hooks/useWikiSpaces.ts      # data loading (loading/error/retry)
    └── KmsDashboard.module.scss
```

## Data source: SharePoint list `Wiki Spaces`

| Kolom | Tipe | Wajib | Keterangan |
| --- | --- | --- | --- |
| `Title` | Single line of text | ya | Nama wiki space |
| `Description` | Multiple lines of text | tidak | Deskripsi kartu |
| `Category` | Choice | tidak | Contoh: `Division Wiki`, `SOP (Standard Operational Procedure)` |
| `IconName` | Single line of text | tidak | Nama icon Fluent, contoh `People`, `TVMonitor`, `Shield`. Default `Page` |
| `IconColor` | Single line of text | tidak | Warna tile hex, contoh `#0F6CBD` |
| `TileImage` | URL (Image) | tidak | Foto background kartu |
| `LinkUrl` | URL (Hyperlink) | tidak | Tujuan klik kartu |
| `SortOrder` | Number | tidak | Urutan tampil (ascending) |
| `IsActive` | Yes/No | tidak | `No` menyembunyikan kartu |

Kolom bersifat longgar — kalau sebuah kolom belum dibuat, web part tetap jalan (nilai default dipakai).

### Provisioning (otomatis)

```powershell
Install-Module PnP.PowerShell -Scope CurrentUser
.\scripts\provision-wiki-spaces.ps1 -SiteUrl "https://contoso.sharepoint.com/sites/kms"
```

Script ini idempotent: list & kolom dibuat hanya bila belum ada, kartu sample ditambahkan hanya bila judulnya belum ada. Pakai `-SkipSeed` bila hanya ingin strukturnya.

### Atau manual

Buat list `Wiki Spaces` lewat UI SharePoint → tambahkan kolom sesuai tabel di atas → isi datanya.

## Development

```powershell
npm install
npm start          # heft start -> local workbench di http://localhost:4321/workbench
npm run build      # build + test + package solution
```

Package hasil build: `sharepoint/solution/poc-gpa-kms.sppkg` → upload ke App Catalog, lalu tambahkan web part **Wiki Space Gallery** ke halaman.

> Local workbench tidak punya akses ke list di tenant, jadi tampilan data (kartu) baru terlihat setelah solution di-deploy atau dev server di-host dari domain SharePoint (`gulp serve --nobrowser` + URL workbench tenant).

## Used SharePoint Framework Version

![version](https://img.shields.io/badge/version-1.24.1-green.svg)

## Solution

| Solution | Author(s) |
| --- | --- |
| poc-gpa-kms | GPA KMS PoC |

## Version history

| Version | Date | Comments |
| --- | --- | --- |
| 1.0 | November 6, 2026 | Initial release: Wiki Space Gallery web part |

## Disclaimer

**THIS CODE IS PROVIDED _AS IS_ WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF FITNESS FOR A PARTICULAR PURPOSE, MERCHANTABILITY, OR NON-INFRINGEMENT.**

## References

- [Getting started with SharePoint Framework](https://docs.microsoft.com/sharepoint/dev/spfx/set-up-your-developer-tenant)
- [PnPjs documentation](https://pnp.github.io/pnpjs/)
- [Fluent UI icons](https://developer.microsoft.com/en-us/fluent-ui#/styles/icons)
- [Microsoft 365 Patterns and Practices](https://aka.ms/m365pnp)