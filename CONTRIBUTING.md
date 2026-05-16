# Glass Map Configuration Management & Contribution Guide

Welcome to the Glass Map Protocol sandbox. This document establishes the configuration management practices, branching standards, and engineering workflows required to maintain the stability and semantic integrity of the control room architecture.

---

## 1. Repository Branching Strategy

We enforce a strict multi-tier Git branching framework to isolate unstable experimental features from production environments.

* **`main` (Production & Deployment Layer):** * Represents the stable, verified, production-ready build.
    * Direct commits are strictly prohibited. 
    * This branch is directly linked to the live production server at `glassmap.org`.
* **`develop` (Integration Layer):**
    * Serves as the primary baseline for development and integration.
    * All feature branches must cut off from and merge back into `develop`.
* **`feature/*` (Tactical Sandbox Layer):**
    * Short-lived branches dedicated to isolated tasks (e.g., `feature/activate-layer-toggles`).
    * Created locally from `develop` and integrated exclusively via verified Pull Requests.

---

## 2. Standard Local Workflow

When executing modifications, developers must adhere to the following sequence to prevent merge conflicts:

1.  **Sync the Integration Layer:**
    ```bash
    git checkout develop
    git pull origin develop
    ```
2.  **Isolate the Feature:**
    ```bash
    git checkout -b feature/your-feature-name
    ```
3.  **Local Development & Testing:**
    * Run iterations locally utilizing the native Python loop: `python3 -m http.server 8000`
    * Verify layout transformations at `http://localhost:8000/` prior to staging.
4.  **Stage and Commit:**
    ```bash
    git add .
    git commit -m "prefix: description of changes"
    ```
5.  **Push to Remote Sandbox:**
    ```bash
    git push -u origin feature/your-feature-name
    ```

---

## 3. Commit Message Syntax Standards

To maintain a clean, scannable release audit log, we follow structured semantic commit guidelines:

* `feat:` Changes that introduce new functionality to the UI or data engine (e.g., `feat: integrate auto-bounding box math`).
* `fix:` Bug resolutions, syntax repairs, or hotfixes (e.g., `fix: resolve namespace lookup undefined error`).
* `docs:` Modifications to documentation assets, schemas, or markdown files (e.g., `docs: create contributing matrix`).
* `style:` Formatting, indentation, or aesthetic CSS corrections that do not alter execution logic.

---

## 4. Release Promotion Protocol

To deploy features to the live production environment at `glassmap.org`:
1. Open a Pull Request (PR) on GitHub from `feature/*` into `develop`.
2. Once integration validation succeeds, merge the PR into `develop`.
3. For official production releases, initiate a Pull Request from `develop` into `main`. Merging into `main` automatically updates the live infrastructure over secure HTTPS.