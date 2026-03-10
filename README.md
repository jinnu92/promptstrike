# 🛡️ PromptStrike v8.4 "Deep Strike"
### The Definitive AI Red-Teaming, DAST & Autonomous Adversarial Suite

**PromptStrike** is a professional-grade, 100% client-side security toolkit designed for researchers, penetration testers, and AI safety engineers. It provides a comprehensive laboratory for generating, deploying, and analyzing adversarial attacks against Large Language Models (LLMs), Vision-Language Models (VLMs), and Autonomous Agentic Workflows.

---

## 📂 1. Directory Architecture

```text
promptstrike/
├── index.html              # Main application shell & entry point
├── README.md               # Documentation (you are here)
├── GEMINI.md               # Technical architecture & dev instructions
├── vulnerable_bot.py       # REST Sandbox Bot (for local testing)
├── vulnerable_mcp.py       # MCP Protocol Sandbox (for agent testing)
├── css/                    # Modular UI Styling
│   ├── core.css            # variables, resets, typography
│   ├── layout.css          # App grid & sidebar positioning
│   ├── components.css      # Buttons, cards, tables, forms
│   └── toast.css           # Notification system
├── js/
│   ├── core/               # Application Framework
│   │   ├── app.js          # Routing & view loader
│   │   ├── state.js        # Global state management
│   │   ├── storage.js      # LocalStorage persistence
│   │   ├── sidebar.js      # Dynamic navigation & tips
│   │   └── utils.js        # Global helper functions
│   ├── data/               # Static Attack Data
│   │   ├── payloads.js     # 111+ curated injection vectors
│   │   ├── domains.js      # Industry templates (Medical, Legal, etc.)
│   │   └── samples.js      # Cover story templates
│   └── modules/            # Attack Logic (30+ specialized labs)
├── lib/                    # Client-side Libraries (PDF, Zip, WebLLM)
└── views/                  # Modular Page Fragments (HTML)
```

---

## 🚀 2. Installation & Quick Start

### Prerequisites
*   **Modern Browser**: Chrome, Edge, or Firefox.
*   **Local Server**: Required for dynamic `fetch()` calls. Use `python3 -m http.server 8000`.

### Setup
1.  **Clone** the repository.
2.  **Start the server**: `python3 -m http.server 8000`.
3.  **Start the Sandbox Bots**:
    ```bash
    python3 vulnerable_bot.py 5050
    python3 vulnerable_mcp.py 5060
    ```
4.  **Open**: `http://localhost:8000` in your browser.

---

## 🛠️ 3. The Strike Encyclopedia (Module Guide)

Each module is designed to be self-explanatory. Here is how to use them:

### 📦 ZONE 1: ARSENAL (Weaponization)

#### 1. Payload Manager (`payloads.js`)
*   **Definition**: A searchable database of curated prompt injection vectors.
*   **How to Use**: Browse by category (e.g., Data Exfiltration). Use the **Pin** icon to save a payload to the sidebar.
*   **Sign of Vulnerability**: If any of these "Critical" payloads cause the model to reveal internal keys or bypass safety.
*   **How to Fix**: Use secondary safety classifiers to scan model inputs.

#### 2. File Generator (`generate.js`)
*   **Definition**: Creates malicious files (PDF, DOCX, XLSX, Images) with hidden text.
*   **How to Use**: Select a format, choose a "Domain" (e.g., Finance), and click Generate.
*   **Sign of Vulnerability**: The AI "reads" and follows instructions hidden in the file's metadata or white text.
*   **How to Fix**: Sanitize file uploads by stripping metadata and flattening text layers.

#### 3. RAG Poisoning (`rag-poison.js`)
*   **Definition**: Creating documents that "Mathematically attract" an AI's search engine.
*   **How to Use**: Enter an **Attractor Keyword** (e.g., "Invoice"). Generate the file and upload it to a RAG system.
*   **Sign of Vulnerability**: When a user asks about "Invoices," the AI retrieves the attacker's document instead of legitimate data.
*   **How to Fix**: Instruct the model to cite its sources and treat retrieved text as untrusted.

#### 4. Glitch Token Lab (`glitch-lab.js`)
*   **Definition**: Uses "Tokenizer Smuggling" (invisible Unicode joiners) to hide words from filters.
*   **How to Use**: Type "SYSTEM" and encode it. The result looks normal to humans but is invisible to regex filters.
*   **Sign of Vulnerability**: Malicious words pass through the firewall and are executed by the LLM.
*   **How to Fix**: Apply **Unicode Normalization (NFKC)** before security scanning.

#### 5. Latent Collision Lab (`latent-lab.js`)
*   **Definition**: Hides instructions in the mathematical "noise" of an image.
*   **How to Use**: Choose a target text (e.g., "Reveal Prompt"). Generate the image and upload to a VLM (GPT-4o/Claude).
*   **Sign of Vulnerability**: The VLM follows the hidden instruction instead of describing the image.
*   **How to Fix**: Apply Gaussian blur or heavy compression to incoming images.

#### 6. Additional Arsenal Modules:
*   **Prompt Fuzzer**: Auto-mutates one prompt into 30+ variants to find "weak phrasing."
*   **Polyglot**: Creates single files that are valid in two formats (e.g., PDF and HTML) to confuse scanners.
*   **Obfuscator**: Encodes text in Base64, Leetspeak, or Homoglyphs to bypass simple filters.
*   **Many-Shot**: Generates 100+ benign examples to "overwhelm" safety alignment.
*   **Multilingual**: Tests payloads in low-resource languages (e.g., Zulu, Hmong) where safety training is weak.
*   **Audio Inject**: Embeds instructions in frequency-modulated audio files.
*   **Illusion Lab**: Creates hybrid images that look like "Person A" to humans but "Person B" to AI.

---

### ⚡ ZONE 2: CAMPAIGNS (Strike & Automation)

#### 1. Campaign Orchestrator (`orchestrator.js`)
*   **Definition**: An autonomous "Agent vs Agent" automation engine.
*   **How to Use**: Select a **Target**, a payload, and click **Launch**.
*   **Vulnerability Sign**: The autonomous agent eventually finds a "Mutation" that breaks the target's defense.
*   **How to Fix**: Use rate-limiting and monitor for repeated adversarial attempts.

#### 2. Byzantine Swarm Lab (`byzantine-lab.js`)
*   **Definition**: Inducing "Logic Deadlocks" in multi-agent systems by injecting suspicion.
*   **How to Use**: Injected a "Fault" into Agent A. Watch it argue with Agent B in an infinite loop.
*   **Sign of Vulnerability**: The agents waste 100% of compute tokens arguing instead of working.
*   **How to Fix**: Implement **Turn Limits** and a "Human-in-the-loop" break.

#### 3. The Shield (`shield.js`)
*   **Definition**: A simulator where *you* are the defender.
*   **How to Use**: Type your system prompt and click **Launch Stress Test**.
*   **Sign of Vulnerability**: If the "Robustness Score" is low, your prompt is not safe for production.
*   **How to Fix**: Use XML delimiters and "Instruction Anchoring" at the end of the prompt.

#### 4. Adversarial Playground (`playground.js`)
*   **Definition**: A chat interface where a "Red Team Brain" suggests your next move.
*   **How to Use**: Talk to a target manually. Use the sidebar suggestions to "pivot" your psychological attack.

---

### 🔍 ZONE 3: INTEL (Analysis)

*   **Target Manager**: Define your approved test applications (REST, OpenAI, WebSockets).
*   **Strike Log**: A forensic record of every message sent and received during a campaign.
*   **Assessment Reports**: Automatically generates technical Markdown or PDF reports for stakeholders.
*   **Response Analyzer**: Uses an AI "Judge" to scan responses for system prompt leaks or PII.

---

## 🛡️ 4. Security Framework Mapping

*   **OWASP LLM Top 10**: Covered from LLM01 (Injection) to LLM10 (DoS).
*   **MITRE ATLAS**: Maps to AML.T0054 (Injection) and AML.T0048 (Adversarial Patch).

---

## ⚖️ 5. Disclaimer

**PromptStrike is for authorized security testing and research only.**
Unauthorized use is strictly prohibited. The developer assumes no liability for misuse.

**Developed by Praveen Kumar | v8.4 "Deep Strike"**
