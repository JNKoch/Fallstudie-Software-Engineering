# Fallstudie-Software-Engineering

## Projektüberblick

Dieses Repository enthält eine Fallstudie für ein Software-Engineering-Projekt an der Universität. Ziel ist der Aufbau einer modularen Webplattform für digitale Brettspiele.

Die Anwendung soll ein zentrales Dashboard bereitstellen, über das verschiedene Brettspiele erreichbar sind. Jedes Brettspiel soll eigene Regeln, Spielformate, Designs und Spiellogik besitzen können, aber über eine gemeinsame Architektur in die Plattform eingebunden werden.

Der Schwerpunkt liegt auf sauberer Softwarearchitektur, Erweiterbarkeit, guter User Experience und einem modernen Frontend.

## Ziel der Anwendung

Die Plattform soll zunächst zwei bis drei digitale Brettspiele enthalten. Später sollen weitere Spiele möglichst einfach ergänzt werden können, ohne das Dashboard oder bestehende Spielmodule stark verändern zu müssen.

Die Anwendung besteht aus zwei Hauptbereichen:

1. Dashboard
   - zeigt alle verfügbaren Brettspiele
   - stellt jedes Spiel als Karte dar
   - enthält Titel, Beschreibung, Spieleranzahl, Schwierigkeit und kurze Regeln
   - ermöglicht die Navigation zum jeweiligen Spiel
   - ist responsiv und modern gestaltet

2. Spielmodule
   - jedes Spiel wird als eigenes Modul umgesetzt
   - jedes Modul kann eigene Komponenten, Spiellogik, Typen, Styles, Hilfsfunktionen und Tests enthalten
   - jedes Spiel wird über eine gemeinsame Schnittstelle an das Dashboard angebunden

## Technologischer Rahmen

Die Anwendung soll als moderne TypeScript-Webanwendung umgesetzt werden.

Geplanter Stack:

- React
- TypeScript
- Vite
- React Router
- CSS Modules, Tailwind CSS oder eine vergleichbare Styling-Lösung
- Optional: Zustand oder React Context für globalen State
- Optional: Vitest für Tests

Falls noch kein Projektgerüst existiert, soll eine React-TypeScript-Struktur mit Vite erstellt werden. Falls später bereits eine Struktur vorhanden ist, soll diese konsistent erweitert werden.

## Architekturidee

Die Plattform soll modular aufgebaut sein. Das Dashboard kennt nur die Metadaten und den Einstiegspunkt eines Spiels, nicht aber dessen interne Spiellogik.

Geplante Modulstruktur:

```text
src/
  app/
  components/
  games/
    gameRegistry.ts
    types.ts
    <game-name>/
      components/
      logic/
      styles/
      tests/
      index.ts
  pages/
  styles/
```

Jedes Spiel soll eine gemeinsame Schnittstelle erfüllen, damit neue Spiele einfach registriert und im Dashboard angezeigt werden können.

## Aktueller Status

Das Repository befindet sich aktuell in der Planungs- und Dokumentationsphase. Ein React/Vite-Projektgerüst wurde noch nicht erstellt.

Vor der Implementierung sollten folgende Punkte geklärt oder umgesetzt werden:

- Projektgerüst mit React, TypeScript und Vite erstellen
- Routing für Dashboard und Spielseiten einrichten
- Styling-Ansatz festlegen
- gemeinsame Schnittstelle für Spielmodule definieren
- erstes Spielmodul als Referenzimplementierung bauen
- Tests und Build-Befehle dokumentieren

## Rolle von Codex

Codex unterstützt als Senior Software Engineer beim Entwurf und Aufbau der Anwendung. Wichtige Aufgaben sind:

- Architekturentscheidungen nachvollziehbar treffen
- wartbare TypeScript- und React-Strukturen erstellen
- klare Schnittstellen für Spielmodule definieren
- bestehende Struktur verbessern, wenn es dem Projekt hilft
- Dokumentation, Tests und Verifikation aktuell halten

## Nächste Schritte

1. React-TypeScript-Projekt mit Vite scaffolden.
2. React Router und Grundlayout einrichten.
3. Dashboard-Seite erstellen.
4. `BoardGameModule`-Schnittstelle und Game Registry definieren.
5. Erstes Spielmodul implementieren.
6. Weitere Spiele hinzufügen.
7. Build, Tests und Nutzung in dieser README dokumentieren.

## Verifikation

Solange noch kein Projektgerüst existiert, beschränkt sich die Verifikation auf Dokumentationsprüfung und Git-Status.

Nach dem Scaffolden sollen mindestens folgende Befehle dokumentiert und regelmäßig ausgeführt werden:

```bash
npm install
npm run dev
npm run build
npm test
```
