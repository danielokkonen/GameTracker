# Game Tracker

## Table of contents

- [Introduction](#introduction)
- [Features](#features)
- [Built with](#built-with)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Data Layer](#data-layer)
- [Key Details](#key-details)

## Introduction

Personal tool to keep track of my backlog of games, with the ability to mark when games are started and completed.

Integrated with IGDB (Internet Game Database) to fetch additional details about games such as thumbnails, descriptions, genres etc.

## Features

- Track your game backlog with start/completed status
- Dashboard with play statistics
- Fetch game details and artwork from IGDB
- Import games from CSV or Steam library
- Filter, sort, and batch operations
- Dark mode, IGDB API, and Steam API settings

## Built with

- Electron
- Electron Forge
- React
- TypeScript
- SQLite
- MUI

## Screenshots

![image](https://github.com/user-attachments/assets/d738fb4c-7a81-4c7a-af73-d9076e73f081)
![image](https://github.com/user-attachments/assets/d659f9e6-53ef-424f-8bd5-e27ee721f1b8)

## Architecture

GameTracker is an Electron desktop application with a three-process architecture:

- **Main process** (`src/main.ts`) — Creates the BrowserWindow, registers all IPC handlers, and instantiates the backend services (game, igdb, steam, settings). 
- **Preload script** (`src/preload.ts`) — Bridges the main process to the renderer via contextBridge, exposing `electronApi`, `gameService`, `igdbService`, `steamService`, and `settingsService` to the browser context.
- **Renderer** (`src/renderer.tsx` → `App.tsx`) — React UI rendered with MUI components, react-router-dom (hash-based routing), and React contexts for state management (GamesContext, SettingsContext, SnackbarContext). 

## Data Layer

- **Database**: SQLite via `node:sqlite`, persisted in `GameTracker.db`
- **Services**: `game-service.ts`, `igdb-service.ts`, `steam-service.ts`, `settings-service.ts` handle all data operations
- **IPC**: Uses `send`/`on` with typed channel names from `src/client/constants/channels.ts`. Replies follow the `<channel>-success` pattern

## Key Details

- **Form handling**: Formik with Yup schema validation (create game form, settings form)
- **Date handling**: Day.js
- **Routing**: react-router-dom with hash-based routes
- **State management**: React contexts with provider components in `src/client/context/` and `src/client/components/*/`
- **Packaging**: ASAR archive with Electron Fuses
- **Build**: Three Vite configs (`vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`) orchestrated by Electron Forge
