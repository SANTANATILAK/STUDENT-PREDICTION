# Carbon Cinema 🎬 | Luxury Automotive Photography & Films

[![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/SANTANATILAK/STUDENT-PREDICTION)

Carbon Cinema is a premium, high-end visual showcase website designed for a luxury supercar and superbike photography agency. Built on a velvet black and gold design language, this Progressive Web App (PWA) delivers direct booking workflows, Google SSO login, offline fallback capability, and integrated notifications.

---

## ⚡ One-Click Cloud Deployment (Runs 24/7/365)

Because we have pre-configured a `render.yaml` blueprint, you can host this website online permanently (until 2096 and beyond) on Render's cloud servers in **one click**:

1. **Click the button below**:
   [![Deploy to Render](https://render.com/images/deploy-to-render.svg)](https://render.com/deploy?repo=https://github.com/SANTANATILAK/STUDENT-PREDICTION)
2. **Authorize Render** to connect with your GitHub account.
3. Fill in your **Google Client ID** in the environment variable prompt (or leave the dummy default value to update later via the Render Settings Dashboard).
4. Click **Apply**. Render will automatically compile, build, and deploy your live website with a secure, permanent `https://[your-app].onrender.com` link!

---

## 🌟 Key Features

1. **Cinematic Portfolio & Showcase**
   * Luxury serif typography, immersive video overlays, and smooth CSS hover glows.
   * Dynamic supercar, luxury car, and superbike showcase catalog loaded directly from a SQLite backend database.

2. **Advanced Session Booking**
   * Dedicated date selectors and time slot managers (Morning Golden Hour, Sunset, Midnight Rollers).
   * **Dual-Channel Notifications**: Form submission triggers an email dispatcher to `tilaksontana59@gmail.com` and redirects the client to a pre-filled WhatsApp chat link addressed to **+91 81212 45333**.

3. **Google Sign-In Single Sign-On (SSO)**
   * Officially integrated Google Identity Services (GSI) script.
   * Secure back-end verification routing (`/api/auth/google`) using Google's signature verification endpoints.
   * Developer override panel in the client interface to easily configure and test local OAuth client IDs.

4. **Progressive Web App (PWA) & Offline Fallback**
   * Fully compliant manifest config (`manifest.json`) registering custom icons and wide/narrow showcase screenshots.
   * Service worker (`sw.js`) implementing Workbox's offline-page strategy.
   * Self-contained, custom-styled offline page (`templates/offline.html`) designed to render instantly when connectivity is lost.

5. **Client Portal & Production Hub**
   * Active tracking pipeline for vehicle photo sessions (Pre-production, Editing, Delivered).
   * Admin dashboard to update print store pricing, catalog lists, and read feedback messages.

---

## 📂 Repository Layout

```
├── app.py                  # Main Flask server with Google OAuth verification
├── models.py               # Database structure for equipment, prints, and bookings
├── seed.py                 # Seeds database with default high-end gear & vehicles
├── render.yaml             # Blueprint for automated Render cloud deployment
├── requirements.txt        # Backend libraries (Flask, SQLAlchemy, Gunicorn, Pillow)
├── static/
│   ├── css/style.css       # Velvet black & gold design rules
│   ├── js/main.js          # Google button rendering & mobile menu auto-close
│   ├── js/portfolio.js     # Form slot parsing & WhatsApp redirection
│   ├── sw.js               # Service Worker offline cache-handler
│   └── manifest.json       # PWA store presentation schema
└── templates/
    ├── base.html           # Unified site layout shell
    ├── index.html          # Cinematic home & bookings form
    └── offline.html        # Embedded brand offline fallback landing page
```

---

## 🛠️ Local Development

To run the project locally on your machine:

1. **Run the Virtual Environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
2. **Install Packages**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Seed Database Tables**:
   ```bash
   python seed.py
   ```
4. **Boot Local Server**:
   ```bash
   python app.py
   ```
5. Open your browser and navigate to `http://localhost:5000`.
