# TOMORROWWORKS · Digital Studio — Website

Statische Website für TOMORROWWORKS — Websites, individuelle Web-Apps, KI-Einstieg und ergänzende Printleistungen für Unternehmen. TOMORROWWORKS ist das Digital Studio der Gärtner GmbH Karosserie + Lack in Mosbach.

## Aufbau

| Datei/Ordner | Inhalt |
|---|---|
| `index.html` | Startseite mit Leistungen, Praxisbelegen, Team, FAQ und Projektanfrage |
| `websites.html`, `apps.html`, `ki-einstieg.html` | Leistungsseiten |
| `projekte.html` | Projekt- und Referenzübersicht |
| `preise.html` | Budgetorientierung und Angebotsablauf |
| `visitenkarten.html` | Lokaler Visitenkarten-Konfigurator mit Preisvorschau |
| `impressum.html` | Impressum |
| `datenschutz.html` | Datenschutzerklärung |
| `bilder/` | Bilder und optimierte Projektansichten |

## Eigenschaften

- Reines HTML/CSS/JS — **kein Build-Schritt und kein Tracking**.
- Läuft offline: `index.html` doppelklicken oder beliebigen statischen Server auf den Ordner zeigen.
- Responsiv (Mobil bis Desktop), `prefers-reduced-motion` wird respektiert.

## Kontaktformular

Die Projektanfrage auf der Startseite arbeitet im lokalen/GitHub-Pages-Stand bewusst ohne stillen Versand. Ohne konfigurierten Endpunkt bereitet sie eine strukturierte Anfrage für E-Mail oder WhatsApp vor und sagt ausdrücklich, dass noch nichts versendet wurde.

Für einen optionalen serverseitigen Versand in `index.html` am Formularattribut `data-endpoint` einen HTTPS-Endpunkt eintragen. Der Endpunkt muss JSON-POSTs annehmen und mit einem erfolgreichen HTTP-Status antworten. Vor Aktivierung Datenschutzerklärung, Auftragsverarbeitung, Spam-Schutz und Ziel-Mailbox prüfen.

Die eingerichtete Markenadresse für Website-Anfragen ist `info@tomorrowworks-agentur.de`.

## Deployment

Die Website wird über GitHub Pages unter `https://www.tomorrowworks-agentur.de` veröffentlicht. Der Ordnerinhalt wird ohne Build-Schritt bereitgestellt.

## Status

Domain und Marken-Mailbox sind eingerichtet. Das Kontaktformular nutzt transparent E-Mail oder WhatsApp; ein direkter Serverversand ist derzeit nicht aktiviert. Impressum und Datenschutz sollten bei inhaltlichen oder technischen Änderungen erneut juristisch geprüft werden.
