// ── CONFIG ────────────────────────────────────────────────
// Sostituisci con l'URL del tuo Google Apps Script (vedi guida)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhdrvHXdoylSClpoDyKSn22E58Mf1JLNl7EUotfCzo4RwrYgd_dxukecx96nSfUwJitQ/exec';

// ── STATE ─────────────────────────────────────────────────
let currentStep = 1;
const totalSteps = 5;

// ── NAVIGATION ────────────────────────────────────────────
function goTo(n) {
  if (n > currentStep && !validate(currentStep)) return;
  if (n === 5) buildRiepilogo();
  document.getElementById('step-' + currentStep).classList.remove('active');
  currentStep = n;
  const target = document.getElementById('step-' + currentStep) || document.getElementById('step-success');
  target.classList.add('active');
  updateProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (n === 4) initCalendly();
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
    // Validate email
    const emailVal = document.getElementById('email').value.trim();
    const emailField = document.getElementById('f-email');
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal);
    if (!emailOk) {
      emailField.classList.add('has-error');
      document.getElementById('email').addEventListener('input', () => emailField.classList.remove('has-error'), { once: true });
      ok = false;
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
    email: document.getElementById('email').value,
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
  // Ripristina pulsante invio
  document.getElementById('btn-invia').disabled = false;
  document.getElementById('btn-label').textContent = 'Invia scheda';
  document.getElementById('spinner').style.display = 'none';
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
    email: document.getElementById('email').value || '—',
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
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  // ── Header block (navy) ──────────────────────────────────
  doc.setFillColor(11, 31, 74);
  doc.rect(0, 0, pageW, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('Scheda Appuntamento Assistenza CADICE', margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(232, 201, 122);
  doc.text('AUA — Agenti UnipolSai Associati  ·  Sistema AUA', margin, 22);
  doc.setTextColor(180, 180, 180);
  doc.text('Data di compilazione: ' + d.data, margin, 29);

  // ── Gold bar ─────────────────────────────────────────────
  doc.setFillColor(201, 168, 76);
  doc.rect(0, 36, pageW, 2.5, 'F');
  y = 50;

  // ── Section title ─────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(201, 168, 76);
  doc.text('RIEPILOGO DATI COMPILATI', margin, y);
  y += 7;

  // ── Table rows ────────────────────────────────────────────
  const rows = [
    ['Codice Agenzia', d.codice],
    ['Ragione Sociale', d.ragione],
    ['Agente', d.agente],
    ['Email', d.email],
    ['CADICE già utilizzato', d.cadice_usato],
    ...(d.cadice_usato === 'No' ? [['Notifiche rilevate', d.notifiche]] : []),
    ['Sezioni di interesse', d.sezioni],
    ['Tipo mandato', d.mandato],
    ...(d.mandato === 'Plurimandataria' ? [['Mandato VITA esterno', d.mandato_vita]] : []),
    ['Partecipante', d.partecipante],
    ...(d.partecipante === 'Collaboratore delegato' ? [['Collaboratore', d.collaboratore]] : []),
    ['Data di compilazione', d.data],
  ];

  const colKey = 65;
  const colVal = contentW - colKey;
  const rowH = 10;

  rows.forEach(([k, v], i) => {
    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(248, 249, 251);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.rect(margin, y - 5.5, contentW, rowH, 'F');

    // Key
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90, 98, 128);
    doc.text(k, margin + 3, y);

    // Value — wrap long text
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(11, 31, 74);
    const valLines = doc.splitTextToSize(v, colVal - 4);
    doc.text(valLines, margin + colKey, y);

    // Row separator
    doc.setDrawColor(238, 240, 245);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 4.5, margin + contentW, y + 4.5);

    y += valLines.length > 1 ? rowH + (valLines.length - 1) * 5 : rowH;
  });

  // ── Footer ────────────────────────────────────────────────
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(138, 145, 168);
  doc.text('AUA — Agenti UnipolSai Associati  ·  Via Stalingrado 57, 40128 Bologna  ·  info@auaonline.it', pageW / 2, y, { align: 'center' });

  // ── Border line above footer ──────────────────────────────
  doc.setDrawColor(214, 218, 232);
  doc.setLineWidth(0.4);
  doc.line(margin, y - 5, margin + contentW, y - 5);

  doc.save('Riepilogo_CADICE_' + d.agente.replace(/\s+/g, '_') + '.pdf');
}

// Set today's date as default value (editable)
function todayIT() {
  return new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
document.getElementById('data-firma').value = todayIT();
updateProgress();
// ── CALENDLY ──────────────────────────────────────────────
function initCalendly() {
  const nome = document.getElementById('nome').value.trim();
  const email = document.getElementById('email').value.trim();
  const url = 'https://calendly.com/assistenza_agenzie-auaonline/cadice-meeting-30-minuti' +
    '?hide_gdpr_banner=1&primary_color=0b1f4a' +
    '&name=' + encodeURIComponent(nome) +
    '&email=' + encodeURIComponent(email);

  const container = document.getElementById('calendly-widget');
  container.innerHTML = '';
  Calendly.initInlineWidget({
    url: url,
    parentElement: container,
    prefill: { name: nome, email: email }
  });
}

// Listen for Calendly event_scheduled → unlock Avanti button
window.addEventListener('message', function(e) {
  if (e.data && e.data.event && e.data.event === 'calendly.event_scheduled') {
    const btn = document.getElementById('btn-avanti-5');
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.title = '';
      btn.textContent = 'Avanti →';
    }
  }
});
