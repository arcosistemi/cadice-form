// ── CONFIG ────────────────────────────────────────────────
// Sostituisci con l'URL del tuo Google Apps Script (vedi guida)
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

// ── STATE ─────────────────────────────────────────────────
let currentStep = 1;
const totalSteps = 4;

// ── NAVIGATION ────────────────────────────────────────────
function goTo(n) {
  if (n > currentStep && !validate(currentStep)) return;
  if (n === totalSteps) buildRiepilogo();
  document.getElementById('step-' + currentStep).classList.remove('active');
  currentStep = n;
  const target = document.getElementById('step-' + currentStep) || document.getElementById('step-success');
  target.classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress() {
  const pct = Math.round(((currentStep - 1) / totalSteps) * 100);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-text').textContent =
    currentStep <= totalSteps ? 'Sezione ' + currentStep + ' di ' + totalSteps : 'Completato';
}

// ── VALIDATION ────────────────────────────────────────────
function validate(step) {
  let ok = true;
  if (step === 1) {
    ok = requireField('codice', 'f-codice') & requireField('nome', 'f-nome');
    if (!document.getElementById('ragione').value.trim()) {
      // Ragione sociale not required strictly, just nudge
    }
  }
  if (step === 2) {
    const r = document.querySelector('input[name="cadice"]:checked');
    if (!r) { alert('Indica se hai già utilizzato CADICE.'); ok = false; }
  }
  if (step === 3) {
    const m = document.querySelector('input[name="mandato"]:checked');
    if (!m) { alert('Seleziona il tipo di mandato dell\'agenzia.'); ok = false; }
    const p = document.querySelector('input[name="partecipa"]:checked');
    if (!p) { alert('Indica chi parteciperà all\'appuntamento.'); ok = false; }
    if (p && p.value === 'Collaboratore delegato') {
      if (!document.getElementById('collaboratore').value.trim()) {
        alert('Inserisci il nome del collaboratore delegato.'); ok = false;
      }
    }
  }
  return !!ok;
}

function requireField(inputId, fieldId) {
  const inp = document.getElementById(inputId);
  const field = document.getElementById(fieldId);
  if (!inp.value.trim()) {
    field.classList.add('has-error');
    inp.addEventListener('input', () => field.classList.remove('has-error'), { once: true });
    return false;
  }
  return true;
}

// ── UI HELPERS ────────────────────────────────────────────
function selectRadio(id, labelEl) {
  const name = document.getElementById(id).name;
  document.querySelectorAll('input[name="' + name + '"]').forEach(r => {
    r.closest('.radio-item').classList.remove('selected');
  });
  document.getElementById(id).checked = true;
  labelEl.classList.add('selected');
}

function toggleSection(sectionId, cbId) {
  const section = document.getElementById(sectionId);
  const cb = document.getElementById(cbId);
  setTimeout(() => {
    if (cb.checked) {
      section.classList.add('selected');
      // Auto-check all sub-items when parent is checked
      section.querySelectorAll('.section-subs input[type=checkbox]').forEach(c => {
        c.checked = true;
      });
    } else {
      section.classList.remove('selected');
      // Uncheck all sub-items when parent is unchecked
      section.querySelectorAll('input[type=checkbox]').forEach(c => {
        if (c !== cb) c.checked = false;
      });
    }
  }, 0);
}

// When a sub-item is manually unchecked, if ALL subs are unchecked, uncheck parent too
document.addEventListener('change', function(e) {
  if (e.target.closest('.section-subs')) {
    const section = e.target.closest('.section-main');
    if (!section) return;
    const parentCb = section.querySelector('.section-main-label input[type=checkbox]');
    const subs = section.querySelectorAll('.section-subs input[type=checkbox]');
    const anyChecked = Array.from(subs).some(s => s.checked);
    if (!anyChecked && parentCb) {
      parentCb.checked = false;
      section.classList.remove('selected');
    }
  }
});

function showMandatoVita() { document.getElementById('f-vita').classList.add('visible'); }
function hideMandatoVita() {
  document.getElementById('f-vita').classList.remove('visible');
  document.querySelectorAll('input[name="vita"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="vita"]').forEach(r => r.closest('.radio-item').classList.remove('selected'));
}
function showCollaboratore() { document.getElementById('f-collab').classList.add('visible'); }
function hideCollaboratore() {
  document.getElementById('f-collab').classList.remove('visible');
  document.getElementById('collaboratore').value = '';
}

// cadice sì/no → show notifiche field
document.addEventListener('change', function(e) {
  if (e.target.name === 'cadice') {
    document.getElementById('f-notifiche').style.display = (e.target.value === 'No') ? 'block' : 'none';
  }
});

// ── RIEPILOGO ─────────────────────────────────────────────
function buildRiepilogo() {
  const sezioni = [];
  document.querySelectorAll('.section-main.selected > .section-main-label input[type=checkbox]').forEach(cb => {
    const subs = [];
    const sm = cb.closest('.section-main');
    sm.querySelectorAll('.section-subs input:checked').forEach(s => subs.push(s.value));
    sezioni.push(cb.value + (subs.length ? ' (' + subs.join(', ') + ')' : ''));
  });

  const mandato = document.querySelector('input[name="mandato"]:checked');
  const vita = document.querySelector('input[name="vita"]:checked');
  const cadice = document.querySelector('input[name="cadice"]:checked');
  const partecipa = document.querySelector('input[name="partecipa"]:checked');

  const rows = [
    ['Codice Agenzia', document.getElementById('codice').value],
    ['Ragione Sociale', document.getElementById('ragione').value || '—'],
    ['Agente', document.getElementById('nome').value],
    ['CADICE già usato', cadice ? cadice.value : '—'],
    cadice && cadice.value === 'Sì' ? ['Notifiche', document.getElementById('notifiche').value || '0'] : null,
    ['Sezioni interesse', sezioni.length ? sezioni.join(' · ') : 'Nessuna selezionata'],
    ['Tipo mandato', mandato ? mandato.value : '—'],
    mandato && mandato.value === 'Plurimandataria' ? ['Mandato VITA esterno', vita ? vita.value : '—'] : null,
    ['Partecipante', partecipa ? partecipa.value : '—'],
    partecipa && partecipa.value === 'Collaboratore delegato' ? ['Collaboratore', document.getElementById('collaboratore').value] : null,
  ].filter(Boolean);

  const html = rows.map(([k, v]) =>
    `<div class="summary-row"><span class="k">${k}</span><span class="v">${v}</span></div>`
  ).join('');
  document.getElementById('riepilogo-content').innerHTML = html;
}

// ── SUBMIT ────────────────────────────────────────────────
async function submitForm() {
  const luogo = '';
  const data = document.getElementById('data-firma').value.trim();

  const sezioni = [];
  document.querySelectorAll('.section-main.selected > .section-main-label input[type=checkbox]').forEach(cb => {
    const subs = [];
    cb.closest('.section-main').querySelectorAll('.section-subs input:checked').forEach(s => subs.push(s.value));
    sezioni.push(cb.value + (subs.length ? ' (' + subs.join(', ') + ')' : ''));
  });

  const mandato = document.querySelector('input[name="mandato"]:checked');
  const vita = document.querySelector('input[name="vita"]:checked');
  const cadice = document.querySelector('input[name="cadice"]:checked');
  const partecipa = document.querySelector('input[name="partecipa"]:checked');

  const payload = {
    timestamp: new Date().toLocaleString('it-IT'),
    codice: document.getElementById('codice').value,
    ragione: document.getElementById('ragione').value,
    agente: document.getElementById('nome').value,
    cadice_usato: cadice ? cadice.value : '',
    notifiche: document.getElementById('notifiche').value || '',
    sezioni: sezioni.join(' | '),
    mandato: mandato ? mandato.value : '',
    mandato_vita: vita ? vita.value : '',
    partecipante: partecipa ? partecipa.value : '',
    collaboratore: document.getElementById('collaboratore').value,
    luogo: luogo,
    data: data,
  };

  // Loading state
  document.getElementById('btn-label').textContent = 'Invio in corso…';
  document.getElementById('spinner').style.display = 'block';
  document.getElementById('btn-invia').disabled = true;

  try {
    if (APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
      // DEMO MODE: simula invio
      await new Promise(r => setTimeout(r, 1200));
      showSuccess(payload);
      return;
    }
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    showSuccess(payload);
  } catch (err) {
    alert('Errore durante l\'invio. Riprova o contatta info@auaonline.it');
    document.getElementById('btn-label').textContent = 'Invia scheda';
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('btn-invia').disabled = false;
  }
}

function showSuccess(payload) {
  document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
  document.getElementById('step-success').classList.add('active');
  document.getElementById('progress-fill').style.width = '100%';
  document.getElementById('progress-pct').textContent = '100%';
  document.getElementById('progress-text').textContent = 'Completato';

  const rows = [
    ['Agente', payload.agente],
    ['Agenzia', payload.ragione || payload.codice],
    ['Tipo mandato', payload.mandato],
    ['Partecipante', payload.partecipante],
    ['Data di compilazione', payload.data],
  ];
  document.getElementById('success-summary').innerHTML = rows.map(([k, v]) =>
    `<div class="summary-row"><span class="k">${k}</span><span class="v">${v || '—'}</span></div>`
  ).join('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  document.querySelectorAll('input[type=text], input[type=number], input[type=email]').forEach(i => i.value = '');
  document.getElementById('data-firma').value = todayIT();
  document.querySelectorAll('input[type=radio], input[type=checkbox]').forEach(i => i.checked = false);
  document.querySelectorAll('.radio-item, .section-main').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.sub-field').forEach(el => el.classList.remove('visible'));
  document.getElementById('f-notifiche').style.display = 'none';
  document.getElementById('step-success').classList.remove('active');
  currentStep = 1;
  document.getElementById('step-1').classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ── PDF DOWNLOAD ──────────────────────────────────────────
function collectData() {
  const sezioni = [];
  document.querySelectorAll('.section-main.selected > .section-main-label input[type=checkbox]').forEach(cb => {
    const subs = [];
    cb.closest('.section-main').querySelectorAll('.section-subs input:checked').forEach(s => subs.push(s.value));
    sezioni.push(cb.value + (subs.length ? ' (' + subs.join(', ') + ')' : ''));
  });
  const mandato = document.querySelector('input[name="mandato"]:checked');
  const vita = document.querySelector('input[name="vita"]:checked');
  const cadice = document.querySelector('input[name="cadice"]:checked');
  const partecipa = document.querySelector('input[name="partecipa"]:checked');
  return {
    codice: document.getElementById('codice').value || '—',
    ragione: document.getElementById('ragione').value || '—',
    agente: document.getElementById('nome').value || '—',
    cadice_usato: cadice ? cadice.value : '—',
    notifiche: document.getElementById('notifiche').value || '—',
    sezioni: sezioni.length ? sezioni.join(', ') : 'Nessuna selezionata',
    mandato: mandato ? mandato.value : '—',
    mandato_vita: vita ? vita.value : '—',
    partecipante: partecipa ? partecipa.value : '—',
    collaboratore: document.getElementById('collaboratore').value || '—',
    data: document.getElementById('data-firma').value || todayIT(),
  };
}

function downloadPDF() {
  const d = collectData();
  const rows = [
    ['Codice Agenzia', d.codice],
    ['Ragione Sociale', d.ragione],
    ['Agente', d.agente],
    ['CADICE già utilizzato', d.cadice_usato],
    ...(d.cadice_usato === 'No' ? [['Notifiche rilevate', d.notifiche]] : []),
    ['Sezioni di interesse', d.sezioni],
    ['Tipo mandato', d.mandato],
    ...(d.mandato === 'Plurimandataria' ? [['Mandato VITA esterno', d.mandato_vita]] : []),
    ['Partecipante', d.partecipante],
    ...(d.partecipante === 'Collaboratore delegato' ? [['Collaboratore', d.collaboratore]] : []),
    ['Data di compilazione', d.data],
  ];

  const rowsHTML = rows.map(([k, v]) =>
    '<tr>' +
    '<td style="padding:9px 14px;font-size:12px;color:#5A6280;font-weight:500;border-bottom:1px solid #EEF0F5;width:45%;">' + k + '</td>' +
    '<td style="padding:9px 14px;font-size:12px;color:#0B1F4A;font-weight:600;border-bottom:1px solid #EEF0F5;">' + v + '</td>' +
    '</tr>'
  ).join('');

  const printContent = '<!DOCTYPE html>' +
    '<html lang="it"><head><meta charset="UTF-8">' +
    '<title>Riepilogo CADICE</title>' +
    '<style>' +
    '* { box-sizing:border-box; margin:0; padding:0; }' +
    'body { font-family: Arial, sans-serif; background:#fff; color:#0B1F4A; }' +
    '.page { max-width:680px; margin:0 auto; padding:40px 40px 60px; }' +
    '.header { background:#0B1F4A; padding:24px 28px; margin-bottom:32px; }' +
    '.header h1 { font-size:17px; font-weight:700; color:white; line-height:1.3; }' +
    '.header p { font-size:12px; color:#E8C97A; margin-top:4px; }' +
    '.gold-bar { height:3px; background:#C9A84C; margin-bottom:28px; }' +
    'h2 { font-size:13px; font-weight:700; color:#C9A84C; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:12px; }' +
    'table { width:100%; border-collapse:collapse; border:1px solid #EEF0F5; }' +
    'tr:nth-child(even) { background:#F8F9FB; }' +
    '.footer { margin-top:40px; text-align:center; font-size:11px; color:#8A91A8; border-top:1px solid #EEF0F5; padding-top:16px; }' +
    '</style></head><body>' +
    '<div class="page">' +
    '<div class="header"><h1>Scheda Appuntamento Assistenza CADICE</h1>' +
    '<p>AUA — Agenti UnipolSai Associati · Sistema AUA</p></div>' +
    '<div class="gold-bar"></div>' +
    '<h2>Riepilogo dati compilati</h2>' +
    '<table>' + rowsHTML + '</table>' +
    '<div class="footer">AUA — Agenti UnipolSai Associati · Via Stalingrado 57, 40128 Bologna · info@auaonline.it</div>' +
    '</div></body></html>';

  // Create blob and download as HTML (printable)
  const blob = new Blob([printContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Riepilogo_CADICE_' + d.agente.replace(/\s+/g, '_') + '.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Set today's date as default value (editable)
function todayIT() {
  return new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
document.getElementById('data-firma').value = todayIT();
updateProgress();