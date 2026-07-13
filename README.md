# Vinted Listing Assistant

Spart Zeit beim Erstellen von Vinted-Anzeigen: Fotos eines Kleidungsstücks hochladen,
eine KI (OpenAI, standardmäßig `gpt-5.4-mini`) erstellt automatisch einen passenden
Titel und eine Beschreibung auf Deutsch.

Da Vinted keine öffentliche API anbietet, gibt es zwei Varianten für die beiden
Einsatzorte:

| | [`vinted-extension/`](vinted-extension/) | [`vinted-webapp/`](vinted-webapp/) |
|---|---|---|
| **Gerät** | Desktop (Chrome) | Handy & Desktop (jeder Browser) |
| **Übernahme in Vinted** | Automatisch ins Verkaufsformular | Kopieren-Buttons → in der Vinted-App einfügen |
| **Installation** | Entpackte Chrome Extension | Statisch hosten (z. B. Netlify/GitHub Pages), optional als PWA zum Home-Bildschirm |

Beide Varianten nutzen dieselbe Logik (Bildverkleinerung auf 1024 px, gleicher
Prompt, gleiche API) — Details und Einrichtungsanleitungen (inkl. OpenAI-Konto
und Guthaben) stehen in den READMEs der jeweiligen Ordner.

## Schnellstart

1. OpenAI-Konto + Guthaben + API-Key einrichten
   → Anleitung in [`vinted-extension/README.md`](vinted-extension/README.md)
2. **Desktop:** Extension laden (`chrome://extensions` → Entwicklermodus →
   „Entpackte Erweiterung laden“ → `vinted-extension/`)
3. **Handy:** `vinted-webapp/` hosten und die URL am Handy öffnen
   → Anleitung in [`vinted-webapp/README.md`](vinted-webapp/README.md)
4. In beiden Varianten: ⚙️ → API-Key eintragen → Fotos hochladen → generieren
