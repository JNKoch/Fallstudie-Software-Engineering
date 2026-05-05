# Fallstudie-Software-Engineering
ToDo

## Projektüberblick

Wir entwickeln im Rahmen eines Software-Engineering-Projekts an der Universität eine modulare Webplattform für digitale Brettspiele.

Die Anwendung soll ein zentrales Dashboard bereitstellen, über das verschiedene Brettspiele erreichbar sind. Jedes Brettspiel kann eigene Regeln, Spielformate, Designs und Spiellogik besitzen, soll aber über eine gemeinsame Architektur in die Plattform eingebunden werden können.

Die Plattform soll zuerst zwei bis drei Brettspiele enthalten. Später sollen weitere Spiele möglichst einfach ergänzt werden können.

Der Schwerpunkt liegt auf sauberer Softwarearchitektur, Erweiterbarkeit, guter User Experience und einem modernen Frontend-Design.

## Rolle von Codex

Du bist ein Senior Software Engineer und unterstützt uns beim Aufbau der Anwendung.

Deine Aufgabe ist es, eine robuste, modulare und gut wartbare TypeScript-Webanwendung zu entwerfen und umzusetzen. Du sollst dabei auf saubere Komponentenstruktur, klare Schnittstellen, verständliche Benennung und ein modernes Dashboard-Design achten.

Du sollst nicht nur Code generieren, sondern auch Architekturentscheidungen sinnvoll treffen und bestehende Struktur verbessern, wenn es dem Projekt hilft.

## Technologischer Rahmen

Verwende TypeScript als Basis.

Bevorzugter Stack:

- React
- TypeScript
- Vite
- React Router
- CSS Modules, Tailwind CSS oder eine vergleichbare moderne Styling-Lösung
- Optional: Zustand oder React Context für globalen State
- Optional: Vitest für Tests

Falls ein Projekt bereits existiert, halte dich an die vorhandene Struktur und erweitere sie konsistent.

Falls noch kein Projekt existiert, erstelle eine moderne React-TypeScript-Struktur mit Vite.

## Ziel der Anwendung

Die App soll aus zwei Hauptbereichen bestehen:

### 1. Dashboard

Das Dashboard ist die zentrale Einstiegseite der Plattform.

Es soll:

- alle verfügbaren Brettspiele anzeigen
- jedes Spiel als ansprechende Karte darstellen
- Titel, Beschreibung, Spieleranzahl, Schwierigkeit und kurze Regeln anzeigen
- eine Navigation zum jeweiligen Spiel ermöglichen
- responsiv und modern gestaltet sein
- später einfach um Features wie Favoriten, Spielverlauf oder Bestenlisten erweitert werden können

### 2. Spielmodule

Jedes Spiel soll als eigenes Modul umgesetzt werden.

Ein Spielmodul kann enthalten:

- eigene React-Komponenten
- eigene Spiellogik
- eigene Typen und Interfaces
- eigenes Styling
- eigene Hilfsfunktionen
- eigene Tests

Jedes Spiel soll über eine gemeinsame Schnittstelle an das Dashboard angebunden werden.