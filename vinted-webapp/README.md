# Vinted Listing Assistant — Handy-App

Fotos von einem Kleidungsstück auswählen, und die App schreibt automatisch
einen Titel und eine Beschreibung für Vinted. Die Texte werden kopiert und
in der Vinted-App eingefügt — fertig.

**Wichtig zu wissen:** Es muss nichts von GitHub aufs Handy heruntergeladen
werden. Die App wird einmal ins Internet gestellt (Schritt 1, macht der
Entwickler am Computer) und danach einfach wie eine Internetseite geöffnet.

---

## Schritt 1: Die App online stellen (einmalig, am Computer)

Am einfachsten mit **GitHub Pages** — kostenlos, direkt aus diesem Repository:

1. Das Repository auf GitHub öffnen → **Settings** → links **Pages**
2. Bei „Source“ **Deploy from a branch** wählen
3. Branch **main** und Ordner **/ (root)** auswählen → **Save**
4. Nach 1–2 Minuten ist die App erreichbar unter:
   `https://DEIN-USERNAME.github.io/REPO-NAME/vinted-webapp/`

Hinweis: Bei einem kostenlosen GitHub-Account funktioniert Pages nur, wenn das
Repository **öffentlich** ist. Das ist hier unbedenklich — im Code stecken keine
Passwörter oder API-Keys (die liegen nur auf dem jeweiligen Gerät). Wer das
Repository lieber privat lassen will, kann den Ordner `vinted-webapp/`
stattdessen kostenlos bei [Netlify](https://app.netlify.com/drop) hochziehen.

---

## Schritt 2: Die App aufs Handy bringen (einmalig, ca. 5 Minuten)

Am besten macht ihr das einmal gemeinsam:

1. **Link aufs Handy schicken** — die Adresse aus Schritt 1 z. B. per
   WhatsApp an das Handy senden und dort antippen. Die App öffnet sich
   im Browser.

2. **Als App auf den Startbildschirm legen** (damit sie wie eine normale
   App aussieht und mit einem Tipp startet):
   - **iPhone:** Der Link muss in **Safari** geöffnet sein. Unten in der
     Mitte das **Teilen-Symbol** (Viereck mit Pfeil nach oben) antippen →
     nach unten wischen → **„Zum Home-Bildschirm“** → **Hinzufügen**
   - **Android:** In **Chrome** oben rechts das **Drei-Punkte-Menü ⋮**
     antippen → **„App installieren“** (oder „Zum Startbildschirm
     hinzufügen“) → bestätigen

3. **Einmal den Schlüssel eintragen** (macht der Entwickler): In der App
   oben rechts auf **⚙️** tippen, den OpenAI API-Key einfügen und auf
   **Speichern** tippen. Der Schlüssel bleibt dauerhaft auf dem Handy
   gespeichert — dieser Schritt ist nur einmal nötig.

Fertig! Ab jetzt startet die App direkt vom Startbildschirm.

---

## So wird die App benutzt

1. Auf dem Startbildschirm das **türkise V** antippen
2. **„📷 Fotos auswählen“** antippen und 5–6 Fotos des Kleidungsstücks
   aus der Galerie auswählen (oder direkt neue machen)
3. **„✨ Titel & Beschreibung generieren“** antippen und einen Moment warten
4. Beim Titel auf **„📋 Kopieren“** tippen → in die **Vinted-App** wechseln →
   beim Erstellen der Anzeige in das Titel-Feld tippen, **Finger gedrückt
   halten** und **„Einfügen“** wählen
5. Zurück in die Assistent-App, bei der Beschreibung auf **„📋 Kopieren“**
   tippen → in Vinted genauso in das Beschreibungs-Feld einfügen

Die Texte bleiben gespeichert — man kann also beliebig zwischen den beiden
Apps hin- und herwechseln, ohne dass etwas verloren geht. Vor dem Kopieren
kann man die Texte auch noch direkt in den Feldern anpassen.

## Wenn etwas nicht klappt

| Problem | Lösung |
|---|---|
| Rote Fehlermeldung mit „insufficient_quota“ | Das OpenAI-Guthaben ist leer — der Entwickler muss auf [platform.openai.com](https://platform.openai.com/settings/organization/billing/overview) neues Guthaben aufladen |
| „Bitte zuerst deinen OpenAI API-Key hinterlegen“ | Schritt 2, Punkt 3 wiederholen (⚙️ → Key eintragen) |
| Kopieren-Knopf reagiert nicht | Text im Feld gedrückt halten → „Alles auswählen“ → „Kopieren“ |
| App-Symbol versehentlich gelöscht | Kein Problem — Link erneut im Browser öffnen und wieder zum Startbildschirm hinzufügen; alle Einstellungen sind noch da |

---

## Technische Details (für Entwickler)

- Rein statische Web-App (HTML/CSS/JS), kein Build, kein Server; als PWA
  installierbar (`manifest.webmanifest` + `sw.js`, der Service Worker cached
  nur die App-Shell)
- API-Key und Modell liegen in `localStorage`, Standard-Modell `gpt-5.6-luna`
  (im ⚙️-Menü per Auswahlliste änderbar, Kosten-Übersicht in
  `../vinted-extension/README.md`); Bilder werden clientseitig auf max.
  1536 px verkleinert und mit `detail: "high"` gesendet, damit die KI
  Etiketten lesen kann — Kosten pro Anzeige je nach Modell ~0,8 bis ~3 Cent
- Lokaler Schnelltest: `python3 -m http.server 8080` in diesem Ordner, dann
  am Handy `http://<IP-des-Rechners>:8080` öffnen (gleiches WLAN); ohne HTTPS
  greift beim Kopieren automatisch ein Fallback
- Kein automatisches Eintragen in die Vinted-App möglich (native App) —
  deshalb die Kopieren-Buttons; das Auto-Ausfüllen gibt es nur in der
  Desktop-Variante (`../vinted-extension/`)
