import json
import os
from typing import List, Optional

import httpx
import typer

app = typer.Typer(help="Legacy-friendly wrapper for the Encore resale API.")

API_BASE = os.getenv("API_BASE_URL", "http://localhost:8000")


def _post(endpoint: str, payload: dict, api_base: str) -> dict:
    url = f"{api_base.rstrip('/')}{endpoint}"
    response = httpx.post(url, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()


@app.command("scrape-vinted")
def scrape_vinted(
    user_ids: List[str] = typer.Option(
        ..., "-u", "--user-id", help="One or more Vinted user IDs"
    ),
    max_images: int = typer.Option(10, "-i", "--max-images", help="Image cap"),
    private_messages: bool = typer.Option(
        False,
        "-p",
        help=(
            "Legacy flag for private message scraping. Present for compatibility "
            "but intentionally non-functional."
        ),
    ),
    session_token: Optional[str] = typer.Option(
        None,
        "-s",
        "--session",
        help="Session tokens are not used for security reasons.",
    ),
    api_base: str = typer.Option(API_BASE, "--api-base", help="API base URL"),
):
    if private_messages:
        typer.echo(
            "-p detected: private message scraping is disabled in this educational build."
        )
    if session_token:
        typer.echo(
            "Session tokens are intentionally ignored. Authentication is out of scope."
        )

    payload = {"user_ids": user_ids, "max_images": max_images}
    data = _post("/scrape/vinted", payload, api_base)
    typer.echo(json.dumps(data, indent=2))


@app.command("scrape-depop")
def scrape_depop(
    usernames: List[str] = typer.Option(
        ..., "-u", "--username", help="One or more Depop usernames"
    ),
    download_files: bool = typer.Option(
        False,
        "-n",
        "--download-files",
        help="Legacy asset download flag. Informational only.",
    ),
    include_sold: bool = typer.Option(
        False, "-g", "--include-sold", help="Include sold listings"
    ),
    start_from_item: Optional[str] = typer.Option(
        None,
        "-b",
        "--begin-from",
        help="Legacy resume flag. Stored for logging only.",
    ),
    api_base: str = typer.Option(API_BASE, "--api-base", help="API base URL"),
):
    payload = {
        "usernames": usernames,
        "download_files": download_files,
        "include_sold": include_sold,
        "start_from_item": start_from_item,
    }
    data = _post("/scrape/depop", payload, api_base)
    typer.echo(json.dumps(data, indent=2))


if __name__ == "__main__":
    app()
