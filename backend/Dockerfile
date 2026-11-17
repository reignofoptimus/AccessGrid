FROM python:3.13-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1 MKL_NUM_THREADS=1 \
    MALLOC_ARENA_MAX=2 ACCESSGRID_PRODUCTION=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr tesseract-ocr-eng fonts-dejavu-core libgomp1 ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home --uid 10001 accessgrid
COPY --chown=accessgrid:accessgrid app ./app
COPY --chown=accessgrid:accessgrid migrations ./migrations
COPY --chown=accessgrid:accessgrid tools ./tools
COPY --chown=accessgrid:accessgrid tests ./tests
COPY --chown=accessgrid:accessgrid config.py run.py deploy_init.py gunicorn.conf.py start.sh ./
RUN test -s app/anpr/best.onnx && chmod +x start.sh
USER accessgrid
EXPOSE 10000
CMD ["/bin/sh", "/app/start.sh"]
