"""
Extract data from The Movie Database (TMDB) API.

Create a key: https://www.themoviedb.org/settings/api
API docs: https://developer.themoviedb.org/reference/intro/getting-started
"""

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

# The main TMDB API address.
BASE_URL = "https://api.themoviedb.org/3"
OUTPUT_TXT = Path(__file__).parent / "tmdb_api_output.txt"

def _load_dotenv() -> None:
    # Find the .env file in the same folder as this script.
    env_path = Path(__file__).parent / ".env"
    if not env_path.is_file():
        # If there is no .env file, just keep going.
        return
    # Read the file line by line.
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        # Ignore empty lines, comments, or lines without "=".
        if not line or line.startswith("#") or "=" not in line:
            continue
        # Split into name and value at the first "=" sign.
        key, _, value = line.partition("=")
        # Clean up extra spaces and quotes.
        key, value = key.strip(), value.strip().strip('"').strip("'")
        # Do not overwrite a value that is already set in your terminal.
        if key and key not in os.environ:
            os.environ[key] = value


def _api_key() -> str:
    # Load values from .env, then check for TMDB_API_KEY.
    _load_dotenv()
    key = os.environ.get("TMDB_API_KEY", "").strip()
    if not key:
        # Stop with a clear message if the key is missing.
        raise SystemExit(
            "Missing TMDB_API_KEY. Add it to Week 4/.env as TMDB_API_KEY=your_key "
            "or export TMDB_API_KEY in your shell."
        )
    # Return the key if it exists.
    return key


def fetch_tmdb(path: str, extra_params: dict[str, str] | None = None) -> dict:
    """
    GET a TMDB v3 JSON endpoint.

    path: starts with '/', e.g. '/movie/popular' or '/search/movie'.
    extra_params: merged into the query string (api_key is added automatically).
    """
    # Start with the required API key.
    params: dict[str, str] = {"api_key": _api_key()}
    if extra_params:
        # Add any extra options like page, language, or search text.
        params.update(extra_params)
    # Build the full URL.
    qs = urllib.parse.urlencode(params)
    url = f"{BASE_URL}{path}?{qs}"
    # Send the request and ask for JSON back.
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        # Convert response to text, then to a Python dictionary.
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    # Get today's top trending movies, then keep the first 10.
    trending_movies = fetch_tmdb("/trending/movie/day").get("results", [])[:10]
    # Get today's top trending TV shows, then keep the first 10.
    trending_shows = fetch_tmdb("/trending/tv/day").get("results", [])[:10]

    # Get the top 20 highest-rated TV shows from TMDB.
    # This endpoint is sorted by vote average descending by default.
    top_rated_shows: list[dict] = []
    page = 1
    while len(top_rated_shows) < 20:
        data = fetch_tmdb("/tv/top_rated", {"page": str(page)})
        results = data.get("results", [])
        if not results:
            break
        top_rated_shows.extend(results)
        page += 1
    top_rated_shows = top_rated_shows[:20]

    # Build a readable text report with numbered lists.
    lines: list[str] = [
        "TMDB Report",
        "===========",
        "",
        "Top 10 Trending Movies (Today)",
        "-------------------------------",
    ]
    for i, movie in enumerate(trending_movies, start=1):
        title = movie.get("title") or "Unknown title"
        date = movie.get("release_date") or "Unknown date"
        lines.append(f"{i:02}. {title} (release date: {date})")

    lines.extend(["", "Top 10 Trending Shows (Today)", "------------------------------"])
    for i, show in enumerate(trending_shows, start=1):
        name = show.get("name") or "Unknown show"
        date = show.get("first_air_date") or "Unknown date"
        lines.append(f"{i:02}. {name} (first air date: {date})")

    lines.extend(["", "Top 20 Highest-Rated TV Shows", "-----------------------------"])
    for i, show in enumerate(top_rated_shows, start=1):
        name = show.get("name") or "Unknown show"
        score = show.get("vote_average")
        date = show.get("first_air_date") or "Unknown date"
        lines.append(f"{i:02}. {name} (rating: {score}, first air date: {date})")

    OUTPUT_TXT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote report to {OUTPUT_TXT}")


if __name__ == "__main__":
    # Run the script and show simple error messages if something fails.
    try:
        main()
    except urllib.error.HTTPError as e:
        # HTTP error means TMDB returned an error response.
        detail = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"TMDB HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        # URL error usually means internet or connection problems.
        raise SystemExit(f"Request failed: {e}") from e
