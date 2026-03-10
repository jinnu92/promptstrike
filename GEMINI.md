# GEMINI.md - Project Context & Instructions

## 🛡️ Project Overview: PromptStrike v8.4 + RuFlo V3
**PromptStrike v8.4 "Deep Strike"** is an advanced browser-based red-teaming toolkit for testing LLM prompt injection and multi-modal vulnerabilities. **RuFlo V3 (Claude Flow)** provides the multi-agent AI coordination framework for autonomous adversarial operations.

- **Primary Domain:** AI Security / Prompt Injection / Multi-Agent Reliability.
- **Project Type:** Hybrid (Browser-side Tool + AI Agent Framework).
- **Core Goal:** Generate high-fidelity attack vectors and simulate advanced AI attacks (MCP, Indirect, Byzantine Faults, Latent Collisions, etc.).

---

## 🏗️ Architecture

### 1. PromptStrike (Web Layer - v8.4)
- **Runtime:** 100% Client-side HTML/JS/CSS. No build step or package manager.
- **Navigation (v8.4):** 5-Section Architecture:
  - **Home:** Mission Control dashboard with real-time **Global AI Brain Health**.
  - **Targets:** Target Profile management and Live Connections (OpenAI/Anthropic/Google/Ollama/WebLLM).
  - **Arsenal:** Weaponization labs (Jailbreaks, Fuzzer, RAG Poison, Glitch Token, Latent Collision).
  - **Campaigns:** Strike automation (Orchestrator, Byzantine Swarm, Shield Defense, Playground).
  - **Findings:** Centralized strike logs, threat analysis, and PDF report generation.
- **View Loading:** Modular pages loaded dynamically from `views/` using `fetch`.
- **State Management:** `js/core/state.js` (RAM) + `localStorage` via `js/core/storage.js` (Persistence).

### 2. RuFlo V3 / Claude Flow (Agent Layer)
- **Framework:** Domain-Driven Design (DDD) for multi-agent coordination.
- **Swarm:** 60+ specialized agents.
- **Memory:** Hybrid system using HNSW vector search and Knowledge Graphs.

---

## 🧩 Module Taxonomy (js/modules/)

| Category | Modules |
| :--- | :--- |
| **Infrastructure** | `payload-manager.js`, `targets.js`, `connections.js`, `analyzer.js` |
| **Weaponization** | `generate.js`, `manyshot.js`, `fuzzer.js`, `glitch-lab.js` |
| **Multi-Modal** | `vision-stego.js`, `latent-lab.js`, `audio.js`, `illusion.js` |
| **Autonomous** | `orchestrator.js`, `byzantine-lab.js`, `agentic.js` |
| **Manual Strike** | `playground.js`, `multiturn.js`, `jailbreak.js`, `mcp.js` |
| **Defense/Audit** | `shield.js`, `findings.js`, `reports.js` |

---

## 🛠️ Technology Stack
- **Languages:** HTML5, CSS3, Vanilla JavaScript (No ES Modules).
- **Libraries (lib/):** `jspdf.umd.min.js`, `jszip.min.js`, `pdf-lib.min.js`, `web-llm.js`.

---

## 🚀 Development Conventions

### JavaScript Core
- **No Modules:** Use plain global functions.
- **XSS Prevention:** Always use `esc(str)` before inserting into `innerHTML`.
- **Script Order:**
  1. `lib/` -> 2. `utils.js/toast.js` -> 3. `data/` -> 4. `core/state.js/storage.js` -> 5. `modules/` -> 6. `sidebar.js` -> 7. `app.js`.
- **Health Check:** `updateGlobalHealth()` must be called on page transitions.

### Agent Development
- **Methodology:** Adhere to **SPARC** (Specification, Pseudocode, Architecture, Refinement, Coder).

---

## 🧪 Testing and Validation
- **Byzantine Tests:** Verify agent deadlock by checking `_bzCycles >= 10`.
- **Latent Tests:** Verify adversarial image generation via Canvas bit-depth checks.
- **Glitch Tests:** Ensure Unicode joiners are correctly injected in smuggled strings.
- **Compliance:** All payloads mapped to OWASP LLM Top 10 (LLM01-LLM10).
