FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NETGUARD_INGEST_CONTRACTS_DIR=/app/contracts/kafka \
    NETGUARD_INGEST_OUTPUT_DIR=/data/output

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY netguard_ingest ./netguard_ingest
# The shared FlowEvent schema lives outside this module; compose passes the
# repository's contracts/kafka directory as the named build context "contracts".
COPY --from=contracts flow-event.v1.schema.json ./contracts/kafka/

RUN useradd --system --uid 10001 --home-dir /app ingest \
    && mkdir -p /data/input /data/output \
    && chown ingest /data/output
USER ingest

ENTRYPOINT ["python", "-m", "netguard_ingest"]
# Default: import every capture mounted at /data/input.
CMD ["pcap", "/data/input"]
