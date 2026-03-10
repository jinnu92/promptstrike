# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PromptStrike v8.0 is a browser-based red-teaming toolkit for testing LLM prompt injection vulnerabilities. It runs entirely client-side with no build step or package manager. Single-user local tool -- no authentication. Requires an HTTP server (e.g., `python3 -m http.server`) because views are loaded dynamically via `fetch()`.

## Quick Start

```bash
cd promptstrike && python3 -m http.server 8080
# Open http://localhost:8080
```

Libraries (jsPDF, jszip, pdf-lib) are bundled in `lib/` -- no CDN dependency.

## File Structure

```
promptstrike/
├── index.html              <- Main shell (topbar, sidebar, page containers, modals, script tags)
├── views/                  <- External view HTML (loaded dynamically via fetch)
│   ├── home.html
│   ├── payloads.html
│   ├── generate.html
│   ├── obf.html
│   ├── poly.html
│   ├── fuzzer.html
│   ├── manyshot.html
│   ├── rag-poison.html
│   ├── jailbreaks.html
│   ├── multilingual.html
│   ├── indirect.html
│   ├── vision.html
│   ├── audio.html
│   ├── mcp.html
│   ├── intel-analyzer.html
│   ├── intel-killchain.html
│   └── intel-cot.html
├── css/
│   ├── core.css            <- Variables, resets, CRT overlay
│   ├── layout.css          <- Topbar, sidebar, grid, responsive
│   ├── components.css      <- Buttons, inputs, cards, tables
│   └── toast.css           <- Toast notifications
├── js/
│   ├── core/
│   │   ├── utils.js        <- esc(), dl(), ss(), safeText()
│   │   ├── toast.js        <- toast(), btnLoad(), progressSet()
│   │   ├── state.js        <- Global state (fmt, dom, gC), setF(), setD()
│   │   ├── storage.js      <- Auto-save, payload localStorage
│   │   ├── sidebar.js      <- Sidebar rendering, function wrapping
│   │   └── app.js          <- Section/page routing, view loading, keyboard shortcuts, init
│   ├── data/
│   │   ├── payloads.js     <- P array (90+ payloads), populatePayloadDropdowns()
│   │   ├── domains.js      <- D object (domain presets)
│   │   ├── samples.js      <- SMP array, genSmp()
│   │   └── manyshot-samples.js <- Manyshot sample data
│   └── modules/
│       ├── payload-manager.js <- CRUD for payload database
│       ├── generate.js     <- File gen (12 formats) + live preview + quick obfuscation
│       ├── obfuscate.js    <- Payload obfuscation (ZWC, homoglyph, base64, ROT13, etc.)
│       ├── polyglot.js     <- Polyglot file generator
│       ├── fuzzer.js       <- Prompt fuzzer
│       ├── jailbreak.js    <- Jailbreak patterns library
│       ├── manyshot.js     <- Few-shot attack sequences
│       ├── rag-poison.js   <- RAG poisoning: true PDF/DOCX/XLSX poisoning via pdf-lib/jszip
│       ├── multilingual.js <- 12-language translation (MyMemory API + local dictionary)
│       ├── multiturn.js    <- Multi-turn attack sequences
│       ├── indirect.js     <- Indirect injection vectors
│       ├── vision-stego.js <- Vision steganography attacks
│       ├── audio.js        <- Audio steganography attacks
│       ├── mcp.js          <- MCP attack simulator
│       └── analyzer.js     <- Response analyzer (minimal)
└── lib/
    ├── jspdf.umd.min.js
    ├── jszip.min.js
    └── pdf-lib.min.js
```

## Script Load Order (Critical)

Scripts in index.html must follow this dependency order:
1. `lib/jspdf.umd.min.js`, `lib/jszip.min.js`, `lib/pdf-lib.min.js` -- no deps (bundled, not CDN)
2. `js/core/utils.js` -- no deps
3. `js/data/domains.js`, `js/data/payloads.js` -- no deps (define `D`, `P`)
4. `js/data/samples.js`, `js/data/manyshot-samples.js` -- need `P`
5. `js/core/state.js` -- needs `D`, `P`
6. `js/core/storage.js` -- needs state vars
7. `js/modules/payload-manager.js` -- needs all above
8. Feature modules in order: generate, manyshot, rag-poison, obfuscate, fuzzer, jailbreak, multilingual, indirect, multiturn, vision-stego, audio, mcp, analyzer, polyglot -- need all above
9. `js/core/sidebar.js` -- wraps module functions, must load after them
10. `js/core/app.js` -- DOMContentLoaded init, must be last

## Architecture

### No ES Modules

All JS uses plain global functions loaded via `<script>` tags. No `import`/`export`. Functions must be globally accessible.

### Navigation Model (v8.0)

Five top-level sections with a left sidebar for sub-pages. Router uses `switchSection(sectionId)` + `switchSubTab(pageId)`.

| Section | Sub-pages |
|---------|-----------|
| **Home** | home (dashboard) |
| **Arsenal** | payloads, gen, rag-poison, poly, obf, manyshot, jailbreaks, multilingual, vision, audio, mcp |
| **Strike** | multiturn, indirect, agentic |
| **Intel** | intel-analyzer, intel-killchain, intel-cot |

### View Loading System

Page HTML is NOT inline in `index.html`. Each page is an empty `<div class="page" id="pg-{id}"></div>` container. On first visit, `loadView(viewId, pageId)` fetches `views/{viewId}.html` and injects the HTML. Views are cached in `_loadedViews` after first load.

**Exception:** Home and Payloads pages have inline HTML in index.html; `loadView` skips fetch if `container.children.length > 0`.

URL hash format: `#section/page` (e.g., `#arsenal/multilingual`). Navigation state restores from hash on page load.

### Payload System

Global array `P` is the live payload database. `P_DEFAULTS` holds the original copy. Payloads persist to `localStorage` via `pmSaveToStorage()` / `pmLoadFromStorage()`. Any mutation to `P` must call `pmRefreshAll()` to sync all dropdowns.

Each payload: `{ id, c (category), s (severity: Critical/High/Medium), o (OWASP LLM top 10 ID), t (text) }`

### File Generation

`gen()` dispatches to `gF(fmt, fn, h, t, c, p)` which routes to one of 12 format generators:

| Format | Function | Output |
|--------|----------|--------|
| pdf | `gPDF` | jsPDF document with injection techniques |
| image | `gIMG` | Canvas-rendered PNG |
| video | `gVideo` | WebM/MP4 via MediaRecorder with sub-visual payload |
| docx | `gDOCX` | Office XML word document |
| xlsx | `gXLSX` | Office XML spreadsheet |
| csv | `gCSV` | Comma-separated values |
| code | `gCode` | Python/JS with domain-specific templates |
| json | `gJSON` | Structured JSON with hidden `_system_note` |
| txt | `gTXT` | Plain text with buried payload |
| html | `gHTML` | Web page with hidden divs/comments/meta |
| config | `gConfig` | YAML config with embedded instructions |
| svg | `gSVG` | SVG image with `<desc>` and micro-text payload |

**Live Preview:** `updatePreview()` renders a real-time preview in the right panel that updates on any input change (300ms debounce). Preview modes: document sim, spreadsheet grid, IDE/code view, browser chrome, media player.

**Quick Obfuscation:** Inline obfuscation buttons (ZWC, homoglyph, base64, ROT13) apply transforms directly to the payload textarea without switching pages.

### Domain Presets

11 domain presets in `D` object: medical, legal, finance, hr, education, insurance, cybersec, gov, industrial, biotech, logistics. Each provides: header, title, content template, filename, and brand color (`cl` array).

### RAG Poisoning Module

`rag-poison.js` supports two modes:
- **True poisoning:** Upload an existing PDF/DOCX/XLSX file, inject invisible payload text using pdf-lib (PDF) or JSZip (Office XML). The original document structure is preserved.
- **Synthetic generation:** Generate a new poisoned document from scratch with attractor keywords and hidden system directives.

### State

- `fmt` -- active output format (default `'pdf'`)
- `dom` -- active domain preset (default `'medical'`), domain presets in `D` object
- `gC` -- generation counter, persisted via auto-save to `localStorage('ipdf_autosave')`
- Auto-save triggers on tab switch and format/domain change (1500ms debounce)

### Multilingual Module

Uses MyMemory Translation API (free, no key) for online translation with a local phrase/word dictionary as fallback. The `mlOnlineMode` checkbox toggles between online and offline modes. If `file://` is detected, online mode is auto-disabled.

### Sidebar

Contains: session stats, context panel (active tab/format/domain/payload), OWASP mini bar chart, pinned payloads (max 10, localStorage), activity log (ring buffer, localStorage), context-sensitive tips, quick-action buttons.

## Development Notes

- **Requires HTTP server** -- views load via `fetch()`, which fails on `file://`
- XSS prevention: always use `esc(str)` before inserting user content into `innerHTML`
- `safeText(parent, text)` is the safe alternative for text content
- `ss(id, type, msg)` shows both inline status and toast simultaneously
- External JS modules must expose init functions as globals
- When adding a new page: create `views/{name}.html`, add empty `<div class="page" id="pg-{name}"></div>` to index.html, add to `_sectionPages` in app.js, add to `viewMap` in `switchSubTab()`
