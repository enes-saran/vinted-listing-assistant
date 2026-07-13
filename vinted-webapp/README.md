# Vinted Listing Assistant (Web-App / PWA)

Die Mobil-Variante des Vinted Listing Assistant: Fotos eines Kleidungsstücks hochladen,
Titel + Beschreibung werden per OpenAI-API generiert, dann per **Kopieren-Button**
in die Vinted-App übernehmen. Funktioniert auf iPhone, Android und Desktop —
im Gegensatz zur Chrome Extension (siehe `../vinted-extension/`), die nur am
Desktop läuft, dort aber automatisch ins Formular einträgt.

## Hosting

Die App ist rein statisch (HTML/CSS/JS, kein Server nötig). Zwei Wege:

**Empfohlen — kostenlos hosten (HTTPS):**
Den Ordner `vinted-webapp/` z. B. auf [Netlify Drop](https://app.netlify.com/drop)
ziehen oder über GitHub Pages veröffentlichen. HTTPS ist wichtig, damit die
Kopieren-Buttons und die „Zum Home-Bildschirm hinzufügen“-Funktion (PWA)
zuverlässig funktionieren.

**Schnelltest im lokalen Netz:**

```bash
cd vinted-webapp
python3 -m http.server 8080
```

Dann am Handy `http://<IP-des-Rechners>:8080` öffnen (gleiches WLAN).
Hinweis: Ohne HTTPS greift beim Kopieren ein Fallback — funktioniert, ist
aber nur zum Testen gedacht.

## Einrichtung auf dem Handy

1. Die gehostete URL im Browser öffnen
2. ⚙️ → OpenAI API-Key eintragen → **Speichern**
   (Key und Modell werden nur lokal auf dem Gerät gespeichert;
   API-Einrichtung siehe `../vinted-extension/README.md`)
3. Optional: über das Browser-Menü **„Zum Home-Bildschirm hinzufügen“** —
   die App startet dann wie eine normale App im Vollbild

## Benutzung

1. App öffnen → 📷 **Fotos auswählen** (5–6 Stück, direkt aus der Galerie oder Kamera)
2. **„Titel & Beschreibung generieren“** tippen
3. Texte bei Bedarf anpassen, dann **📋 Kopieren** (erst Titel, dann Beschreibung)
4. In der Vinted-App die Anzeige erstellen und die Texte einfügen

Das letzte Ergebnis bleibt gespeichert — man kann also zwischen dieser App
und der Vinted-App hin- und herwechseln, ohne dass etwas verloren geht.

## Technische Hinweise

- Modell voreingestellt: `gpt-5.4-mini` (im ⚙️-Menü änderbar)
- Bilder werden vor dem API-Aufruf auf max. 1024 px verkleinert und mit
  `detail: "low"` gesendet — Kosten pro Anzeige: deutlich unter einem halben Cent
- Der Service Worker (`sw.js`) cached nur die App-Oberfläche (für Installierbarkeit
  und Offline-Start); API-Aufrufe gehen immer direkt ins Netz
- Kein automatisches Eintragen möglich: In die native Vinted-App kann keine
  Web-Technologie hineinschreiben — deshalb der Weg über die Kopieren-Buttons
