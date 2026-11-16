# AccessGrid
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users and purpose
Campus administrators manage registered vehicles and review parking and gate records. Security personnel look up plates, upload images for ANPR, and record entry or exit. Students view their own registered vehicle, history, and campus parking. The user confirmed equal design emphasis for all three roles.

## Mechanism and operating context
React/Vite UI calls Flask APIs. SQLAlchemy models represent users, vehicles, entry logs and parking zones. ANPR combines YOLO detection with Tesseract OCR. Existing content identifies FISAT campus. No verified geographic site plan is supplied.

## Constraints
Preserve the AccessGrid name, existing logo, role workflows and API data. The local preview uses explicitly labeled sample data and can run without a backend. Server sessions, CSRF, role authorization, student ownership filters and resource limits were added during the security review. Deployment configuration and remaining limitations are documented in SECURITY-REVIEW.md. No SSO, recovery-email service, live camera stream or per-space parking sensors exist in the supplied implementation.

## Confirmed direction latitude
The user authorized a substantial redesign, including a proper login page, and allowed removal of light mode. They chose direct implementation with browser-tested interactions over mockup approval. Original product facts come from the supplied code and README, not invented deployment claims.

## Principles
Make gate decisions clear. Keep personal and campus-wide views distinct. Identify demo data. Show errors and recovery actions. Preserve keyboard and small-screen access.
