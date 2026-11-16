# AccessGrid security review — 16 November 2026

Reviewed local backend routes, models, frontend authentication and production bundle. This is a source review plus local regression testing, not a guarantee against all attacks or a penetration test of a deployed host.

| Scenario | Finding and result |
|---|---|
| 1. Script in username | React renders text safely; no dangerous HTML sinks found in application source. Backend now rejects markup/control characters and validates lengths/types. Script and SQL login payloads tested. |
| 2. Change URL ID | Critical: APIs were public. Sessions now required; students only receive their own vehicles/logs; foreign vehicle IDs return 404. Stats derive identity and role from server authentication. |
| 3. Type /admin | Browser routing/profile state cannot authorize API access. Removed sessionStorage identity trust; /auth/me restores the server identity. Forged cookies and unauthenticated private routes tested. |
| 4. Browser API key | No service-key patterns found in scanned source/public/bundle files. No backend secrets are deliberately sent to browser. VITE variables are public; never place credentials there. |
| 5. Prompt injection | No LLM/chat/prompt execution endpoints in this project. OCR output is treated as plate data, never instructions or executable SQL. |
| 6. Admin at sign-up | Critical: public role assignment removed. Only an authenticated administrator can provision accounts. First admin is created using a local CLI. |
| 7. Edited price | No pricing/cart endpoints. Analogous gate/category/owner input is validated; visitor gate entries always create Visitor records. |
| 8. Fake payment | No payment/provider/webhook integration. No payment-security claim made. |
| 9. Redeem repeatedly | No redemption feature. Replayed/concurrent gate changes use conditional database updates and return 409 without duplicate logs. |
| 10. Negative quantity | No cart quantities. Log limits now require integer 1–1000; invalid plates, IDs, roles and malformed JSON rejected. |
| 11. Guess login code | No OTP feature. Login throttled per IP (10/15min) and username (20/15min); passwords hashed. Production rejects short demo credentials. |
| 12. Not-a-photo | Both recognition routes decode/verify JPEG/PNG contents, reject SVG/text, cap input at 8MB and 12MP, reject animation, strip metadata by converting to RGB. No user filenames saved. |
| 13. .env in git | .env and database patterns already ignored; no backend .env exists locally. This folder has no .git, so historical GitHub secret leakage was NOT verified. |
| 14. AI endpoint x10k | Recognition requires admin/security role and is limited to 10 requests/min per account. General API capped at 300/min/IP. SQLite counters persist across workers/restarts on one host. |
| 15. Query database | SQLAlchemy parameterized queries retained; wildcard OCR matching removed. No raw SQL constructed from request data. Rate-limit SQL uses bound parameters. Database/network infrastructure was not externally probed. |

## Additional fixes

CSRF synchronizer token required for every state-changing API request, including login; frontend sends it automatically. Session cookies are HttpOnly/SameSite=Lax, expire after 8 hours and become Secure in production. Wildcard credentialed CORS removed (same-origin default). Generic errors prevent SQL exception leaks. Flask debug disabled and local runner binds loopback. Demo shortcuts only run in Vite development mode; live login has no prefilled demo credentials/role picker.

## Before deployment

1. Set ACCESSGRID_PRODUCTION=1 and a unique SECRET_KEY of at least 32 random characters; startup fails for missing/known default production secret. Keep it consistent across workers. Development generates a random ephemeral key, so restart signs users out.
2. Use HTTPS and a production WSGI/reverse proxy. Serve frontend and /api from the same origin; Vite's proxy exists only during development. If origins differ, explicitly configure CORS_ORIGINS and verify cookies/CSRF in that deployment.
3. Create strong campus accounts via `flask --app run create-user`. Existing seeded passwords are weak: production login rejects passwords shorter than 12. Do not run seed.py on real data (it deletes records); it now refuses production mode. No existing passwords/data were changed by this audit.
4. Keep database ports private, restrict filesystem access to the database/rate-limit files, back up records, and keep OS, Python and OCR/model dependencies patched. Review actual GitHub history and rotate any exposed credentials; local absence does not prove history clean.
5. Rate limiter is single-host SQLite; multiple hosts require a shared Redis/database limiter or ingress rate limits. Do not blindly trust forwarded client IP headers. Add ingress body/concurrency/time limits for costly OCR. The unauthenticated CSRF endpoint is rate limited, but volumetric DDoS requires infrastructure controls.
6. Signed cookie logout clears the browser cookie; a previously stolen signed cookie may remain valid until its eight-hour expiry. Central session revocation/MFA and password reset are future work for higher-assurance deployment.

## Validation

15 automated Flask security regression tests pass using a separate in-memory database and temporary rate-limit storage. Valid image recognition is stubbed; live YOLO/Tesseract accuracy is not tested. Tests do not modify the existing campus database. Frontend build and lint checks are recorded in the delivery response. Secret scan used common service/private-key patterns and is not a full secret scanner. Graphify CLI was unavailable, so route tracing used source inspection.

Implementation follows Flask's session/CSRF/resource guidance: https://flask.palletsprojects.com/en/stable/web-security/

Frontend dependency remediation: compatible package updates plus PWA plugin 1.1.0 and explicit transitive overrides resolved the reported advisories. Final npm install audited 429 packages with zero reported vulnerabilities. Final frontend production build and ESLint passed; 15 backend security tests passed again after all code changes. A full Python/OS/model dependency advisory audit and external host scan were not performed.
