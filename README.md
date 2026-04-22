# Companion Crafter

Companion Crafter is a web-based D&D 5e character builder and interactive character sheet built with React, TypeScript, and Vite. The project turns a traditionally dense tabletop workflow into a guided product experience: users create characters step by step, see how choices affect the build in real time, and continue managing the finished character in a structured sheet UI.

At its core, the project is about translating a rules-heavy system into a responsive, approachable frontend without losing the depth of the source material.

## Why This Project Stands Out

- Built an interactive multi-step character creation flow instead of a static form dump
- Designed a responsive sheet experience for both creation and long-term character management
- Translated rules-heavy tabletop logic into user-friendly UI decisions and validations
- Normalized complex game data such as inventory, attacks, proficiencies, features, currencies, and spell access
- Implemented data-driven behavior where class, race, background, level, and inventory all affect downstream UI and derived stats
- Prepared the app for public deployment with Vercel-ready configuration

## Core Features

### Guided Character Builder

- Page-by-page creation flow for race, class, background, ability scores, spells, details, and review
- Live build feedback showing how character choices affect stats, proficiencies, traits, languages, and future progression
- Support for standard array, point buy, and rolled ability scores
- Auto-assignment helpers for ability scores based on class and racial priorities
- Bonus language and feature choice handling during creation

### Interactive Character Sheet

- Main menu with character list and character entry flow
- Read-only and edit modes for the finished character sheet
- Structured sections for combat, inventory, features, backstory, proficiencies, and languages
- Milestone leveling model instead of raw XP entry
- Spell tab gated by class and level requirements

### Inventory, Combat, and Rules Logic

- Searchable item catalog with support for both catalog-based items and custom entries
- Normalized inventory items with type-aware handling for weapons, armor, gear, tools, consumables, and treasure
- Auto-generated attacks from weapon inventory items
- Currency extraction from text-based starter equipment into dedicated currency fields
- Parsing and cleanup of starter gear like quantity-based items such as `2 daggers`

### UX and Layout Work

- Refined the app toward a more spacious, layered layout instead of a cramped dashboard feel
- Built responsive layouts that adapt between wider “overview” presentations and tighter sheet views
- Reworked selection interfaces for clearer state feedback, including button-based choice systems and disabled states

## Technical Highlights

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Custom component styling with Tailwind-driven utility usage and shared UI classes
- **State Management:** Local React state with rules-driven derivation utilities
- **Domain Modeling:** Custom TypeScript types for characters, attacks, spells, inventory, currencies, and wizard state
- **Data Layer:** Structured SRD-inspired datasets for races, classes, spells, backgrounds, and items
- **Build & Deploy:** Production build via Vite, ready for Vercel deployment

## Engineering Challenges Solved

### Translating Rule Systems into UI

Character choices are not isolated inputs; they cascade into stats, languages, proficiencies, inventory, spell access, attack options, and derived values. Building the app meant turning that interconnected logic into predictable, maintainable utility functions and clear UI flows.

### Normalizing Messy Character Data

Starter equipment, proficiencies, and features often arrive in human-readable text rather than structured records. Companion Crafter includes normalization logic to split and categorize these values into usable application data, making the sheet editable and rules-aware instead of text-heavy and fragile.

### Product-Focused Iteration

The interface went through multiple layout and interaction revisions to improve readability, reduce clutter, and better match how users actually build characters. A large part of the work in this project was not just implementing features, but refining how they feel to use.
