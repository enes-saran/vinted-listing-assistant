# Vinted Listing Assistant (Chrome Extension)

Erstellt aus Fotos eines Kleidungsstücks automatisch einen Vinted-Titel und eine
Beschreibung (via OpenAI-API, standardmäßig `gpt-5.4-mini`) und trägt beides direkt
ins Vinted-Verkaufsformular ein.

> **Nur für den Desktop:** Chrome auf dem Handy unterstützt keine Extensions.
> Für iPhone/Android gibt es die Web-App-Variante in
> [`../vinted-webapp/`](../vinted-webapp/README.md) mit Kopieren-Buttons
> für die Vinted-App.

## Installation (Entwicklermodus)

1. Chrome öffnen → `chrome://extensions` aufrufen
2. Oben rechts **Entwicklermodus** aktivieren
3. **Entpackte Erweiterung laden** klicken und diesen Ordner (`vinted-extension/`) auswählen

Nach Code-Änderungen die Extension auf `chrome://extensions` über das ↻-Symbol neu laden.

## OpenAI-API einrichten

Wichtig: Es gibt **kein Abo**. Die API ist unabhängig von ChatGPT Plus — du lädst
einmalig Prepaid-Guthaben auf und zahlst pro Anfrage.

1. **Konto erstellen:** Auf <https://platform.openai.com/> registrieren
   (E-Mail oder Google/Microsoft-Login). Ein bestehender ChatGPT-Account
   funktioniert auch — die Abrechnung ist aber getrennt.
2. **Guthaben aufladen:** **Settings → Billing**
   (<https://platform.openai.com/settings/organization/billing/overview>)
   → **Add payment details** → **Add credit**. Mindestbetrag $5 — das reicht
   für über tausend Anzeigen. Tipp: „Auto-recharge“ ausgeschaltet lassen.
3. **API-Key erstellen:** <https://platform.openai.com/api-keys>
   → **Create new secret key** → Key (`sk-...`) **sofort kopieren**,
   er wird nur einmal angezeigt. Wie ein Passwort behandeln!
4. **Key in die Extension eintragen:** Extension-Icon anklicken → ⚙️
   → Key einfügen → **Speichern**. Der Key wird ausschließlich lokal
   in `chrome.storage.local` gespeichert.

## Modellwahl

Im ⚙️-Menü lässt sich das KI-Modell per Auswahlliste wechseln. Die Bilder
werden mit `detail: "high"` gesendet, damit die KI Etiketten lesen kann
(Größe, Material, Herstellungsland) — das macht den Großteil der Kosten aus.
Grobe Schätzung pro Anzeige bei 5–6 Fotos (~7.000 Input-, ~600 Output-Tokens):

| Modell | Preis pro 1M Tokens (Input/Output) | Kosten pro Anzeige |
|---|---|---|
| `gpt-5.6-luna` (Standard) | $1.00 / $6.00 | ~1 Cent |
| `gpt-5.4` | $2.50 / $15.00 | ~3 Cent |
| `gpt-5.4-mini` | $0.75 / $4.50 | ~0,8 Cent |

Selbst mit dem größten Modell erstellt man für $5 Guthaben also noch weit
über hundert Anzeigen.

Hinweis: Die Top-Modelle `gpt-5.6-terra` und `gpt-5.6-sol` verlangen eine
verifizierte OpenAI-Organisation („Your organization must be verified …“) und
stehen deshalb nicht in der Auswahlliste. Wer die Verifizierung auf
[platform.openai.com](https://platform.openai.com/settings/organization/general)
durchgeführt hat, kann sie in `popup.html` / `index.html` als weitere
`<option>` ergänzen.

## Benutzung

1. Auf Vinted die Seite **„Verkaufen“** öffnen und die Fotos wie gewohnt hochladen
2. Extension-Popup öffnen und dieselben 5–6 Fotos auswählen (oder per Drag & Drop)
3. **„Titel & Beschreibung generieren“** klicken — die KI analysiert die Bilder
4. Text bei Bedarf anpassen, dann **„In Vinted eintragen“** klicken —
   Titel und Beschreibung werden automatisch ins Formular übernommen

## Hinweise

- **Kosten:** Die Bilder werden vor dem API-Aufruf clientseitig auf max. 1024 px
  verkleinert und mit `detail: "low"` gesendet — eine Anzeige kostet deutlich
  unter einem halben Cent.
- Das letzte Ergebnis bleibt im Popup erhalten, auch wenn es zwischendurch
  geschlossen wird.
- Fehlermeldung `insufficient_quota` beim Generieren bedeutet: kein Guthaben
  mehr — siehe „Guthaben aufladen“ oben.
- Vinted bietet keine öffentliche API — das Eintragen passiert deshalb per
  Content Script direkt im Formular. Falls Vinted die Feldnamen ändert, müssen
  ggf. die Selektoren in `content.js` (`TITLE_SELECTORS` / `DESCRIPTION_SELECTORS`)
  angepasst werden.
