# DBMS Academic Portal

A role-based academic management portal built with Node.js, Express, MySQL, and a browser-based frontend.

## Live Deployment

- Production URL (Render): https://dbms-project-i5b2.onrender.com
- Cloud database: MySQL hosted on filess.io

## Project Highlights

- Role-based access for `ADMIN`, `STUDENT`, and `FACULTY`
- Faculty designations: `Faculty`, `HOD`, `PIC_TT`, `PIC_CDC`, `PIC_EXAM`
- Student workflows: enrollment, attendance, exams, transcript, results, feedback, leave, internships, placements, resume management
- Faculty workflows: marks and attendance updates, notifications, TA and leave decisions
- Admin workflows: user management, room management, term-end operation, enrollment/feedback feature toggles

## Repository Structure

```text
DBMS_Project/
|-- backend/
|   |-- schema.sql
|   |-- package.json
|   |-- src/
|       |-- app.js
|       |-- index.js
|       |-- config/
|       |-- controllers/
|       |-- middlewares/
|       |-- routes/
|       |-- services/
|-- frontend/
|   |-- index.html
|   |-- package.json
|   |-- assets/
|   |-- js/
|   |-- styles/
|-- documentation.tex
|-- Makefile
|-- package.json
```

## Quick File Links

- Project report: [documentation.tex](documentation.tex)
- Database schema: [backend/schema.sql](backend/schema.sql)
- Backend entry app: [backend/src/app.js](backend/src/app.js)
- Backend route index: [backend/src/routes/index.js](backend/src/routes/index.js)
- Frontend entry page: [frontend/index.html](frontend/index.html)
- Frontend API layer: [frontend/js/api.js](frontend/js/api.js)

## Tech Stack

- Backend: Node.js, Express.js
- Database: MySQL (`mysql2`)
- Auth: JWT (`jsonwebtoken`), password hashing (`bcryptjs`)
- File uploads: `multer`
- Bulk import: `xlsx`
- Frontend: HTML, CSS, JavaScript
- Hosting: Render (API), filess.io (MySQL)

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd DBMS_Project
npm install
npm install --prefix backend
```

### 2. Configure environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=student_db
# Optional for socket-based MySQL
# DB_SOCKET_PATH=/path/to/mysql.sock
```

### 3. Initialize database schema

```bash
cd backend
mysql -u <db_user> -p < schema.sql
```

### 4. Run backend

```bash
cd backend
npm start
```

Backend should be available at:

- `http://localhost:5000/api`
- `http://localhost:5000/api/health`

### 5. Run frontend

Option A (served by backend app):

- Start backend, then open `http://localhost:5000/`

Option B (frontend standalone):

```bash
cd frontend
npm start
```

## API Quick Reference

Common endpoints:

- `GET /api/`
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Examples:

```bash
curl -X POST "https://dbms-project-i5b2.onrender.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userId":"23CS01","password":"1"}'
```

## Deployment Notes

- Render service runs from repository root and starts backend via root `package.json` scripts.
- Ensure Render environment variables are set for DB and JWT settings.

## Documentation

Detailed schema, functional dependencies, normalization, API listing, and project structure are documented in:
[documentation.tex](documentation.tex)
