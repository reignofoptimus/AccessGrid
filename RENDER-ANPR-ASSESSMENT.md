> Historical assessment: its deployment blockers were subsequently addressed. See [RENDER-DEPLOY.md](RENDER-DEPLOY.md) for the implemented, Linux-tested setup.

# Render ANPR readiness assessment — 17 November 2026

Assessment only; application source and deployment settings were not changed.

## Verdict

Render can host this Flask backend and its plate-recognition pipeline. Current source is not ready for a clean Render deploy. The free instance is a plausible target after optimization, not a verified runtime: no Linux/512MB inference benchmark or real OCR accuracy test was possible with the installed environment.

## Verified locally

- `backend/app/anpr/best.pt` exists, 6,249,386 bytes. ZIP/pickle metadata was inspected without executing the checkpoint. It identifies Ultralytics 8.4.21, detection architecture using YOLOv8 components, a license_plate class and training image size 640.
- Backend venv has OpenCV, NumPy, pytesseract and Pillow; it lacks torch, ultralytics, onnxruntime and onnx. Tesseract was absent from PATH and the configured Windows install location. Docker was not available on PATH.
- Earlier fresh-install dry run failed because requirements.txt has malformed/mixed encoding. Existing-venv security tests do not validate a clean install or actual recognition.
- Detector uses a repository-relative weight path, which is appropriate on Linux. The Windows Tesseract override is conditional; Linux needs the binary on PATH.
- Recognition imports lazily on first scan. Missing YOLO or weights results in model=None; callers then receive HTTP 200 with a null plate. Runtime errors are similarly swallowed.
- Current pipeline takes the first detected box, adds padding and enlarges its crop 4x on both axes. A large/false-positive box can produce a huge OCR image. Upload validation allows up to 12MP; an almost full-image crop becomes almost 192MP after resizing.
- Tesseract has no explicit subprocess timeout. No inference concurrency lock is present. Frontend requests time out at 12 seconds, shorter than Render's documented roughly one-minute free cold start.

## Recommended free-demo deployment

Vercel frontend -> same-origin /api reverse proxy -> Render Docker backend -> managed PostgreSQL.

Deploy one inference process. Export best.pt to best.onnx in an isolated development/export environment using a compatible pinned Ultralytics version, initially 8.4.21, and CPU PyTorch. Pin and verify the resulting exporter/runtime combination. Use ONNX Runtime CPU directly in the serving image; invoking ONNX through Ultralytics still retains its dependency stack and does not achieve the intended slim runtime.

Implement correct letterboxing, input normalization, output decoding, confidence thresholding, nonmaximum suppression and mapping detections back to original image coordinates. Compare boxes and recognized plates against the existing PyTorch implementation on actual sample images. ONNX is a recommendation requiring validation, not an exported or measured artifact today.

Serving Python packages: the Flask/SQLAlchemy/Login/Migrate/CORS stack, gunicorn, python-dotenv, psycopg2-binary, Pillow, numpy, opencv-python-headless, pytesseract and onnxruntime, all with a tested lock/pin set. The export environment additionally requires compatible CPU torch/torchvision, ultralytics and ONNX export dependencies; do not install the training/export environment into the serving image.

System packages: tesseract-ocr and English language data plus required shared libraries in a slim Linux image. Keep OpenCV headless. Set a writable cache/config directory where needed. Bundle the trained model in the Docker build; do not download weights at each cold start. GPU/CUDA is unnecessary for this low-traffic CPU demo.

## Required code/config work

1. Rewrite requirements.txt as normal UTF-8 and validate a clean Linux installation. Select a compatible Python version (for example a tested Python 3.11 image), pin versions, add Dockerfile, .dockerignore and Render settings.
2. Implement the selected detector runtime. Return an explicit service-unavailable response if model/OCR dependencies cannot load; distinguish no detections from service failure. Add a health/readiness endpoint without invoking OCR on every check.
3. Bound decoded image dimensions and input resolution; cap plate-crop dimensions before OCR rather than unconditional 4x resizing. Choose image sizes based on measured accuracy, starting around model training resolution 640. Reject invalid/empty crops and select a suitable high-confidence detection.
4. Add an OCR timeout (e.g. 5–10 seconds after measuring), limit inference threads, and serialize recognition within the single worker. Limit upload size and provide clear 429/503 responses for overloaded/unavailable service. Existing auth, CSRF and per-account rate limits stay enabled.
5. Use Gunicorn bound to 0.0.0.0:$PORT with one worker. A candidate starting point is `gunicorn run:app --bind 0.0.0.0:$PORT --workers 1 --threads 2 --timeout 120`; tune after tests, with an inference lock so scans do not overlap. Do not run Flask's development runner publicly.
6. Configure ACCESSGRID_PRODUCTION=1, a stable random SECRET_KEY, and DATABASE_URL using a compatible postgresql:// connection string. Use a long-lived database; Render free Postgres expires after 30 days. SQLite records and rate-limit counters reset with ephemeral storage. For a disposable single-instance resume demo, explicitly accepting counter resets is a limitation; durable/distributed throttling requires shared storage.
7. Apply migrations during a controlled startup/release step. Render Free has no shell/one-off jobs; provide an idempotent nonpublic bootstrap procedure or run provisioning through a secure local database connection. Provision an account without publishing passwords. Do not run the destructive seed script on restart. Initialize parking zones separately: migrations only create their table.
8. Configure the Vercel /api external rewrite to Render and leave frontend API base as /api. This fits current SameSite=Lax cookies. Direct vercel.app -> onrender.com cookie requests are cross-site and are not a drop-in substitute.
9. Add backend-waking feedback and a longer GET readiness timeout/retry before sign-in. Do not automatically replay state-changing gate requests after an ambiguous timeout. The existing 12-second timeout can fail on cold start even when Render is working normally.
10. Provide safe synthetic demo access for recruiters; production disables ?demo browser-only shortcuts. Use limited capabilities/sample records rather than publish a real administrator credential. Include a few consented or synthetic plate sample images for recognition testing.

## Alternatives

- Direct .pt inference: less detector rewrite, but requires CPU torch/torchvision + Ultralytics + OCR and has a larger memory baseline. Try only with a measured runtime; a 6MB checkpoint does not imply a 6MB process. A paid 512MB instance does not resolve a 512MB memory issue; select more RAM if measurements demand it.
- ONNX CPU: recommended first attempt for free low-traffic hosting; preserves the trained model while avoiding the PyTorch serving dependency. Peak memory must still be tested including Flask, image decoding and the Tesseract child process.
- Static/read-only UI preview with a recorded recognition example: fallback if free compute fails; label it clearly. This is not a live ANPR demo.

## Acceptance tests before claiming deployed

Build and boot a clean Linux container; run migrations/provisioning against a separate PostgreSQL database; enforce a 512MB memory cap and inspect peak memory across cold model initialization and scans; test several real sample images and invalid files; test two simultaneous scans; verify OCR timeout/overload responses; confirm session and CSRF cookies through Vercel; test the first request after Render sleeps. If the process is killed or recognition quality regresses, adjust the runtime/input sizes or increase memory.

## Sources

- https://render.com/docs/free
- https://render.com/pricing
- https://render.com/docs/docker
- https://render.com/docs/web-services
- https://render.com/docs/ssh
- https://docs.ultralytics.com/modes/export/
- https://docs.ultralytics.com/quickstart/
- https://onnxruntime.ai/docs/get-started/with-python
- https://pypi.org/project/pytesseract/
