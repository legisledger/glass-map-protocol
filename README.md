# Glass Map Protocol (GM-P)

An application protocol for localized geographic district schema standardization, data isolation, and spatial relationship modeling. The system parses structural localized configuration sets to map, scale, and render independent community clusters without centralized geospatial tracking dependencies.

The project has officially achieved **Initial Operational Capability (IOC)** as of May 2026.

---

## 🛰️ System Architecture & Framework

The architecture enables viewing micro districts, services, and infrastructure in a web browser using a 3 pane architecture: Pane 1 micro district selection (/data/micro/.yml), Pane 2 SVG Canvas Map based on creating 1789 standard maximum congressional districts balancing geographic distance and infrastructure alignment, and Pane 3 showing representative services for the given micro district. The SVG Canvas Map is generated from a core engine (ui/app.js), local data (/data/micro/.yml), and a spatial base (/data/micro/zip_registry.json).

```
                 [ Web Browser Viewport ]
                            │
      ┌─────────────────────┴─────────────────────┐
      ▼                                           ▼
┌──────────────┐                           ┌──────────────┐
│  Pane 2: SVG │                           │ Pane 3: YAML │
│  Canvas Map  │                           │ Service View │
└──────▲───────┘                           └──────▲───────┘
       │                                          │
       └───────────────┐   ┌──────────────────────┘
                       │   │
              [ Pure Processing Engines ]
              ┌─────────────────────────┐
              │  ui/app.js Core Engine  │
              └───────────▲─────────────┘
                         │
      ┌──────────────────┴──────────────────┐
      ▼                                     ▼
┌──────────────┐                      ┌──────────────┐
│ Local Metric │                      │ Spatial Base │
│ (.yml Files) │                      │ (.json Data) │
└──────────────┘                      └──────────────┘

```

### Core Architecture Components

* **Data Ingestion Engine (`loadProtocol`):** An asynchronous, non-blocking sequence that strips namespaces and fetches decoupled metrics, preventing main-thread interface freezing during network updates.
* **Spatial Relationship Engine (`GravityEngine`):** Executes algorithmic node cluster transformations based on programmatic baseline boundaries to map local data arrays into cohesive spatial ecosystems.
* **Visual Presentation Matrix (`renderGlassMap`):** A high-performance synchronous rendering pipeline that computes dynamic bounding boxes and layouts across data-isolated datasets, projecting relative coordinates natively into vector viewports (`SVG`).
* **State Preservation Layer (`AppState`):** A centralized client-side memory cache that enforces real-time state consistency across user interaction controls and display repaints.

---

## 🛠️ Data Standards & Schema Specifications

The protocol operates strictly on a dual-source data architecture. Individual districts isolate raw localized metadata, while a flat database registry maintains coordinate vectors.

### 1. Spatial Registry Schema (`zip_registry.json`)
Maintains structural geometric coordinates and infrastructure attributes in a global registry array:

```json
[
  {
    "id": [zip code],
    "name": [community name],
    "population": [population],
    "x": 10.0,
    "y": 10.0,
    "infrastructure": { 
      "aquifer": [aquifer name] 
    }
  }
]

```

### 2. Local District Schema (`.yml`)

Isolates administrative variables, definitions, and specific functional service descriptions from spatial mapping files:

```yaml
meta:
  protocol: "gm:micro:v1"
  district: [zip code]
services:
  - id: "srv-01"
    type: "environmental"
    label: "Aquifer Monitoring Matrix"

```

---

## 🎯 Initial Operational Capability (IOC) Milestone

The completion of the IOC milestone establishes a fully verified, production-stable baseline meeting the following exit criteria:

* **Immutable Pipeline Integrity:** Full architectural isolation of the master geographical registry during downstream rendering transformations, eliminating local memory contamination and point-stacking artifacts.

* **Deterministic Scaling Matrix:** Dynamic cluster calculations scale relative distance variations evenly within a `600x500` bounding canvas, providing an optimal visual layout for multi-node arrays.

* **Stateful Overlay Controllers:** Explicit DOM style synchronization ensures that top-level interactive layers hold state across repaints, projecting high-contrast matrices seamlessly:
* **Jurisdictional Borders:** Visualized via high-visibility Cyan vectors (`#06b6d4`).
* **Systemic Aquifers:** Visualized via explicit Emerald waves (`#10b981`).

* **1789 Constitutional Scaling Metric:** Operational threshold monitoring against a locked configuration standard ($1:60,000$), calculating and displaying real-time population stability indices directly within the interface canvas.

---

## 🚀 Installation & Initialization

To run the localized interface wrapper web app locally:

1. Clone the repository to your environment.
2. Serve the directory from a local web server to comply with asynchronous browser security policies for native file loading:

```bash
# Using Python's built-in server
python3 -m http.server 8080

```

3. Open a browser viewport at `http://localhost:8080`.
4. Execute a clean cache reload (`Shift + F5` or `Cmd + Shift + R`) to force initialization of the global memory states.
