# BeautyKart

Beauty e-commerce app: **React + Vite** storefront, **Spring Boot** REST API, **MySQL**.

```
BeautyKart/
├── BeautyKart-frontend/   React 19, Vite, React Router        -> Vercel
├── Beautykart-backend/    Spring Boot 3.1, Java 17+, Maven    -> Render (Docker)
└── .github/workflows/     CI (backend verify, frontend lint+build)
```

## Features
- Sign up / log in / log out with server-side sessions (BCrypt-hashed passwords)
- Product catalogue (search, category filter, details), persistent cart
- Profile page with photo upload (JPG/PNG/WEBP, max 2 MB)
- Admin: JSON API + React pages (dashboard, admin management) and a legacy server-rendered console at `/services`
- **Not implemented yet:** orders and payments (Checkout validates the form but saves nothing)

## Run locally (Windows PowerShell)

### 1. MySQL
Create a database (default name `beautyproject`):
```powershell
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS beautyproject CHARACTER SET utf8mb4;"
```

### 2. Backend  (http://localhost:8080)
```powershell
cd Beautykart-backend
$env:DB_PASSWORD = "<your local mysql password>"
# Optional: create the first admin (only used when no admin exists yet; password >= 8 chars)
$env:INITIAL_ADMIN_NAME     = "Admin"
$env:INITIAL_ADMIN_EMAIL    = "admin@example.com"
$env:INITIAL_ADMIN_PASSWORD = "<choose-a-strong-password>"
.\mvnw.cmd clean test
.\mvnw.cmd spring-boot:run
```
macOS/Linux: `export DB_PASSWORD=...` then `./mvnw spring-boot:run`.

### 3. Frontend  (http://localhost:5173)
```powershell
cd BeautyKart-frontend
npm install
npm run dev
```
`.env.development` points the app at `http://localhost:8080`.

## Environment variables

### Backend (Render -> Environment)
| Variable | Required | Example / notes |
|---|---|---|
| `DB_URL` | prod | `jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/<DB_NAME>?sslMode=REQUIRED` (copy host/port/db from the Aiven console) |
| `DB_USERNAME` | prod | from Aiven |
| `DB_PASSWORD` | prod | from Aiven (**secret**) |
| `SESSION_COOKIE_SAME_SITE` | prod | `none` (Vercel and Render are different sites) |
| `SESSION_COOKIE_SECURE` | prod | `true` |
| `CORS_ALLOWED_ORIGINS` | prod | `https://beauty-kart-ashy.vercel.app` (comma-separated, exact origins, no `*`) |
| `INITIAL_ADMIN_NAME/EMAIL/PASSWORD/NUMBER` | first deploy | creates the first admin only if none exists; remove afterwards |
| `DDL_AUTO` | no | default `update` (adds tables/columns, never drops). Never use `create`/`create-drop` |
| `PORT` | no | set automatically by Render |

Local defaults need none of these except `DB_PASSWORD`.

### Frontend (Vercel -> Settings -> Environment Variables)
| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://beautykart-7o7b.onrender.com` (already in `.env.production`) |

`VITE_*` values are public (bundled into the JS). Never put secrets there.

## Deploy

**Render (backend)** – Web Service, *Runtime: Docker*, *Root Directory:* `Beautykart-backend`, Dockerfile path `./Dockerfile`, *Health Check Path:* `/api/health`. Add the environment variables above. Check `/api/health/db` after deploy: `200` = database reachable, `503` = database problem (see Render logs).

**Vercel (frontend)** – *Root Directory:* `BeautyKart-frontend`, Framework *Vite*, build `npm run build`, output `dist`. `vercel.json` rewrites all routes to `index.html` so refreshing `/products/3` works.

**Database (Aiven MySQL)** – tables are created/extended by Hibernate (`ddl-auto=update`). New nullable columns `category` and `image_url` are added to `product` automatically. Back up before the first deploy of a new version.

## Security model
- Sessions via an HttpOnly cookie; role `USER` or `ADMIN` is enforced **in the backend** (`SecurityConfig`). Default policy is deny.
- `POST/PUT/DELETE /api/products`, `/api/admin/**` and the `/services` console require ADMIN.
- JSON API CSRF defence: required `X-Requested-With` header + strict CORS + SameSite cookie. Server-rendered admin forms use Spring CSRF tokens.
- Not implemented: login rate-limiting / lockout, email verification, password reset.

### Known limitation: third-party cookies
Vercel (`*.vercel.app`) and Render (`*.onrender.com`) are different sites, so the session cookie is "third-party". Safari and some privacy browsers block this and login will appear to succeed but not persist. Fixes: use one custom domain for both (e.g. `app.example.com` + `api.example.com`) or proxy `/api` and `/uploads` through Vercel (add rewrites to `vercel.json` **before** the catch-all, set `VITE_API_URL` to empty, set `SESSION_COOKIE_SAME_SITE=lax`).

### Uploads
Render's disk is ephemeral: uploaded profile photos disappear on redeploy. Use object storage (S3/Cloudinary) for production.

## API overview
| Method & path | Access |
|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | public (`me` -> 401 when logged out) |
| `POST /api/auth/profile-image` | USER |
| `GET /api/products`, `GET /api/products/{id}` | public |
| `POST/PUT/DELETE /api/products[/{id}]` | ADMIN |
| `POST /api/admin/login`, `POST /api/admin/logout` | public / any |
| `GET /api/admin/dashboard`, `/api/admin/admins[/{id}]` (CRUD) | ADMIN |
| `GET /api/health`, `GET /api/health/db` | public |
