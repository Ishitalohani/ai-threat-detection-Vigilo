# 🛡️ AI Threat Detection

An AI-powered cybersecurity platform that analyzes **Nginx access logs** and uses a multi-model machine learning ensemble to classify HTTP traffic as **benign or malicious in real time**.

The system combines **machine learning, rule-based detection, asynchronous log processing, threat scoring, and real-time alerting** to identify suspicious traffic and common web application attacks.

---

## 🚀 Key Features

- 🤖 **3-Model ML Ensemble** — Combines Autoencoder, Random Forest, and Isolation Forest models for threat detection.
- ⚡ **Real-Time Detection** — Continuously processes incoming Nginx access logs and identifies malicious traffic.
- 🔍 **35-Dimensional Feature Extraction** — Converts raw HTTP logs into structured feature vectors for ML analysis.
- 🛡️ **Rule-Based Detection** — Detects SQL Injection, XSS, Path Traversal, Command Injection, Log4Shell, and SSRF patterns.
- 📊 **Threat Severity Scoring** — Classifies traffic into LOW, MEDIUM, and HIGH severity levels.
- 🔔 **Real-Time Alerts** — Provides live threat notifications through WebSocket streaming.
- 🧠 **Automatic Model Training** — Trains models using synthetic attack data during initial deployment.
- 🔄 **Model Retraining** — Supports retraining using stored security events and reviewed labels.
- 🐳 **Dockerized Deployment** — Supports deployment alongside Nginx-based infrastructure using Docker Compose.
- 📈 **Security Dashboard** — Provides threat statistics, model status, detected events, and real-time alerts.
- 🧪 **Attack Simulation** — Includes tools for generating simulated malicious and normal HTTP traffic.

---

## 🧠 How It Works

The system processes Nginx access logs through a four-stage asynchronous pipeline:

```text
Nginx Access Logs
        │
        ▼
┌──────────────────────┐
│   Log Monitoring     │
│  Polling Observer    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Stage 1: Log Parsing │
│ Nginx Combined Format│
└──────────┬───────────┘
           │
           ▼
┌────────────────────────┐
│ Stage 2: Feature       │
│ Extraction             │
│ 35-Dimensional Vector  │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Stage 3: Threat        │
│ Detection              │
│ Rules + ML Ensemble    │
└──────────┬─────────────┘
           │
           ▼
┌────────────────────────┐
│ Stage 4: Alert & Store │
│ PostgreSQL + Redis     │
└──────────┬─────────────┘
           │
           ▼
     Real-Time Dashboard
```

---

## 🔬 Detection Engine

The detection engine combines **security rules** with a machine learning ensemble.

### Machine Learning Models

| Model | Purpose |
|---|---|
| **Autoencoder** | Detects anomalous traffic patterns |
| **Random Forest** | Classifies known malicious traffic patterns |
| **Isolation Forest** | Identifies unusual or anomalous requests |

The models are exported to **ONNX** for efficient CPU-based inference.

### Ensemble Scoring

```text
Autoencoder       → 40%
Random Forest     → 40%
Isolation Forest  → 20%
```

The ensemble score is combined with rule-based detection to determine the final threat classification.

---

## 🛡️ Threat Detection

The rule engine detects patterns associated with common web attacks:

- SQL Injection (SQLi)
- Cross-Site Scripting (XSS)
- Path Traversal
- Command Injection
- Log4Shell
- Server-Side Request Forgery (SSRF)
- Scanner activity
- Flooding and suspicious traffic patterns

---

## 📊 Threat Severity

Threat scores range from **0.0 to 1.0**.

| Severity | Score | Action |
|---|---:|---|
| 🔴 **HIGH** | `0.7+` | Stored, alerted through WebSocket, block recommendation |
| 🟠 **MEDIUM** | `0.5 – 0.7` | Stored and monitored |
| 🟢 **LOW** | `< 0.5` | Logged for pattern analysis |

---

## 🧠 ML Training Pipeline

Models automatically train during the initial deployment using synthetic attack patterns such as:

- SQL Injection
- XSS
- Path Traversal
- Scanner traffic
- Other malicious HTTP request patterns

The trained models are exported to ONNX for deployment.

### Validation Requirements

```text
F1 Score  >= 0.80
PR-AUC    >= 0.85
```

### Model Retraining

The retraining pipeline can use events stored in the database:

- **Reviewed events** use human-verified labels as ground truth.
- **Unreviewed events** use score-based heuristics.
- Synthetic samples can supplement the dataset when insufficient real-world data is available.

---

## 🧪 Attack Simulation

A development log generator is included for testing the detection pipeline.

### Available Attack Modes

```text
normal
sqli
xss
traversal
cmdi
log4shell
ssrf
scanner
flood
mixed
```

### Example

```bash
docker compose -f dev-log/compose.yml up -d
python dev-log/simulate.py mixed -n 100
```

This generates simulated Nginx traffic that can be processed by the threat detection pipeline.

---

## 🛠️ Technology Stack

### Backend

- **FastAPI** — Asynchronous API framework
- **Python** — Core backend and ML implementation
- **PostgreSQL** — Persistent security event storage
- **Redis** — Event messaging and pub/sub
- **ONNX Runtime** — ML model inference
- **PyTorch** — Machine learning
- **scikit-learn** — Classical machine learning models
- **MLflow** — ML experiment and model management

### Frontend

- **React**
- **TypeScript**
- **Vite**
- **Sass**
- **TanStack Query**
- **Zustand**

### Infrastructure

- **Docker**
- **Docker Compose**
- **Nginx**
- Shared-volume log processing
- Automated model training

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────┐
                    │    Nginx Server     │
                    │    Access Logs      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Polling Observer    │
                    │  Log Monitoring      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     Raw Queue       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Log Parser       │
                    │      Stage 1        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Feature Extraction  │
                    │      Stage 2        │
                    │ 35-Dimensional      │
                    │ Feature Vector      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Threat Detection    │
                    │      Stage 3        │
                    │ Rules + ML Ensemble │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Alert Dispatch    │
                    │      Stage 4        │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
          ┌──────────────┐          ┌──────────────┐
          │  PostgreSQL  │          │    Redis     │
          │ Threat Data  │          │   Pub/Sub    │
          └──────────────┘          └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  WebSocket   │
                                    │    Alerts    │
                                    └──────┬───────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │  Dashboard   │
                                    └──────────────┘
```

---

## ⚙️ Quick Start

### Prerequisites

Make sure you have:

- Docker
- Docker Compose
- Python 3.x
- Git

### 1. Clone the Repository

Replace the URL below with your actual GitHub repository URL:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Configure Environment Variables

Create the environment file:

```bash
cp .env.example .env
```

Update `.env` with the required configuration.

### 3. Start the Application

```bash
docker compose -f dev.compose.yml up -d
```

The initial startup may take a few minutes while the machine learning models are trained.

### 4. Access the Dashboard

Once the application is running, open:

```text
http://localhost:46969
```

---

## 🔌 API

The platform provides APIs for monitoring threats, managing models, and ingesting security logs.

| Endpoint | Description |
|---|---|
| `GET /health` | Health check |
| `GET /stats` | Threat statistics and severity breakdown |
| `GET /threats` | Paginated threat events with filters |
| `GET /models/status` | Active models, detection mode, and metrics |
| `POST /models/retrain` | Trigger model retraining |
| `POST /ingest/batch` | Manually ingest log lines |
| `WS /ws/alerts` | Real-time threat alert stream |

> **Security:** Protected API endpoints require the configured `X-API-Key` header.

---

## 📈 Dashboard

The dashboard provides visibility into:

- Detected threats
- Threat severity
- Attack classifications
- Security event statistics
- Model status
- Detection metrics
- Real-time alerts
- Stored security events

---

## 🔐 Security Considerations

This project is intended for **security research, testing, learning, and defensive monitoring**.

When deploying the system:

- Protect API keys and credentials.
- Do not expose development services directly to the public internet.
- Use appropriate authentication and network controls.
- Validate detection results before taking automated blocking actions.
- Only run attack simulations against systems you own or have explicit permission to assess.

---

## 📌 Project Status

The core system includes:

- ✅ Real-time log processing
- ✅ ML-based threat detection
- ✅ Rule-based detection
- ✅ Threat scoring
- ✅ Security event storage
- ✅ Real-time WebSocket alerts
- ✅ Model training and retraining
- ✅ Attack simulation
- ✅ Web-based dashboard

The system can be extended with additional detection rules, datasets, machine learning models, visualization features, and security integrations.

---

## 📚 Learning Areas

This project provides practical exposure to:

- Machine learning for cybersecurity
- HTTP traffic analysis
- Anomaly detection
- Ensemble-based threat detection
- Security rule engines
- Asynchronous processing pipelines
- Real-time security monitoring
- ML model deployment with ONNX
- WebSocket-based security alerts
- Dockerized cybersecurity applications

---

## 🤝 Contributing

Contributions and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Commit your changes.
6. Push the branch.
7. Open a Pull Request.

Bug reports, suggestions, and feature requests are also welcome.

---

## ⭐ Project Highlights

**AI Threat Detection combines machine learning, cybersecurity rules, real-time log processing, and security monitoring into an end-to-end threat detection platform.**

`Machine Learning` • `Cybersecurity` • `Threat Detection` • `Anomaly Detection` • `FastAPI` • `React` • `PostgreSQL` • `Redis` • `ONNX` • `Docker` • `WebSockets`
