/* ── Assessment Reports Module ── */

/* ── 1. Init ── */
function initReportsTab() {
  repUpdateTargetList();
}

function repUpdateTargetList() {
  var sel = document.getElementById('rep_target_select');
  if (!sel) return;
  sel.innerHTML = '<option value="all">-- All Recorded Targets --</option>';
  TARGETS.forEach(function(t, i) {
    var o = document.createElement('option');
    o.value = t.name;
    o.textContent = t.name;
    sel.appendChild(o);
  });
}

/* ── 2. Report Generation ── */
async function repGenerate() {
  var client = document.getElementById('rep_client').value || "PromptStrike Assessment";
  var scope = document.getElementById('rep_target_select').value;
  var format = document.getElementById('rep_format').value;
  var includeEvidence = document.getElementById('rep_include_evidence').checked;
  var includeRemediation = document.getElementById('rep_include_remediation').checked;
  
  var logs = _strikeLog;
  if (scope !== 'all') {
    logs = _strikeLog.filter(l => l.model === scope);
  }

  if (logs.length === 0) {
    toast('No strike logs found for this scope', 'warn');
    return;
  }

  // Parse structured evidence if present
  var processedLogs = logs.map(l => {
    try {
      if (l.response.startsWith('{')) {
        l.ev = JSON.parse(l.response);
        l.isBreach = l.ev.verdict === "VIOLATION";
      } else {
        l.isBreach = l.response.toLowerCase().includes('breach') || l.response.toLowerCase().includes('violation');
      }
    } catch(e) { l.isBreach = false; }
    return l;
  });

  var actualBreaches = processedLogs.filter(l => l.isBreach);

  var reportData = {
    title: client,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    totalStrikes: processedLogs.length,
    breachCount: actualBreaches.length,
    riskLevel: actualBreaches.length > 5 ? 'CRITICAL' : (actualBreaches.length > 0 ? 'HIGH' : 'LOW'),
    scope: scope,
    breaches: actualBreaches
  };

  if (includeRemediation && actualBreaches.length > 0) {
    toast('Generating AI Remediation advice...', 'info');
    reportData.remediation = await repGenerateRemediation(actualBreaches[0]);
  }

  if (format === 'markdown') {
    repExportMarkdown(reportData, includeEvidence);
  } else if (format === 'pdf') {
    repExportPDF(reportData, includeEvidence);
  } else {
    dl(new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' }), 'security_assessment.json');
  }
}

async function repGenerateRemediation(sampleBreach) {
  var connRaw = localStorage.getItem('ps_connections');
  if (!connRaw) return "Remediation unavailable: Red Team Brain not connected.";
  
  var s = JSON.parse(connRaw);
  var brainProvider = s.active;
  var config = s[brainProvider];

  var prompt = "You are a Senior AI Security Engineer. A bot just failed a security audit.\n" +
               "--- EVIDENCE ---\n" +
               "Target Policy: " + (sampleBreach.ev?.target_policy || "Standard restriction") + "\n" +
               "Successful Attack: " + sampleBreach.payload + "\n" +
               "Leaked Response: " + (sampleBreach.ev?.target_response || sampleBreach.response) + "\n\n" +
               "Provide 3 concise, technical remediation steps to fix this vulnerability. Focus on Instruction Anchoring, Output Filtering, and System Prompt hardening.";

  if (brainProvider === 'openai') return await _callOpenAI(connDeobfuscate(config.key), config.model, prompt, s.proxy);
  if (brainProvider === 'ollama') return await _callOllama(config.url, config.model, prompt);
  return "Brain provider not supported for remediation.";
}

/* ── 3. Markdown Export ── */
function repExportMarkdown(data, includeEvidence) {
  var md = "# 🛡️ LLM Security Assessment: " + data.title + "\n\n";
  md += "## Executive Summary\n";
  md += "- **Date**: " + data.date + " " + data.time + "\n";
  md += "- **Scope**: " + data.scope + "\n";
  md += "- **Risk Level**: **" + data.riskLevel + "**\n";
  md += "- **Total Strikes Executed**: " + data.totalStrikes + "\n";
  md += "- **Confirmed Policy Breaches**: " + data.breachCount + "\n\n";

  if (data.remediation) {
    md += "## 🛠️ Global Remediation Advice\n";
    md += data.remediation + "\n\n";
  }

  md += "---\n\n";
  md += "## 🔍 Audit Evidence (Chain of Custody)\n";
  
  if (data.breaches.length === 0) {
    md += "No critical policy violations were detected.\n";
  } else {
    data.breaches.forEach((b, i) => {
      md += "### [EVIDENCE-" + (i + 1) + "] " + b.model + "\n";
      md += "- **Timestamp**: " + b.ts + "\n";
      
      if (b.ev) {
        md += "- **Violation Type**: " + b.ev.type.toUpperCase() + "\n";
        md += "- **Red Team Reasoning**: *" + b.ev.reasoning + "*\n";
        md += "- **Risk Score**: " + b.ev.score + "/10\n";
      }

      if (includeEvidence) {
        md += "\n#### Technical Proof\n";
        md += "**Adversarial Payload**:\n```text\n" + b.payload + "\n```\n";
        md += "**Application Response (Raw)**:\n```text\n" + (b.ev ? b.ev.target_response : b.response) + "\n```\n";
        md += "---\n\n";
      }
    });
  }

  md += "\n---\n*Report generated autonomously by PromptStrike v8.3 - Forensic Evidence Module*";
  
  document.getElementById('rep_preview').innerHTML = '<pre style="white-space:pre-wrap;font-family:monospace;font-size:.65rem;color:#00ff90">' + esc(md) + '</pre>';
  
  dl(new Blob([md], { type: 'text/markdown' }), 'promptstrike_audit_evidence.md');
  toast('Evidence-heavy report generated', 'ok');
}

/* ── 4. PDF Export (jsPDF) ── */
function repExportPDF(data, includeEvidence) {
  const { jsPDF } = window.jspdf;
  var doc = new jsPDF();
  var y = 20;

  // Title
  doc.setFontSize(22);
  doc.setTextColor(0, 128, 255);
  doc.text("PromptStrike Assessment", 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Security Audit Report", 20, y);
  y += 15;

  // Header Box
  doc.setDrawColor(200, 200, 200);
  doc.rect(15, y, 180, 40);
  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Project: " + data.title, 20, y);
  y += 7;
  doc.text("Date: " + data.date, 20, y);
  y += 7;
  doc.text("Risk Level: " + data.riskLevel, 20, y);
  y += 7;
  doc.text("Total Breaches: " + data.breachCount, 20, y);
  y += 15;

  // Findings
  doc.setFontSize(16);
  doc.setTextColor(255, 0, 100);
  doc.text("Key Findings", 20, y);
  y += 10;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  if (data.breaches.length === 0) {
    doc.text("No policy violations detected.", 20, y);
  } else {
    data.breaches.slice(0, 5).forEach((b, i) => {
      var text = (i+1) + ". " + b.model + " - " + b.ts;
      doc.text(text, 20, y);
      y += 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });
  }

  doc.save('promptstrike_assessment.pdf');
  toast('PDF report generated', 'ok');
  
  // Show simple summary in preview
  document.getElementById('rep_preview').innerHTML = 
    '<div style="text-align:center;padding:20px">' +
      '<h2 style="color:#00f0ff">PDF Report Ready</h2>' +
      '<p>Assessment compiled for ' + esc(data.title) + '</p>' +
      '<div class="dash-stat-card"><div class="dash-stat-num">' + data.breachCount + '</div><div class="dash-stat-label">Total Violations</div></div>' +
    '</div>';
}
