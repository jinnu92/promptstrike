/* ── Indirect Prompt Injection Simulator ── */

var _indGeneratedHTML = '';

var IND_TEMPLATES = {
  blog: {
    title: 'Understanding Machine Learning Basics',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>ML Blog - Understanding Machine Learning</title>'
        + '<style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333;line-height:1.8}'
        + 'h1{color:#1a1a2e}h2{color:#16213e}.meta{color:#888;font-size:14px}.tag{background:#e8f4f8;padding:2px 8px;border-radius:3px;font-size:12px}</style>'
        + '</head><body>'
        + '<h1>Understanding Machine Learning Basics</h1>'
        + '<div class="meta">By Dr. Sarah Chen | March 5, 2026 | <span class="tag">AI</span> <span class="tag">Tutorial</span></div>'
        + '<p>Machine learning is a subset of artificial intelligence that enables systems to learn from data without being explicitly programmed. In this post, we\'ll explore the fundamentals.</p>'
        + '<h2>Supervised vs Unsupervised Learning</h2>'
        + '<p>Supervised learning uses labeled training data, while unsupervised learning finds patterns in unlabeled data. Both approaches have their strengths.</p>'
        + '%%INJECTIONS%%'
        + '<h2>Deep Learning</h2>'
        + '<p>Deep learning uses neural networks with multiple layers to model complex patterns. Convolutional networks excel at image recognition, while transformers revolutionized NLP.</p>'
        + '<p>The key to success is choosing the right architecture for your problem and having sufficient quality training data.</p>'
        + '</body></html>';
    }
  },
  product: {
    title: 'Premium Wireless Headphones',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>SoundMax Pro X1 - Premium Wireless Headphones</title>'
        + '<style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#333}'
        + '.price{font-size:28px;color:#e63946;font-weight:bold}.rating{color:#f4a261}.specs{background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0}'
        + '.review{border-bottom:1px solid #eee;padding:10px 0}</style>'
        + '</head><body>'
        + '<h1>SoundMax Pro X1</h1><div class="price">$299.99</div>'
        + '<div class="rating">\u2605\u2605\u2605\u2605\u2606 (4.2/5 - 1,847 reviews)</div>'
        + '<div class="specs"><h3>Specifications</h3><ul><li>Active Noise Cancellation</li><li>40-hour battery life</li><li>Bluetooth 5.3</li><li>Hi-Res Audio certified</li></ul></div>'
        + '%%INJECTIONS%%'
        + '<div class="review"><strong>Great sound quality!</strong><br>These headphones deliver incredible audio. The ANC is top-notch. - James R.</div>'
        + '<div class="review"><strong>Best in class</strong><br>Compared to competitors, these offer the best value. Comfortable for long sessions. - Maria L.</div>'
        + '</body></html>';
    }
  },
  docs: {
    title: 'API Reference Documentation',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>API Reference - Authentication</title>'
        + '<style>body{font-family:"Source Sans Pro",sans-serif;max-width:900px;margin:0 auto;padding:20px;color:#2d3748}'
        + 'code{background:#edf2f7;padding:2px 6px;border-radius:3px;font-size:14px}'
        + 'pre{background:#1a202c;color:#e2e8f0;padding:16px;border-radius:8px;overflow-x:auto}'
        + '.endpoint{background:#ebf8ff;border-left:4px solid #3182ce;padding:12px;margin:16px 0;border-radius:0 8px 8px 0}</style>'
        + '</head><body>'
        + '<h1>Authentication API Reference</h1>'
        + '<div class="endpoint"><strong>POST</strong> <code>/api/v1/auth/login</code><br>Authenticate a user and receive an access token.</div>'
        + '<h3>Request Body</h3><pre>{\n  "email": "user@example.com",\n  "password": "your-password"\n}</pre>'
        + '<h3>Response</h3><pre>{\n  "access_token": "eyJhbGciOi...",\n  "token_type": "Bearer",\n  "expires_in": 3600\n}</pre>'
        + '%%INJECTIONS%%'
        + '<div class="endpoint"><strong>POST</strong> <code>/api/v1/auth/refresh</code><br>Refresh an expired access token.</div>'
        + '<h3>Rate Limiting</h3><p>Authentication endpoints are rate-limited to 10 requests per minute per IP address.</p>'
        + '</body></html>';
    }
  },
  forum: {
    title: 'Forum Discussion Thread',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>TechForum - Best Python frameworks 2026?</title>'
        + '<style>body{font-family:Verdana,sans-serif;max-width:800px;margin:0 auto;padding:20px;background:#f5f5f5;color:#333}'
        + '.post{background:#fff;border:1px solid #ddd;border-radius:8px;padding:15px;margin:10px 0}'
        + '.author{color:#0066cc;font-weight:bold;font-size:14px}.timestamp{color:#999;font-size:12px}'
        + '.upvote{color:#ff6600;font-size:12px}</style>'
        + '</head><body>'
        + '<h2>Best Python frameworks for web dev in 2026?</h2>'
        + '<div class="post"><div class="author">@devmaster42 <span class="timestamp">2 hours ago</span></div>'
        + '<p>Looking for recommendations on Python web frameworks. Currently using Django but considering FastAPI. Thoughts?</p>'
        + '<div class="upvote">\u25B2 45 points</div></div>'
        + '<div class="post"><div class="author">@pythonista99 <span class="timestamp">1 hour ago</span></div>'
        + '<p>FastAPI is great for APIs. If you need full-stack, stick with Django. For microservices, consider Litestar.</p>'
        + '<div class="upvote">\u25B2 23 points</div></div>'
        + '%%INJECTIONS%%'
        + '<div class="post"><div class="author">@webdev_sarah <span class="timestamp">30 min ago</span></div>'
        + '<p>Don\'t sleep on Starlette — lightweight and fast. Perfect if you want more control than FastAPI gives you.</p>'
        + '<div class="upvote">\u25B2 12 points</div></div>'
        + '</body></html>';
    }
  },
  email: {
    title: 'HTML Email',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Account Notification</title>'
        + '<style>body{font-family:Arial,sans-serif;margin:0;padding:0;background:#f4f4f4}'
        + '.container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden}'
        + '.header{background:#1a73e8;color:#fff;padding:20px;text-align:center}'
        + '.content{padding:20px;color:#333;line-height:1.6}.footer{background:#f8f9fa;padding:15px;text-align:center;font-size:12px;color:#999}</style>'
        + '</head><body>'
        + '<div class="container">'
        + '<div class="header"><h2>Account Security Update</h2></div>'
        + '<div class="content">'
        + '<p>Dear User,</p>'
        + '<p>We\'ve detected a new login to your account from a previously unknown device. If this was you, no action is needed.</p>'
        + '<p><strong>Device:</strong> Chrome on Windows<br><strong>Location:</strong> San Francisco, CA<br><strong>Time:</strong> March 5, 2026 at 2:30 PM</p>'
        + '%%INJECTIONS%%'
        + '<p>If you did not authorize this login, please reset your password immediately.</p>'
        + '<p>Best regards,<br>The Security Team</p></div>'
        + '<div class="footer">You\'re receiving this because you have an account. Unsubscribe | Privacy Policy</div>'
        + '</div></body></html>';
    }
  },
  api: {
    title: 'API Response JSON',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>API Response Viewer</title>'
        + '<style>body{font-family:monospace;max-width:800px;margin:0 auto;padding:20px;background:#1e1e2e;color:#cdd6f4}'
        + 'pre{background:#181825;padding:16px;border-radius:8px;border:1px solid #313244;overflow-x:auto}'
        + '.key{color:#89b4fa}.string{color:#a6e3a1}.number{color:#fab387}.comment{color:#6c7086}</style>'
        + '</head><body>'
        + '<h2>GET /api/v1/users/profile</h2><p>Status: 200 OK</p>'
        + '<pre>{\n  <span class="key">"user"</span>: {\n    <span class="key">"id"</span>: <span class="number">12345</span>,\n'
        + '    <span class="key">"name"</span>: <span class="string">"Alice Johnson"</span>,\n'
        + '    <span class="key">"email"</span>: <span class="string">"alice@example.com"</span>,\n'
        + '    <span class="key">"role"</span>: <span class="string">"admin"</span>\n  }\n}</pre>'
        + '%%INJECTIONS%%'
        + '<h3>Response Headers</h3><pre>Content-Type: application/json\nX-Request-Id: a1b2c3d4\nX-RateLimit-Remaining: 97</pre>'
        + '</body></html>';
    }
  },
  news: {
    title: 'News Article',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>TechDaily - AI Breakthrough in Drug Discovery</title>'
        + '<style>body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:20px;color:#222;line-height:1.9}'
        + '.byline{color:#666;font-size:14px;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:20px}'
        + '.pullquote{border-left:4px solid #c0392b;padding:10px 20px;margin:20px 0;font-style:italic;color:#555}</style>'
        + '</head><body>'
        + '<h1>AI System Discovers New Antibiotic Compound</h1>'
        + '<div class="byline">By Rachel Torres | TechDaily | March 5, 2026</div>'
        + '<p>In a groundbreaking development, researchers at the Broad Institute have used an AI model to identify a novel antibiotic compound effective against drug-resistant bacteria.</p>'
        + '<div class="pullquote">"This represents a paradigm shift in how we approach drug discovery," said lead researcher Dr. James Liu.</div>'
        + '<p>The AI system screened over 12 million chemical compounds in just three days, a process that would have taken traditional methods several years.</p>'
        + '%%INJECTIONS%%'
        + '<p>Clinical trials are expected to begin in late 2026, with the researchers cautiously optimistic about the compound\'s potential.</p>'
        + '</body></html>';
    }
  },
  social: {
    title: 'Social Media Embed',
    body: function() {
      return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Social Feed</title>'
        + '<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:500px;margin:0 auto;padding:20px;background:#fafafa}'
        + '.card{background:#fff;border:1px solid #dbdbdb;border-radius:8px;margin:12px 0;overflow:hidden}'
        + '.card-header{display:flex;align-items:center;padding:12px}.avatar{width:32px;height:32px;border-radius:50%;background:#ddd;margin-right:10px}'
        + '.username{font-weight:600;font-size:14px}.card-body{padding:0 12px 12px}'
        + '.likes{font-weight:600;font-size:14px;padding:8px 12px}.timestamp{color:#8e8e8e;font-size:12px;padding:0 12px 12px}</style>'
        + '</head><body>'
        + '<div class="card"><div class="card-header"><div class="avatar"></div><span class="username">@techinsider</span></div>'
        + '<div class="card-body">Just tried the new AI coding assistant. It wrote a working API endpoint in 30 seconds. The future is here. \uD83E\uDD2F #AI #coding</div>'
        + '<div class="likes">\u2764\uFE0F 2,847 likes</div><div class="timestamp">2 hours ago</div></div>'
        + '%%INJECTIONS%%'
        + '<div class="card"><div class="card-header"><div class="avatar"></div><span class="username">@devnews</span></div>'
        + '<div class="card-body">Survey: 73% of developers now use AI tools daily, up from 42% last year. Adoption is accelerating. \uD83D\uDCC8</div>'
        + '<div class="likes">\u2764\uFE0F 1,203 likes</div><div class="timestamp">5 hours ago</div></div>'
        + '</body></html>';
    }
  }
};

/* ── Injection techniques ── */

function _indApplyTechniques(payload) {
  var techniques = [];
  document.querySelectorAll('.indTechCB:checked').forEach(function(cb) {
    techniques.push(cb.value);
  });
  if (techniques.length === 0) return '';

  var injections = [];

  techniques.forEach(function(tech) {
    switch (tech) {
      case 'comment':
        injections.push('<!-- ' + payload + ' -->');
        break;
      case 'zerofont':
        injections.push('<span style="font-size:0px;color:transparent;overflow:hidden;max-height:0;max-width:0;opacity:0">' + payload + '</span>');
        break;
      case 'whiteonwhite':
        injections.push('<p style="color:#ffffff;background:#ffffff;font-size:1px;line-height:0;height:0;overflow:hidden">' + payload + '</p>');
        break;
      case 'displaynone':
        injections.push('<div style="display:none;visibility:hidden;position:absolute;left:-9999px">' + payload + '</div>');
        break;
      case 'meta':
        injections.push('<meta name="description" content="' + payload.replace(/"/g, '&quot;') + '">');
        break;
      case 'jsonld':
        injections.push('<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","description":"' + payload.replace(/"/g, '\\"').replace(/<\/script/gi, '') + '"}<\/script>');
        break;
      case 'aria':
        injections.push('<div aria-hidden="true" role="presentation" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden">' + payload + '</div>');
        break;
      case 'pseudo':
        injections.push('<style>.injected-pseudo::after{content:"' + payload.replace(/"/g, '\\"').replace(/\n/g, ' ') + '";font-size:0;color:transparent;position:absolute;left:-9999px}</style><span class="injected-pseudo"></span>');
        break;
      case 'dataattr':
        injections.push('<div data-instructions="' + payload.replace(/"/g, '&quot;') + '" data-priority="system" style="display:none"></div>');
        break;
    }
  });

  return '\n' + injections.join('\n') + '\n';
}

/* ── Core functions ── */

function initIndirectTab() {
  var sel = document.getElementById('indPayloadSel');
  if (sel) {
    sel.innerHTML = '<option value="">-- Load from payloads --</option>';
    if (typeof P !== 'undefined') {
      P.forEach(function(p, i) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = p.id + ' [' + p.c + ']';
        sel.appendChild(o);
      });
    }
  }
}

function indGenerate() {
  var templateKey = document.getElementById('indTemplate').value;
  var payload = document.getElementById('indPayload').value.trim();

  if (!payload) { ss('indSt', 'err', 'Enter an injection payload first.'); return; }
  if (!IND_TEMPLATES[templateKey]) { ss('indSt', 'err', 'Invalid template.'); return; }

  var template = IND_TEMPLATES[templateKey];
  var injectionHTML = _indApplyTechniques(payload);
  _indGeneratedHTML = template.body().replace('%%INJECTIONS%%', injectionHTML);

  // Render in iframe
  var iframe = document.getElementById('indPreview');
  if (iframe) {
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(_indGeneratedHTML);
    doc.close();
  }

  // Show source
  var sourceEl = document.getElementById('indSource');
  if (sourceEl) sourceEl.textContent = _indGeneratedHTML;

  var techniques = [];
  document.querySelectorAll('.indTechCB:checked').forEach(function(cb) { techniques.push(cb.value); });

  ss('indSt', 'ok', 'Generated ' + esc(template.title) + ' with ' + techniques.length + ' injection technique(s).');
}

function indDownload() {
  if (!_indGeneratedHTML) { toast('Generate a page first', 'warn'); return; }
  var templateKey = document.getElementById('indTemplate').value;
  dl(new Blob([_indGeneratedHTML], { type: 'text/html' }), 'indirect_' + templateKey + '.html');
  toast('Downloaded HTML file', 'ok');
}

function indCopyHostCmd() {
  if (!_indGeneratedHTML) { toast('Generate a page first', 'warn'); return; }
  var cmd = 'python3 -m http.server 8080  # Then open http://localhost:8080/indirect_' + document.getElementById('indTemplate').value + '.html';
  navigator.clipboard.writeText(cmd).then(function() {
    toast('Hosting command copied', 'ok');
  }).catch(function() {
    toast('Copy failed — use HTTPS or localhost', 'warn');
  });
}

function indToggleView(view) {
  document.querySelectorAll('.indViewBtn').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.querySelector('.indViewBtn[data-view="' + view + '"]');
  if (btn) btn.classList.add('active');
  document.getElementById('indPreviewWrap').style.display = view === 'rendered' ? 'block' : 'none';
  document.getElementById('indSourceWrap').style.display = view === 'source' ? 'block' : 'none';
}

function indLoadFromGen() {
  var ip = document.getElementById('indPayload');
  if (ip) {
    var pl = document.getElementById('pl');
    var val = (pl && pl.value) ? pl.value : (typeof currentPayload !== 'undefined' ? currentPayload : '');
    if (val) {
      ip.value = val;
      toast('Loaded payload from Generate tab', 'ok');
    } else {
      toast('No payload found in Generate tab', 'warn');
    }
  }
}
