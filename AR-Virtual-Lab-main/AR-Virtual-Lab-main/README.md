# ◈ VirtuLab – AR Virtual Electronics Laboratory

An Augmented Reality (AR) Virtual Lab for simulating digital electronics experiments in the browser. Explore logic gates, flip-flops, combinational circuits, and computer graphics algorithms in an interactive 3D environment.

---

## ✨ Features

| Module | Details |
|--------|---------|
| **Logic Gates** | AND, OR, NOT, NAND, NOR, XOR, XNOR, BUFFER with interactive toggle & truth tables |
| **Combinational Circuits** | Half Adder, Full Adder, MUX 4:1, 2:4 Decoder, 4:2 Encoder |
| **Sequential Circuits** | SR, JK, D, T Flip-Flops with timing waveforms |
| **Computer Graphics** | DDA, Bresenham, Circle, 2D/3D Transforms, Clipping, Bezier, Animation |
| **AR Simulation** | Point-and-place 3D components on real surfaces via camera |
| **Circuit Builder** | Drag-and-drop custom circuit construction |
| **Backend API** | User auth, experiment tracking, progress persistence |

---

## 📁 Project Structure

```
AR-Virtual-Lab-main/
├── backend/                       # Flask API server
│   ├── app.py                     # Entry point & static file server
│   ├── config.py                  # Environment-based configuration
│   ├── models.py                  # SQLite schema & data helpers
│   ├── routes/
│   │   ├── auth.py                # POST /api/signup, POST /api/login
│   │   └── experiments.py         # GET /api/experiments, POST /api/progress
│   ├── services/
│   │   ├── auth_service.py        # JWT token generation & validation
│   │   ├── cache_service.py       # In-memory TTL cache
│   │   └── experiment_service.py  # JSON data loader with caching
│   ├── middleware/
│   │   └── rate_limiter.py        # IP-based sliding window rate limiting
│   └── utils/
│       ├── validators.py          # Reusable input validators
│       └── security.py            # Crypto helpers & sanitization
│
├── frontend/                      # Modular frontend additions
│   ├── static/
│   │   ├── css/                   # auth.css, dashboard.css, theme.css
│   │   ├── js/                    # config, api, auth, cache, dashboard, AR helpers
│   │   └── assets/                # Images/icons
│   └── templates/
│       ├── login.html             # Standalone login page
│       ├── signup.html            # Standalone signup page
│       └── dashboard.html         # User dashboard with experiment cards
│
├── main/                          # Original frontend
│   ├── index.html                 # Main application
│   ├── virtual_lab.html           # Virtual lab interface
│   ├── cg.html / cg.js            # Computer graphics module
│   ├── deld-combinational-lab.html # Combinational circuits lab
│   ├── app.js                     # Core application JS
│   ├── style.css                  # Main stylesheet
│   ├── arvr-lab-platform.css      # AR/VR platform styles
│   ├── start_server.py            # Legacy Python HTTP server
│   ├── start_server.bat           # Legacy server launcher
│   ├── GATES/                     # Gate simulations
│   │   ├── AND Gate/              # AND gate with truth table
│   │   ├── OR Gate/               # OR gate
│   │   ├── NOT Gate/              # NOT gate (inverter)
│   │   ├── NAND Gate/             # NAND gate
│   │   ├── NOR GATE/              # NOR gate
│   │   └── X-OR Gate/             # XOR gate
│   └── flip flops/                # Flip-flop simulations
│       ├── SR-FlipFlop/           # SR flip-flop
│       ├── JK-FlipFlop-3D/        # JK flip-flop (3D)
│       ├── D-Flipflop/            # D flip-flop
│       └── T-FlipFlop/            # T flip-flop
│
├── cpp_output/                    # C++ algorithm implementations
│   └── cg/                        # Computer graphics algorithms
│       ├── 01_dda_line.cpp        # DDA line drawing
│       ├── 02_bresenham_line.cpp  # Bresenham's line
│       ├── 03_midpoint_circle.cpp # Midpoint circle
│       ├── 04_midpoint_ellipse.cpp
│       ├── 05–09_transforms.cpp   # Translation, rotation, scaling, etc.
│       ├── 11_cohen_sutherland.cpp # Line clipping
│       ├── 14_bezier_curve.cpp    # Bézier curves
│       └── ... (15 files total)
│
├── data/
│   └── experiments.json           # 24 experiment definitions with metadata
│
├── database/                      # SQLite database (auto-created)
│   └── app.db
│
├── .env.example                   # Template for environment config
├── .gitignore                     # Git ignore rules
├── LICENSE                        # MIT License
├── requirements.txt               # Python dependencies
├── start.bat                      # Windows one-click launcher
├── start.sh                       # Linux/macOS launcher
└── README.md                      # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** with pip
- A modern browser (Chrome, Edge, Firefox)

### Clone & Run

```bash
git clone https://github.com/<your-username>/AR-Virtual-Lab.git
cd AR-Virtual-Lab

pip install -r requirements.txt

python backend/app.py
```

Or just **double-click `start.bat`** on Windows.

> **Note:** If you download the ZIP from GitHub, it may extract into a double-nested folder
> `AR-Virtual-Lab-main/AR-Virtual-Lab-main/`. Make sure you `cd` into the inner directory
> that contains `requirements.txt`.

The server starts at **http://localhost:5000** and opens automatically.

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/signup` | — | Register – `{ name, email, password }` |
| `POST` | `/api/login` | — | Authenticate – `{ email, password }` |
| `GET` | `/api/experiments` | — | List all experiments |
| `POST` | `/api/progress` | 🔒 JWT | Save progress – `{ experiment_id, status, score }` |
| `GET` | `/api/progress/<user_id>` | 🔒 JWT | Get user progress (own data only) |
| `GET` | `/api/health` | — | Health check |

> **Auth:** Protected endpoints require `Authorization: Bearer <token>` header.
> Tokens are returned by `/api/login` and `/api/signup`.

---

## 🗄️ Database Schema

```sql
User       (id, name, email, password, created_at)
Experiment (id, title, type)
Progress   (id, user_id, experiment_id, status, score, updated_at)
```

- Passwords are hashed with Werkzeug (PBKDF2)
- Duplicate emails are rejected (UNIQUE constraint)
- Progress uses UPSERT (ON CONFLICT)

---

## 🛠️ Technologies

| Layer | Stack |
|-------|-------|
| **Frontend** | HTML, CSS, JavaScript, Three.js (AR) |
| **Backend** | Flask, flask-cors, python-dotenv |
| **Database** | SQLite 3 |
| **Auth** | Werkzeug password hashing |

---

## 📝 Design Decisions

1. **No existing files modified** – all new code lives in `backend/` and `frontend/`
2. **Single-process server** – Flask serves both API and static files
3. **Zero-config database** – SQLite auto-creates on first run
4. **Frontend JS modules** are pure IIFE patterns – no build step required
5. **Theme CSS is additive** – layers on top of existing `style.css`

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes
4. Push and open a Pull Request

---

## 📄 License

MIT License. See `LICENSE` file for details.

<p align="center">Made with ❤️ for virtual engineering education</p>
