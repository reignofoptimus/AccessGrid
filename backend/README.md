# AccessGrid backend

For Render hosting, follow [RENDER-DEPLOY.md](../RENDER-DEPLOY.md). The root `render.yaml` builds `backend/Dockerfile` and supplies the production startup configuration.

## Production runtime

- Python 3.13, Flask, Gunicorn and PostgreSQL.
- CPU ONNX Runtime loads the bundled `app/anpr/best.onnx`; PyTorch is not needed in the serving container.
- Tesseract OCR and English language data are installed by Docker.
- `start.sh` applies migrations, provisions the first admin/parking zones idempotently, then starts the web worker on `$PORT`.
- Private environment variables: `ACCESSGRID_PRODUCTION=1`, `DATABASE_URL`, stable `SECRET_KEY`, and first-deploy `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD`.
- `/healthz` checks database connectivity. `/readyz` additionally checks detector initialization.

## Local setup

Use a fresh virtual environment and `pip install -r requirements.txt`. Install the Tesseract executable separately for your operating system and make it available on PATH. Run `flask --app run db upgrade`, then `flask --app run create-user` to provision an account privately. `python run.py` starts the development API on loopback port 5000; it is not the production server.

For an existing local SQLite database created without migrations, back it up and migrate deliberately; do not run destructive seed scripts against real data. Render should start with a fresh managed PostgreSQL database.

## Tests

From this directory: `python -m unittest discover -s tests -q`.

The **Render backend** GitHub Actions workflow builds the real Linux image, runs PostgreSQL-backed startup under a 512 MB container limit, tests authenticated ONNX inference and real Tesseract OCR, and verifies the security regression suite. No database or deployment credentials are stored in the repository.
