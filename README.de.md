<p align="right"><a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ru.md">Русский</a> | <a href="README.pt.md">Português</a></p>

# DSH Skills- und MCP-Verwaltung

Ein DSH-Seitenleisten-Plugin zur Verwaltung lokaler Skills und MCP-Server. Die Oberfläche nutzt DSH-Theme-Tokens, bettet kein iframe ein und behält den Eintrag `Skills & MCP` bei.

Das globale `~/.agents/skills`-Verzeichnis gelangt nicht in den Modellkatalog. Nur ausdrücklich synchronisierte Skills werden zu DSH hinzugefügt.

![Skills-Verwaltung](docs/screenshots/overview.png)

## Funktionen

- Skills auf Benutzer- und Projektebene suchen, erstellen, bearbeiten, aktivieren, deaktivieren und löschen.
- Den globalen Agent-Skill-Bestand vor dem Modell verbergen und nur ausgewählte Skills synchronisieren.
- Symlink- und Kopiermodus, Anzeige des Synchronisierungsmodus, Vorschau und Sicherung vor dem Ersetzen.
- Mehrfachauswahl per Kontrollkästchen und Löschen in einem Schritt.
- `.zip`-Skill-Pakete per Drag & Drop oder Dateiauswahl importieren.
- MCP-Manager- und eigenständige MCP-Einträge in Formular oder JSON bearbeiten, Verbindung testen, neu verbinden, importieren und Host-Freigaben anfordern.
- Automatische Updates für npm-Installationen und GitHub-Release-Hinweise.

## Installation

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

Für eine Quellinstallation das Repository klonen, `npm install --ignore-scripts` ausführen und das Verzeichnis in DSH unter **Plugins → Plugin hinzufügen** auswählen. Die aktuelle Version ist für DSH `0.2.3-alpha.2` verifiziert.

## Sprachen

Die Oberfläche folgt **DSH-Einstellungen → Allgemein → Sprache** und unterstützt die acht Sprachen `zh`, `en`, `ja`, `es`, `fr`, `de`, `ru` und `pt`. Beim Sprachwechsel wird die Oberfläche automatisch aktualisiert.

Skill- und MCP-Listen werden nicht übersetzt. Namen, Beschreibungen, SKILL.md-Inhalte, Befehle und URLs bleiben in ihrer Originalsprache.

## Daten und Berechtigungen

Zugriff auf lokale Dateien in `~/.dsh/skills`, `~/.agents/skills`, `~/.dsh/capability-switch` und dem `cordis.patch.yml` des aktiven DSH-Profils. Netzwerkzugriff ist auf die npm-Registry (Auto-Update) und die GitHub-Releases-API (Release-Hinweise) beschränkt. Skills, MCP-Konfiguration und Anmeldedaten werden nicht hochgeladen.

## Dokumentation

Die vollständige Dokumentation steht auf [English](README.en.md) oder [中文](README.md) bereit.

## Lizenz

[MIT](LICENSE)
