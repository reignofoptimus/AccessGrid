<div align="center">

# 🚗 AccessGrid

### Intelligent Campus Vehicle Entry-Exit Management & ANPR Telemetry Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-access--grid.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://access-grid.vercel.app/)

[![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Flask](https://img.shields.io/badge/Flask_3.x-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-ONNX_Runtime-FF6F00?style=flat&logo=darkreader&logoColor=white)](https://ultralytics.com/)
[![Tesseract OCR](https://img.shields.io/badge/Tesseract_OCR-5.x-3DDC84?style=flat&logo=google&logoColor=white)](https://github.com/tesseract-ocr/tesseract)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/reignofoptimus/AccessGrid?style=flat&color=eab308)](https://github.com/reignofoptimus/AccessGrid/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/reignofoptimus/AccessGrid?style=flat&color=38bdf8)](https://github.com/reignofoptimus/AccessGrid/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/reignofoptimus/AccessGrid?style=flat&color=a855f7)](https://github.com/reignofoptimus/AccessGrid/commits/main)

<br>

<a href="https://access-grid.vercel.app/">
  <img src="assets/demo.gif" alt="AccessGrid Live Demo Walkthrough" width="100%" style="border-radius: 12px; border: 1px solid #1f2922;" />
</a>

<p align="center">
  <em>High-precision campus vehicle access, edge license plate recognition, real-time gate pass verification, and spatial parking zone telemetry.</em>
</p>

<p align="center">
  <a href="https://access-grid.vercel.app/"><strong>🚀 Launch Live Application</strong></a>
  &nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="#quick-start"><strong>⚡ Quick Start</strong></a>
</p>

</div>

---

## 📑 Table of Contents

- [✨ Overview](#overview)
- [⚡ Key Capabilities](#key-capabilities)
- [🧠 ANPR Intelligence Pipeline](#anpr-intelligence-pipeline)
- [🏗️ System Architecture](#system-architecture)
- [🛠️ Tech Stack](#tech-stack)
- [📸 Application Walkthrough](#application-walkthrough)
- [🚀 Quick Start](#quick-start)
- [🔐 Demo Credentials](#demo-credentials)
- [📡 API Endpoints](#api-endpoints)
- [📊 Database Schema](#database-schema)
- [📁 Repository Structure](#repository-structure)
- [🤝 Contributing](#contributing)
- [📄 License](#license)

---

## ✨ Overview

**AccessGrid** is an intelligent campus security and transit operations platform engineered to replace paper gate registers and manual parking logs with automated, real-time vehicle access control. Combining edge-optimized **Automatic Number Plate Recognition (ANPR)** via YOLOv8 and Tesseract OCR with role-segregated operator dashboards, AccessGrid verifies arrivals in milliseconds, tracks campus occupancy across designated zones, and maintains an immutable audit trail of every gate transit.

> [!NOTE]  
> **Tactile Security Desk Posture:** AccessGrid functions as a high-precision operating instrument for campus gatekeepers. Automated detections are paired with instant operator overrides, manual plate lookups, and one-click entry/exit recordings.

---

## ⚡ Key Capabilities

| Capability | Core Functionality | Underlying Engine | Operator Benefit |
|---|---|---|---|
| **Edge ANPR Detection** | Automated plate extraction from gate camera images | Custom-trained YOLOv8 (ONNX Runtime CPU) + Tesseract OCR | Sub-second plate reading without dedicated GPU hardware |
| **Indian Plate Normalization** | Heuristic character disambiguation (`KA01AB1234` / `KL07AB1234`) | Position-aware regex parser & optical character correction | Eliminates common OCR ambiguities (e.g. `0` vs `O`, `1` vs `I`) |
| **Instant Gate Verification** | Operator search console matching incoming plates against registry | Indexed SQL lookup across registered students, faculty, & staff | Instant owner clearance, department identification, and pass status |
| **Spatial Parking Telemetry** | Interactive vector schematic displaying live bay availability | Vector SVG campus map with dynamic occupancy counters | Real-time zone capacity monitoring (Staff, Faculty, Student, Visitor) |
| **Digital Vehicle Passes** | Mobile-ready digital credentials for students & staff members | High-contrast embossed plate UI with live gate status tags | Instant pass presentation with complete personal travel history |
| **Role-Based Access Control** | Dedicated interfaces tailored for Admins, Security, and Students | Cookie-based session authentication with Werkzeug encryption | Least-privilege separation of registry, gate control, and telemetry |
| **Continuous Audit Log** | Immutable historical record of all gate transit timestamps | Relational event schema tracking timestamp, gate, and method | Instant search, filter, and audit review for campus security teams |

---

## 🧠 ANPR Intelligence Pipeline

```mermaid
flowchart LR
    A["Raw Vehicle Image<br>(Gate Camera Feed)"] --> B["Bilateral Filter<br>& Grayscale Engine"]
    B --> C["YOLOv8 Plate Detector<br>(ONNX CPU Inference)"]
    C --> D["Cropped License Plate<br>(Bounding Box Coordinates)"]
    D --> E["Morphological Closing<br>& Thresholding"]
    E --> F["Tesseract OCR<br>(PSM 7 Alphanumeric Whitelist)"]
    F --> G["Position-Aware Cleanup<br>(State Code + Series + Number)"]
    G --> H["Normalized Plate Key<br>e.g. KL-07-AB-1234"]
```

### Optical Pipeline Stages
1. **Edge Detection:** Gate camera captures incoming vehicle; custom-trained YOLOv8 model localizes the plate boundary box.
2. **Image Preprocessing:** Cropped plate region undergoes 4× scaling, bilateral noise filtration, adaptive binarization, and morphological cleanup.
3. **OCR Extraction:** Tesseract OCR (configured with Page Segmentation Mode 7) extracts raw alphanumeric characters.
4. **Deterministic Normalization:** Post-processing heuristics parse the string against standard Indian regional registration formats (`[State: 2 chars] [District: 2 digits] [Series: 1-2 chars] [Number: 4 digits]`), resolving optical character ambiguities before querying the database.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph SENSING ["1. Gate Ingestion & ANPR Edge"]
        A["Campus Main Gate Cameras<br>(Vehicle Arrival Image Feed)"] --> B["Image Processing Pipeline<br>(OpenCV, Bilateral Filter, Binarization)"]
        B --> C["YOLOv8 ONNX Runtime<br>(License Plate Localization)"]
        C --> D["Tesseract OCR & Heuristics<br>(Alphanumeric Normalization)"]
    end

    subgraph BACKEND ["2. Flask Application Core & Persistence"]
        D --> E["Gate Control REST API<br>(Flask 3.x Blueprint Routers)"]
        E --> F{"Authorization Engine"}
        F -->|Verified| G["Active Gate Event Logger<br>(PostgreSQL Relational Ledger)"]
        F -->|Unregistered| H["Visitor Intake & Pass Generation"]
        G & H --> I["Spatial Zone Allocator<br>(Real-Time Parking Capacity)"]
    end

    subgraph CLIENT ["3. Client Workspaces & Presentation"]
        I --> J["Security Desk Console<br>(Verify Vehicle, Manual Lookup, Transit Toggles)"]
        I --> K["Admin Overview Dashboard<br>(Campus Occupancy, Zone Schematic, Fleet Registry)"]
        I --> L["Student Mobile Portal<br>(Embossed Digital Pass, Bay Availability, History)"]
    end
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Badges | Technologies |
|---|---|---|
| **Frontend** | [![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/) [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/) [![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat&logo=axios&logoColor=white)](https://axios-http.com/) | React 19, Vite 7, Tailwind CSS, Lucide Icons, Axios, Vite PWA |
| **Backend** | [![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org) [![Flask](https://img.shields.io/badge/Flask-000000?style=flat&logo=flask&logoColor=white)](https://flask.palletsprojects.com/) [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/) [![Gunicorn](https://img.shields.io/badge/Gunicorn-499848?style=flat&logo=gunicorn&logoColor=white)](https://gunicorn.org/) | Python 3.10+, Flask 3.x, Flask-SQLAlchemy, Flask-Login, Gunicorn |
| **Computer Vision & ML** | [![YOLOv8](https://img.shields.io/badge/YOLOv8-FF6F00?style=flat&logo=darkreader&logoColor=white)](https://ultralytics.com/) [![ONNX](https://img.shields.io/badge/ONNX_Runtime-005CED?style=flat&logo=onnx&logoColor=white)](https://onnxruntime.ai/) [![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=flat&logo=opencv&logoColor=white)](https://opencv.org/) [![Tesseract](https://img.shields.io/badge/Tesseract_OCR-3DDC84?style=flat&logo=google&logoColor=white)](https://github.com/tesseract-ocr/tesseract) | Custom YOLOv8 Plate Detector, ONNX Runtime CPU, OpenCV, Tesseract OCR 5.x |
| **Database & Cloud** | [![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/) [![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black)](https://render.com/) | PostgreSQL 16 (Neon / Render / Supabase compatible), Vercel Hosting |
| **Security & Auth** | [![Sessions](https://img.shields.io/badge/Flask--Login-Sessions-000000?style=flat)](https://flask-login.readthedocs.io/) [![Werkzeug](https://img.shields.io/badge/Werkzeug-Bcrypt_PBKDF2-black?style=flat)](https://palletsprojects.com/p/werkzeug/) | HTTP-Only Secure Cookies, Werkzeug Password Hashing, CSRF Protection |

</div>

---

## 📸 Application Walkthrough

| Module | Interface Preview | Description |
|---|---|---|
| **Campus Overview & Analytics** | <img src="assets/campus-overview.jpg" alt="Campus Overview" width="360" /> | Real-time vehicle surveillance, 71% live occupancy telemetry, interactive glowing parking zone schematic, and recent gate movements |
| **Security Gate Control** | <img src="assets/gate-control.jpg" alt="Security Gate Control" width="360" /> | Instant license plate lookup (`KL-07-AB-1234`), credential verification (*Staff · Inside Campus*), and one-click entry/exit gate recording |
| **Digital Vehicle Pass** | <img src="assets/vehicle-pass.jpg" alt="Digital Vehicle Pass" width="360" /> | Student and faculty digital credential cards featuring high-contrast embossed registration plates (`IND KL-07-ST-4521`) and travel history |

---

## 🚀 Quick Start

### 1. Fast Launch (Windows)

Launch the complete stack (both Flask backend and React frontend) with one command:

```powershell
.\start.bat
```

* **Frontend Application:** `http://localhost:5173`
* **Backend REST API:** `http://localhost:5000`

---

<details>
<summary><strong>🔧 Manual Installation & Step-by-Step Setup (Click to expand)</strong></summary>

<br>

#### Step 1: Clone the Repository
```bash
git clone https://github.com/reignofoptimus/AccessGrid.git
cd AccessGrid
```

#### Step 2: Configure & Start Backend
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
python seed.py
python run.py
```

#### Step 3: Configure & Start Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

</details>

---

## 🔐 Demo Credentials

The platform includes pre-configured demo profiles for all campus operational roles:

| Role | Username | Password | Operational Access |
|---|---|---|---|
| **Campus Administrator** | `admin` | `admin123` | Campus Analytics, Zone Capacity, Vehicle Registry, Global Logs |
| **Security Gate Operator** | `security` | `security123` | Security Gate Desk, Instant Plate Scanner, Real-Time Entry/Exit Controls |
| **Registered Student** | `student` | `student123` | Personal Vehicle Status, Embossed Pass, Campus Parking Wayfinding |

> [!TIP]  
> All three role accounts can be tested instantly with **one click** directly from the [live demo login page](https://access-grid.vercel.app/).

---

## 📡 API Endpoints

| Method | Endpoint | Description | Access Level |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user and issue secure session cookie | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated profile and operational permissions | Authenticated |
| `POST` | `/api/auth/logout` | Terminate session and invalidate auth cookies | Authenticated |
| `GET` | `/api/vehicles/` | Query campus vehicle registry with filter parameters | Admin / Security |
| `POST` | `/api/vehicles/` | Register new student, faculty, or visitor vehicle | Admin |
| `POST` | `/api/gate/entry` | Record vehicle arrival timestamp and assign zone bay | Security |
| `POST` | `/api/gate/exit` | Record vehicle departure timestamp and free zone bay | Security |
| `GET` | `/api/gate/logs` | Fetch chronologically sorted campus gate movement logs | Admin / Security |
| `GET` | `/api/parking/zones` | Retrieve real-time zone capacities and occupancy numbers | All Users |
| `GET` | `/api/stats/` | Aggregate campus transit KPIs and headcounts | Admin |
| `POST` | `/api/anpr/detect` | Execute YOLOv8 detection and Tesseract OCR on uploaded image | Security |

---

## 📊 Database Schema

```mermaid
erDiagram
    User ||--o{ Vehicle : owns
    Vehicle ||--o{ EntryLog : generates

    User {
        int id PK
        string username
        string password_hash
        string role
        string name
        string department
        string student_id
    }

    Vehicle {
        int id PK
        string plate_number
        string type
        string owner_name
        int owner_id FK
        string department
        string status
        boolean is_inside
    }

    ParkingZone {
        string id PK
        string name
        string label
        int capacity
        int occupied_count
        boolean is_restricted
        string color
    }

    EntryLog {
        int id PK
        int vehicle_id FK
        datetime timestamp
        string action
        string gate_name
        string image_path
        boolean manual_entry
    }
```

---

## 📁 Repository Structure

```
AccessGrid/
├── assets/                       # High-definition demonstration assets and UI previews
│   ├── demo.gif                  # Autoplaying product walkthrough
│   ├── demo.mp4                  # Full HD 1080p demonstration video
│   ├── campus-overview.jpg       # Executive campus overview interface
│   ├── gate-control.jpg          # Security gate control & plate lookup interface
│   └── vehicle-pass.jpg          # Student embossed digital vehicle pass interface
├── anpr/                         # Standalone ANPR training pipeline
│   ├── anpr_pipeline.py          # Python detection & OCR pipeline script
│   ├── dataset/                  # License plate training & validation images
│   └── runs/                     # YOLOv8 training weights (best.pt)
├── backend/                      # Flask REST API & computer vision service
│   ├── app/
│   │   ├── routes/               # API route blueprints (auth, gate, vehicles, parking...)
│   │   ├── anpr/                 # Production ONNX runtime detector & OCR pipeline
│   │   ├── models.py             # SQLAlchemy relational database models
│   │   └── utils/                # Helper utilities and input sanitizers
│   ├── seed.py                   # Pre-seeded campus database generator
│   ├── config.py                 # Application configuration & secret keys
│   └── run.py                    # Server bootstrapper
├── frontend/                     # React 19 + Vite client application
│   ├── src/
│   │   ├── components/           # UI modules (Overview, GateControl, VehicleRegistry...)
│   │   ├── api/                  # Axios typed API client
│   │   └── App.tsx               # Master router & role gatekeeper
│   ├── tailwind.config.js        # Design tokens & tactile color palette
│   └── package.json              # Node.js dependencies & scripts
├── setup.bat                     # One-click environment configuration
├── start.bat                     # Dual-stack automated launcher
├── LICENSE                       # MIT Open Source License
└── README.md                     # Comprehensive technical documentation
```

---

## 🤝 Contributing

Contributions are welcome from developers, computer vision researchers, and campus security engineers!

1. **Fork the Repository**
2. **Create a Feature Branch:** `git checkout -b feature/enhanced-plate-heuristics`
3. **Commit Your Changes:** `git commit -m "feat: add confidence threshold tuning for low-light ANPR"`
4. **Push to the Branch:** `git push origin feature/enhanced-plate-heuristics`
5. **Open a Pull Request:** Describe the enhancements and ensure existing tests pass.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

<div align="center">
  <sub>Engineered by <a href="https://github.com/reignofoptimus">Nirmal Madhu</a> · Intelligent campus transit & access automation</sub>
</div>
