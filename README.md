# Scheda Appuntamento CADICE — AUA Soluzioni

Form digitale multi-step per la preparazione all'appuntamento di assistenza sulla piattaforma **CADICE**, sviluppato per **AUA — Agenti UnipolSai Associati**.

## Struttura del progetto

```
cadice-project/
├── index.html          # Pagina principale (form multi-step)
├── style.css           # Stili e layout
├── app.js              # Logica del form (navigazione, validazione, PDF)
├── assets/
│   ├── logo-aua.png    # Logo Sistema AUA (sfondo trasparente)
│   └── Cadice_Vademecum_Pre-Appuntamento.pdf
└── README.md
```

## Funzionalità

- **4 sezioni step-by-step** con barra di avanzamento
- Scaricamento del **Vademecum PDF** integrato
- Selezione sezioni CADICE con **auto-flag delle sotto-voci**
- Logica condizionale (mandato VITA, collaboratore delegato)
- **Riepilogo finale** con download del riepilogo in HTML/PDF
- Invio dati a **Google Sheet** via Google Apps Script

## Collegamento a Google Sheet

1. Crea un Google Sheet con le colonne:
   `Timestamp | Codice | Ragione Sociale | Agente | CADICE usato | Notifiche | Sezioni | Mandato | Mandato VITA | Partecipante | Collaboratore | Data`

2. Vai su **Estensioni → Apps Script** e incolla:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp, data.codice, data.ragione, data.agente,
    data.cadice_usato, data.notifiche, data.sezioni, data.mandato,
    data.mandato_vita, data.partecipante, data.collaboratore, data.data
  ]);
  return ContentService.createTextOutput('ok');
}
```

3. **Distribuisci** come App Web (accesso: Chiunque) e copia l'URL

4. In `app.js`, sostituisci:
```javascript
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```
con il tuo URL.

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub
2. Carica tutti i file mantenendo la struttura delle cartelle
3. Vai su **Settings → Pages → Branch: main → / (root)**
4. Il sito sarà disponibile su `https://tuonome.github.io/nome-repo/`

## Versione

**ver. 2.1** — AUA Soluzioni SRL
