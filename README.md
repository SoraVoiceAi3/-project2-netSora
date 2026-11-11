# SoraVoiceAi - Project 2

A modern web-based AI assistant interface with custom sliders, voice controls, and Python backend proxy integration for Google Gemini API.

---

## 🚀 Features

- **Interactive UI**: Clean, responsive layout with modern dark theme controls.
- **Dynamic Controls**: Custom slider controls (`slider.css`) and responsive styling (`style.css`).
- **Interactive Scripts**: Client-side logic for prompts, generation, and voice workflows (`assets/js/script.js`).
- **Local Backend Proxy**: Python lightweight HTTP server (`backend/server.py`) handling CORS and requests safely to the Gemini API (`gemini-1.5-flash`).

---

## 📁 Project Structure

```
.
├── .gitignore
├── README.md
├── index.html              # Main frontend application
├── organize.py             # Asset management helper
├── assets/
│   ├── css/
│   │   ├── slider.css      # Slider styling
│   │   └── style.css       # Core styles
│   └── js/
│       └── script.js       # Main application JavaScript
└── backend/
    └── server.py           # Python local server & API proxy (Port 5050)
```

---

## 🛠️ How to Run Locally

### 1. Start the Backend Server
Make sure you have Python installed, then run:

```bash
cd backend
python server.py
```
The server will start at `http://localhost:5050`.

### 2. Open the Frontend
Open `index.html` directly in your browser, or serve it using Live Server / any local web server:

```bash
# Using Python to serve the root directory (optional)
python -m http.server 8000
```
Then navigate to `http://localhost:8000`.

---

## ⚙️ Configuration

- Provide your Gemini API key inside the UI or configure it when sending requests.
- The backend forwards requests to `gemini-1.5-flash` endpoint via Google Generative Language API.

---

## 📄 License

MIT License. Free to use and modify.
