# Security Notes — Skipped Dependencies & Vulnerabilities

This document keeps a record of security vulnerabilities that were identified during development but intentionally deferred/skipped, along with the reasoning and plans for resolution.

---

## 1. Backend: Transitive Vulnerabilities in `firebase-admin`
- **Dependency**: `firebase-admin` (transitive dependencies)
- **Vulnerabilities**: 10 moderate-severity vulnerabilities related to the `uuid` package dependency.
- **Why Skipped**: These are nested transitive dependencies within the official Google `firebase-admin` SDK. Resolving them would require manually overriding deep packages or breaking compatibility with the current Firebase SDK versions. These dependencies do not expose vulnerable code pathways in our backend execution environment.
- **Resolution Plan**: Revisit and upgrade during the next scheduled core dependency update, or when Google releases a minor/major update to `firebase-admin` that bumps its internal helper packages.

## 2. Frontend: Vulnerabilities in `esbuild` / `vite`
- **Dependency**: `esbuild` / `vite`
- **Vulnerabilities**: 2 moderate-severity vulnerabilities related to local development/build tools.
- **Why Skipped**: These vulnerabilities only affect the local builder toolchain and dev-server environment (`esbuild`/`vite`), not the compiled static client bundle deployed on Firebase Hosting. A full resolution requires a major upgrade of Vite which introduces breaking changes in the frontend configuration.
- **Resolution Plan**: Revisit when upgrading Vite to the next major version during the next cycle of frontend feature releases.
