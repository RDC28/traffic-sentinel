# TrafficSentinel VLM
### Standalone Traffic Violation Detection & Cryptographic Court Evidence Locker

TrafficSentinel VLM is an intelligent computer vision solution designed to automate the process of detecting traffic violations, recognizing license registration details via ANPR OCR, and managing tamper-proof digital evidence packages. 

It provides real-time detection, a stateful human-in-the-loop audit process, cryptographic HMAC SHA-256 validation, and low-light visual processing filters in a premium, fully responsive interface that supports Dark Mode.

---

## Key Features

1. **Preset Violation Suite**: 7 preloaded real-world traffic violation scenarios:
   - *Scenario 1 (Two-Wheeler)*: Helmet non-compliance check.
   - *Scenario 2 (Overcrowding)*: Triple riding on a single scooter.
   - *Scenario 3 (Intersection)*: Red light violation crossing a stop line.
   - *Scenario 4 (Obstruction)*: Illegal parking on a sidewalk.
   - *Scenario 5 (Danger Flow)*: Wrong-way driving against traffic.
   - *Scenario 6 (Windshield)*: Driver/passenger seatbelt non-compliance.
   - *Scenario 7 (Encroachment)*: Vehicle stopped past the painted line.
2. **Zero-Shot VLM Prompter**: Query camera feeds in plain, natural language (e.g. *"Detect riders without safety helmets"*), powered by VLM-LLaVA-v3 simulation.
3. **Stateful Judicial Review Audit Queue**: Human-in-the-loop audit queue displaying pending, approved, and rejected cases with real-time Precision Rate scoring.
4. **Court Evidence Locker**: Seals infraction payloads cryptographically using HMAC SHA-256. If a case is audited and rejected as a false positive, the evidence seal is automatically marked as `VOID` (Invalidated) to preserve judicial audit integrity.
5. **Preprocessing Enhancements**: Real-time toggles to preview raw vs. contrast-enhanced (Gamma, CLAHE, motion de-blur) CCTV feeds for low-visibility conditions.
6. **Premium Dark Mode**: Beautiful, adaptive theme switching with local storage persistence and transition animations.

---

## Quick Start (Local Installation)

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your system.

### 2. Set Up Virtual Environment
Clone this repository, navigate to the repository root directory, and create a virtual environment:
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## How to Run

To run the full project, you need to launch both the FastAPI Backend API and the static web server.

### Step 1: Run the Backend API
With your virtual environment active, launch the backend API:
```bash
python api/main.py
```
* The API will start running locally at **[http://127.0.0.1:8002](http://127.0.0.1:8002)**.

### Step 2: Run the Web Server
In a new terminal window, navigate to the `dashboard` directory and launch a lightweight web server:
```bash
cd dashboard
python -m http.server 3002
```
* Open your browser and navigate to **[http://localhost:3002](http://localhost:3002)** to run the dashboard.

---

## Testing Custom Uploads
1. Click **"Browse image from device..."** under **Or Upload Custom Feed** in the left sidebar.
2. Select any local image (such as custom safety compliance captures).
3. Enter your zero-shot detection prompt (e.g. *"Detect driver without seatbelt"*) and click **"Run Inference"**.

---

## Contributors
This project is developed and maintained by:
- **rdc28**
- **sakshikolhal**
- **rane05**
