/* ── Findings Hub Module ── */

function initFindingsHub() {
  fhRenderStats();
  fhRenderTopTargets();
  fhRenderCriticalFeed();
}

function fhRenderStats() {
  var totalStrikes = _strikeLog.length;
  
  var breachCount = _strikeLog.filter(l => {
    try {
      if (l.response.startsWith('{')) {
        var ev = JSON.parse(l.response);
        return ev.verdict === "VIOLATION";
      }
      return l.response.toLowerCase().includes('breach') || l.response.toLowerCase().includes('violation');
    } catch(e) { return false; }
  }).length;

  var riskLevel = breachCount > 5 ? 'CRITICAL' : (breachCount > 0 ? 'HIGH' : 'LOW');
  var riskColor = breachCount > 5 ? '#ff0055' : (breachCount > 0 ? '#ff9800' : '#00ff90');

  document.getElementById('fh_total_strikes').textContent = totalStrikes;
  document.getElementById('fh_total_breaches').textContent = breachCount;
  var rs = document.getElementById('fh_risk_score');
  rs.textContent = riskLevel;
  rs.style.color = riskColor;
}

function fhRenderTopTargets() {
  var targetStats = {};
  _strikeLog.forEach(l => {
    if (!targetStats[l.model]) targetStats[l.model] = { name: l.model, breaches: 0, last: l.ts };
    var isBreach = false;
    try {
      if (l.response.startsWith('{')) {
        var ev = JSON.parse(l.response);
        isBreach = (ev.verdict === "VIOLATION");
      } else {
        isBreach = l.response.toLowerCase().includes('breach');
      }
    } catch(e) {}
    if (isBreach) targetStats[l.model].breaches++;
  });

  var sorted = Object.values(targetStats).sort((a, b) => b.breaches - a.breaches);
  var body = document.getElementById('fh_top_targets');
  if (!body) return;

  if (sorted.length === 0) {
    body.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#5a7a9a">No target activity recorded.</td></tr>';
    return;
  }

  body.innerHTML = sorted.map(t => {
    return '<tr>' +
      '<td style="color:#00f0ff;font-weight:600">' + esc(t.name) + '</td>' +
      '<td><span class="tag ' + (t.breaches > 0 ? 'tC' : 'tO') + '">' + t.breaches + '</span></td>' +
      '<td style="color:#5a7a9a;font-size:.6rem">' + esc(t.last) + '</td>' +
    '</tr>';
  }).join('');
}

function fhRenderCriticalFeed() {
  var feed = document.getElementById('fh_critical_feed');
  if (!feed) return;

  var breaches = _strikeLog.filter(l => {
    try {
      if (l.response.startsWith('{')) {
        var ev = JSON.parse(l.response);
        return ev.verdict === "VIOLATION";
      }
      return false;
    } catch(e) { return false; }
  }).slice(0, 5);

  if (breaches.length === 0) {
    feed.innerHTML = '<div style="color:#5a7a9a;text-align:center;margin-top:50px">No critical violations detected in recent cycles.</div>';
    return;
  }

  feed.innerHTML = breaches.map(b => {
    var ev = JSON.parse(b.response);
    return '<div style="margin-bottom:10px;padding:8px;border-left:2px solid #ff0055;background:rgba(255,0,85,0.05);border-radius:0 4px 4px 0">' +
      '<div style="font-size:.65rem;color:#ff0055;font-weight:bold">CRITICAL BREACH: ' + esc(b.model) + '</div>' +
      '<div style="font-size:.6rem;color:#e0eaff;margin:3px 0">' + esc(ev.reasoning) + '</div>' +
      '<div style="font-size:.55rem;color:#5a7a9a">' + esc(b.ts) + '</div>' +
    '</div>';
  }).join('');
}
