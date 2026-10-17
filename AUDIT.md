# BeautyKart – Audit & Fix Report

## 0. Read this first: what was and was NOT verified

| Area | Status |
|---|---|
| Frontend `npm install`, `npm run lint`, `npm run build` | **Run, passing** (0 lint errors; Vite build OK; no localhost URL or secret in the bundle) |
| Frontend API client (`src/api.js`) | **Tested, 11/11 pass** against a local mock HTTP server (success, 401 with message, non-JSON 502, empty body, server down, caller abort, required headers) |
| Backend compile / `mvnw test` / startup | **NOT RUN.** The sandbox cannot reach Maven Central (DNS blocked), so Spring dependencies could not be downloaded. Only a javac *parse* check was possible: no syntax errors; all 489 reported errors were "missing Spring/Jakarta dependency". This is **not** a type check. |
| New backend unit tests (`UserServiceTest`, `AdminServiceTest`) | **Written, NOT executed** |
| Integration flows (signup, login, me, logout, admin, CORS preflight, cart/checkout in a browser) | **NOT run** (needs the backend + MySQL). Verified by code review only. |
| Deployed Render/Vercel/Aiven | **Not accessed**; nothing was changed remotely. |

**Before pushing, run on your machine:** `cd Beautykart-backend; .\mvnw.cmd clean test`. If anything fails to compile, send me the first error – the most likely spots are `SecurityConfig.java` and `SessionAuthenticator.java` (Spring Security 6.1 API usage written without a compiler). The included GitHub Actions workflow will also run the same check on every push.

## 1. Confirmed bugs (from code)

### Critical
1. **Anyone could create/edit/delete products** – `POST/PUT/DELETE /api/products` had no authorization (`anyRequest().permitAll()`).
2. **Account takeover via signup** – signup bound the JSON straight into the `User` entity; a client-supplied `"userId": N` made `save()` overwrite existing user N (email + password).
3. **Admin APIs protected only by ad-hoc session flags**; Spring Security allowed everything, CSRF disabled, interceptor covered only legacy page paths.
4. **Admin dashboard returned raw entities** → BCrypt hashes of all admins and users sent to the browser.
5. **State changes via GET** in the admin console (`/deleteUser/{id}`, `/updatingUser/{id}` …) → triggerable cross-site (CSRF) with `SameSite=None` cookies.
6. **Admin "update user" stored the password unencoded/blank** (whole row overwritten) → affected users can no longer log in; also wiped profile image.
7. **Hardcoded default password `User@123`** in the legacy "Add user" form (and its submit button sat outside the `<form>`).

### High
8. `App.jsx`, `Login.jsx`, `Account.jsx`, `Profile.jsx`, `ProductDetails.jsx`, all admin pages hardcoded the **production** URL – local dev talked to production; env config was used by only 2 files.
9. No `vercel.json` → refreshing `/products/3` (any nested route) 404s on Vercel.
10. Session cookie forced `Secure; SameSite=None` in all environments (breaks plain-HTTP/Safari local dev); no session-id rotation on signup/admin login (fixation).
11. `Exceptions.java` `@ControllerAdvice` contained no `@ExceptionHandler` – it did nothing; failures leaked default error responses.
12. Duplicate email → ambiguous 400/409; no duplicate-phone check; no email-format check.
13. Home "+ Add" only incremented a local counter (never the real cart) and listed hardcoded fake products (ids 1-3, invented prices).
14. `addToCart` ignored the chosen quantity when the item already existed; cart lost on refresh.
15. Products/Details crashed on products with a null name; images/categories came from a hardcoded map for ids 1-6 only.
16. `pom.xml` had an invalid `<n>` element (should be `<name>`).
17. No request timeout in the UI (Render cold start ~50 s looked like an endless "Please wait…").
18. Three overlapping auth screens (Login / Signup / Account) with different behaviour; Signup navigated to `/login` with a message Login never displayed.

### Medium / Low
19. `DELETE` allowed removing the last admin or yourself. 20. Profile upload trusted the client Content-Type. 21. `@CrossOrigin` on one controller duplicating global CORS. 22. Test `contextLoads` needs live MySQL → `mvnw test` fails anywhere without it. 23. Admin dashboard showed "Product" for every product (wrong field names); Hinglish error strings. 24. Stale README from a template project. 25. `cookies.txt` (local JSESSIONID) in the project folder (never committed).

## 2. What changed
**Backend** – `SecurityConfig` (role rules ADMIN/USER, default deny, 401/403 JSON, CORS from `CORS_ALLOWED_ORIGINS`, CSRF on for server-rendered forms), new `SessionAuthenticator` (single sign-in path, session-id rotation), `ApiRequestHeaderFilter` (CSRF defence for the JSON API), `AuthController` (DTO signup, magic-byte image check), `SignupRequest`, `UserService`/`AdminService`/`ProductService` (validation, whitelisted updates, duplicate handling, last-admin protection), `ProductController`, `AdminController` (POST-only console actions, hash-free dashboard, admin logout), `AdminApiController`, `GlobalExceptionHandler` + `ConflictException`, `HealthController`, `Product` (+`category`, `imageUrl` nullable columns), `UserRepository.existsByUserNumber`, `application.properties` (env-driven, safe local defaults), `Dockerfile` (non-root, container-aware heap), `pom.xml`; removed `AdminSessionInterceptor`, `Exceptions`, `cookies.txt`, DB-dependent test; templates converted to POST/CSRF forms.
**Frontend** – `api.js` (single client: base URL, credentials, CSRF header, 60 s timeout, safe parsing), `AuthContext.jsx` (loading/authenticated/unauthenticated/error), all pages migrated, `productDisplay.js`, persistent `CartContext`, Home uses the real cart and real products, honest Checkout message, Profile photo upload, `vercel.json`, `.env.example`.
**Repo** – root `README.md`, `.github/workflows/ci.yml`.

## 3. Not implemented (deliberately)
- **Orders/payments**: no order API existed; adding order tables/pricing logic without being able to compile or test it on your production DB was too risky. Checkout now states plainly that nothing is saved or charged. Next feature to build: `Order`/`OrderItem` entities, backend price calculation from `Product.pprice`, authenticated `POST /api/orders`.
- Login rate-limiting/lockout, password reset, email verification.
- Cloud image storage (profile photos still use Render's ephemeral disk). `userNumber` stays `Long` (validated `[6-9]\d{9}`, so no leading-zero loss; avoids a column-type migration).
- React UI for product/user admin (the legacy console at `/services` still provides it; product REST is now admin-only).

## 4. Actions for you
1. **Deploy backend and frontend together.** The new backend rejects POST/PUT/DELETE without `X-Requested-With`, which only the new frontend sends.
2. Set the Render env vars (README table). `SESSION_COOKIE_SAME_SITE=none`, `SESSION_COOKIE_SECURE=true`, `CORS_ALLOWED_ORIGINS=https://beauty-kart-ashy.vercel.app`, `DB_URL` (with `?sslMode=REQUIRED`), `DB_USERNAME`, `DB_PASSWORD`, and `INITIAL_ADMIN_*` only if no admin exists. I did not see and never guessed any credential.
3. Render health check path `/api/health`; verify `/api/health/db` returns 200.
4. **Review live data** (issues 1, 2, 6 were exploitable on the deployed backend): check the `product` table for unexpected rows/edits, and the `user` table for unexpected changes. Users whose password hash does not start with `$2` need a manual reset, e.g. `SELECT user_id, user_email FROM user WHERE user_password NOT LIKE '$2%';` (verify table/column names first).
5. **Restart the Render service** after deploying (invalidates all existing sessions).
6. Secrets: none found in the ZIP or git history (DB password was always `${DB_PASSWORD}`). Nothing needs rotating on that evidence – but if the Aiven password was ever pasted into chat/screenshots/issues, rotate it. The local `JSESSIONID` in `cookies.txt` died when that server stopped.
7. Safari / privacy browsers: see README "third-party cookies" (custom domain or Vercel proxy).

## 5. GitHub steps (no force-push, no history rewrite)
```powershell
cd path\to\BeautyKart
git status
git checkout -b fix/audit-auth-security
# copy the fixed files over your working tree (or unzip this package into a clean folder and copy in)
git add -A
git status          # confirm no .env, node_modules, dist, target, uploads, cookies.txt
git commit -m "Fix auth, authorization, CORS/cookies, API client, cart; add CI and docs"
git push -u origin fix/audit-auth-security
# open a Pull Request, wait for the CI run, then merge
```
Render and Vercel redeploy from `main` after the merge.

## 6. Render / Vercel settings
**Render**: Web Service · Runtime Docker · Root Directory `Beautykart-backend` · Dockerfile `./Dockerfile` · Health Check `/api/health` · env vars per README.
**Vercel**: Root Directory `BeautyKart-frontend` · Framework Vite · Build `npm run build` · Output `dist` · env `VITE_API_URL=https://beautykart-7o7b.onrender.com`.

## 7. Verification checklist (to run after deploy)
- [ ] `GET /api/health` 200, `GET /api/health/db` 200
- [ ] Signup valid → 201 & logged in; invalid → 400; duplicate email/phone → 409
- [ ] Login good → 200; bad → 401 with message; `/api/auth/me` 200 logged in / 401 logged out; logout → `/me` 401
- [ ] Refresh `/profile` and `/products/1` on Vercel (no 404; session persists)
- [ ] `POST /api/products` without admin → 401, as USER → 403, as ADMIN → 201
- [ ] `/api/admin/dashboard` contains no `adminPassword`/`userPassword`
- [ ] CORS preflight from `https://beauty-kart-ashy.vercel.app` succeeds; from another origin fails
- [ ] Add to cart from Home and Products; refresh; quantities/total correct
