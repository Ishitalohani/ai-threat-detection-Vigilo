"""
©AngelaMos | 2026

ingest.py

Endpoints for pushing raw log lines and browser telemetry
into the Vigilo threat-detection pipeline.
"""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.api.deps import require_api_key

router = APIRouter(prefix="/ingest", tags=["ingest"])


class BatchIngestRequest(BaseModel):
    """
    Payload for bulk log line ingestion.
    """

    lines: list[str]


class BrowserTelemetryRequest(BaseModel):
    """
    Payload sent automatically by the deployed frontend.
    """

    path: str


@router.post(
    "/batch",
    status_code=200,
    dependencies=[Depends(require_api_key)],
)
async def ingest_batch(
    body: BatchIngestRequest,
    request: Request,
) -> dict[str, int]:
    """
    Push a batch of raw log lines into the pipeline queue.
    """
    pipeline = getattr(request.app.state, "pipeline", None)

    if pipeline is None:
        return {"queued": 0}

    queued = 0

    for line in body.lines:
        try:
            pipeline.raw_queue.put_nowait(line)
            queued += 1
        except asyncio.QueueFull:
            break

    return {"queued": queued}


@router.get("/telemetry", status_code=200)
async def browser_telemetry(
    path: str,
    request: Request,
) -> dict[str, int]:
    """
    Automatically receive browser route telemetry and convert
    it into the same Nginx-style log format used by Vigilo.
    """
    pipeline = getattr(request.app.state, "pipeline", None)

    if pipeline is None:
        return {"queued": 0}

    path = path[:2048]

    if not path.startswith("/"):
        path = "/" + path

    client_ip = request.headers.get(
        "x-forwarded-for",
        request.client.host if request.client else "127.0.0.1",
    ).split(",")[0].strip()

    user_agent = request.headers.get(
        "user-agent",
        "-",
    )

    log_line = (
        f'{client_ip} - - '
        f'[{datetime.now(timezone.utc).strftime("%d/%b/%Y:%H:%M:%S +0000")}] '
        f'"GET {path} HTTP/1.1" '
        f'200 0 '
        f'"-" '
        f'"{user_agent}"'
    )

    try:
        pipeline.raw_queue.put_nowait(log_line)
    except asyncio.QueueFull:
        return {"queued": 0}

    return {"queued": 1}