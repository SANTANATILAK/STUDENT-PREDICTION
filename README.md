# Personal Portfolio & Multi-App Hub

Welcome to your **Personal Portfolio & Multi-App Hub**! This project is a cohesive, full-stack web application that showcases your skills and acts as a deployment-ready portal containing three fully functional, interactive sub-applications.

All four projects run under a unified **Node-free Python Flask** backend and share a **SQLite** database, creating a fast, light-weight, and highly-maintainable code structure.

---

## 🚀 Unified Sub-Applications

1. **Personal Portfolio Website (Home `/`)**:
   - Modern, responsive landing page styled with custom CSS variables and glassmorphism components.
   - Interactive typing subtitle animation.
   - Dynamic capabilities panel reading skills data directly from the relational database.
   - Secure Contact Message Form submitting queries directly to the operator dashboard.
2. **Task Management Application (Tasks `/tasks`)**:
   - Secure user registration and session login dashboards.
   - Complete CRUD operations (Create, Read, Update, Delete) for task items.
   - Filters to display all tasks, pending tasks, or completed tasks.
   - Task details modal to edit task descriptions, status, and due dates.
3. **E-Commerce Web Application (Shop `/shop`)**:
   - Interactive hardware store layout with text-based catalog search and category filtering.
   - Product details modal overlays with SVG vector product representations.
   - Active shopping cart drawer (client state managed) with items, subtotal, tax, and order totals.
   - Authenticated checkout producing order invoices and storing them under account history.
4. **Blog Platform with Comments (Blog `/blog`)**:
   - Engineering journal feed displaying posts, author details, and comments count.
   - Expanded article view with discussion boards allowing comments insertion.
   - Registered users can write, edit, or delete their own posts, while visitors can post comments.
5. **Admin Operator Dashboard (Admin `/admin`)**:
   - Password-protected session access (`admin` / `admin123`).
   - Analytics metrics counters for overall database entities (Users, Tasks, Products, Orders, Messages).
   - Inquiries Inbox to read, toggle read-state, or delete feedback messages.
   - Store Catalog CRUD interface to add, modify, or delete hardware listings.

---

## 📂 Project Structure

```
├── app.py                  # Main Flask entry point containing API routing
├── models.py               # SQLAlchemy Database schemas
├── config.py               # System environment configurations
├── seed.py                 # DB seeding script (creates tables & inputs sample data)
├── requirements.txt        # Python backend dependencies
├── templates/              # HTML layout templates
│   ├── base.html           # Shared layout header, navbar, & footer shell
│   ├── index.html          # Portfolio Homepage layout
│   ├── tasks.html          # Task Manager dashboard layout
│   ├── shop.html           # Storefront catalog & cart layout
│   ├── blog.html           # Articles feed & reader layout
│   └── admin.html          # Administration operator layout
└── static/                 # Static asset folders
    ├── css/
    │   └── style.css       # Master stylesheet (Custom variables, glassmorphic UI)
    └── js/
        ├── main.js         # Global navigation toggle & auth session tracker
        ├── portfolio.js    # Homepage typing effect, skill meters, & contact posts
        ├── tasks.js        # Tasks registration, filters, & CRUD triggers
        ├── shop.js         # Store searching, cart calculations, & past order invoice maps
        ├── blog.js         # Post reading, comments append, & editing modals
        └── admin.js        # Admin counters loader, inbox message viewer, & catalog CRUD
```

---

## 🛠️ Local Installation & Development

To run this application locally on Windows:

1. **Activate the Virtual Environment**:
   ```powershell
   # In PowerShell (root directory)
   .\venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Seed the Relational Database**:
   ```bash
   python seed.py
   ```
   *This initializes the `portfolio.db` SQLite file and pre-populates default professional skills, tasks, e-commerce gear, and engineering articles.*

4. **Start the Development Server**:
   ```bash
   python app.py
   ```

5. **Access the Portal**:
   Open your browser and navigate to **`http://localhost:5000`**.

---

## 🧪 Automated Tests

An automated REST API test script is provided under the workspace environment to verify authentication flows, task CRUD actions, product additions, comment posting, and admin permissions:

```bash
# Run tests against server
python brain/09cd31d0-7459-4522-8953-b3923a935fa1/scratch/verify_api.py
```

---

## 💾 Git Push & Deployment

To publish this codebase directly to your GitHub repository:

1. **Initialize Git in the Workspace**:
   *(If git is not yet initialized)*
   ```bash
   git init
   git branch -M main
   ```

2. **Add Files and Commit**:
   ```bash
   git add .
   git commit -m "feat: Add full-stack personal portfolio and multi-app hub"
   ```

3. **Link Your GitHub Repository**:
   ```bash
   git remote add origin https://github.com/Abhinay-tech-stack/personal-portifolio.git
   ```

4. **Push to Remote Branch**:
   ```bash
   git push -u origin main
   ```

### Hosting Deployments:
- **Render / Heroku**:
  - Connect your GitHub repository.
  - Set Environment: **Python**.
  - Build Command: `pip install -r requirements.txt`.
  - Start Command: `gunicorn app:app` (requires adding `gunicorn` to `requirements.txt`).
- **SQLite note**: SQLite databases reside locally. For persistent databases in production (like Heroku), change `DATABASE_URL` in your configuration to point to a PostgreSQL or MySQL connection string. Flask-SQLAlchemy will handle the connection automatically without changing any of the code!
