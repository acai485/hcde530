# Imports
# Make a call to TMDB, parse JSON, read local .env files, and write reports.
# I had trouble importing the pandas library to my computer, so cursor helped me create a virtual environment as a workaround.
# Pandas is imported next; if it is missing, the error text tells you to use the Week 5 virtual environment.

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

try:
    import pandas as pd
except ModuleNotFoundError:
    _root = Path(__file__).resolve().parent
    _venv_py = _root / ".venv" / "bin" / "python"
    raise SystemExit(
        "pandas is not available for this interpreter.\n\n"
        "Use the Week 5 virtual environment (create it once if needed):\n"
        f"  cd {_root}\n"
        f"  python3 -m venv .venv && .venv/bin/pip install pandas\n\n"
        "Then either activate and run:\n"
        "  source .venv/bin/activate\n"
        "  python week5_tmdb_pandas.py\n\n"
        "Or run with the venv Python directly:\n"
        f"  {_venv_py} {Path(__file__)}"
    )

#TMDB base URL
# Every API request in this script starts with this address plus a path.

BASE_URL = "https://api.themoviedb.org/3"


# Load secrets from disk
# TMDB expects an API key on each request. The key is loaded from the .env so that it is not pasted into code.


def _load_dotenv() -> None:
    # Try Week 5 first, then Week 4, so you can reuse the same .env file from last week if you want.
    for env_path in (
        Path(__file__).parent / ".env",
        Path(__file__).parent.parent / "Week 4" / ".env",
    ):
        if not env_path.is_file():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            # Skip blank lines, comments, and lines that are not KEY=value.
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key, value = key.strip(), value.strip().strip('"').strip("'")
            # Do not override something you already set in the terminal (useful for quick tests).
            if key and key not in os.environ:
                os.environ[key] = value


# --- Get the TMDB API key from the environment ---
# After .env is loaded into os.environ, this function checks for TMDB_API_KEY (name chosen by TMDB).


def _api_key() -> str:
    _load_dotenv()
    key = os.environ.get("TMDB_API_KEY", "").strip()
    if not key:
        # Stop the program with a friendly message instead of a confusing error later.
        raise SystemExit(
            "Missing TMDB_API_KEY. Add it to Week 5/.env (or Week 4/.env) as "
            "TMDB_API_KEY=your_key, or export TMDB_API_KEY in your shell."
        )
    return key


# Call the TMDB HTTP API
# Builds a URL with the API key, sends a GET request, and returns the JSON as a Python dictionary.


def fetch_tmdb(path: str, extra_params: dict[str, str] | None = None) -> dict:
    """
    GET a TMDB v3 JSON endpoint.

    path: starts with '/', e.g. '/movie/popular' or '/search/movie'.
    extra_params: merged into the query string (api_key is added automatically).
    """
    # TMDB expects api_key=... on every request; you can add page=, language=, etc. in extra_params.
    params: dict[str, str] = {"api_key": _api_key()}
    if extra_params:
        params.update(extra_params)
    qs = urllib.parse.urlencode(params)
    url = f"{BASE_URL}{path}?{qs}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    # timeout=60 means "give up if the server is silent for 60 seconds" (seconds, not minutes).
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


# Turn one TMDB JSON "list" into a pandas table

def results_to_dataframe(payload: dict) -> pd.DataFrame:
    """Turn a TMDB list response into a DataFrame (empty if no results)."""
    return pd.DataFrame(payload.get("results", []))


# Download "trending today" for both movies and TV

def trending_all_usable(max_pages: int = 2) -> pd.DataFrame:
    """Trending movies + TV; multiple pages give more rows to explore."""
    parts: list[pd.DataFrame] = []
    for page in range(1, max_pages + 1):
        payload = fetch_tmdb("/trending/all/day", {"page": str(page)})
        chunk = results_to_dataframe(payload)
        if chunk.empty:
            break
        parts.append(chunk)
    if not parts:
        return pd.DataFrame()
    # Stack the pages on top of each other and renumber row indexes.
    return pd.concat(parts, ignore_index=True)


# US "where to watch" and genre names (used for Question 3 in my MP1 declaration)

WATCH_REGION = "US"


def _genre_lookup() -> dict[int, str]:
    """Ask TMDB for movie and TV genre lists, then merge into one id → name map."""
    names: dict[int, str] = {}
    for payload in (
        fetch_tmdb("/genre/movie/list"),
        fetch_tmdb("/genre/tv/list"),
    ):
        for g in payload.get("genres", []):
            names[int(g["id"])] = str(g["name"])
    return names


def _us_providers_for_title(media_type: str, tmdb_id: int) -> list[tuple[int, str]]:
    """
    For one movie or TV id, return distinct US providers (subscription, free, ads, rent).
    TMDB returns separate arrays; we flatten and dedupe by provider_id.
    """
    path = (
        f"/movie/{tmdb_id}/watch/providers"
        if media_type == "movie"
        else f"/tv/{tmdb_id}/watch/providers"
    )
    data = fetch_tmdb(path)
    us = (data.get("results") or {}).get(WATCH_REGION)
    if not us:
        return []
    out: list[tuple[int, str]] = []
    seen: set[int] = set()
    for key in ("flatrate", "free", "ads", "rent"):
        for p in us.get(key) or []:
            pid = p.get("provider_id")
            pname = (p.get("provider_name") or "").strip()
            if pid is None or not pname:
                continue
            pid = int(pid)
            if pid not in seen:
                seen.add(pid)
                out.append((pid, pname))
    return out


def watch_provider_exploded(trending: pd.DataFrame) -> pd.DataFrame:
    """
    Build a table with one row per (trending title, US provider).
    Requires one watch/providers request per title (cannot be vectorized on one HTTP call).
    """
    mask = trending["media_type"].isin(["movie", "tv"]) & trending["id"].notna()
    base = trending.loc[mask, ["id", "media_type", "vote_average"]].copy()
    base["id"] = base["id"].astype(int)
    records: list[dict] = []
    for row in base.itertuples(index=False):
        va = float(row.vote_average or 0)
        for pid, pname in _us_providers_for_title(str(row.media_type), int(row.id)):
            records.append(
                {
                    "tmdb_id": int(row.id),
                    "media_type": row.media_type,
                    "vote_average": va,
                    "provider_id": pid,
                    "provider_name": pname,
                }
            )
    return pd.DataFrame.from_records(records)


def print_question3_genre_by_platform(
    trending: pd.DataFrame,
    prov_df: pd.DataFrame,
    genre_names: dict[int, str],
    provider_counts: pd.Series,
) -> None:
   
    print("\n========== Question 3: best genre per platform ==========\n")

    # Series view of id → name so each row's genre_id can be mapped with .map().
    genre_series = pd.Series(genre_names)

    # genre_ids is a list per title; explode turns it into one row per genre for that title.
    t_base = (
        trending[["id", "media_type", "vote_average", "genre_ids"]]
        .rename(columns={"id": "tmdb_id"})
        .explode("genre_ids", ignore_index=True)
        .dropna(subset=["genre_ids"])
        .assign(genre_id=lambda d: d["genre_ids"].astype(int))
    )
    # If TMDB ever returns an id we did not map, show the number as text instead of dropping the row.
    t_base["genre_name"] = t_base["genre_id"].map(genre_series).fillna(t_base["genre_id"].astype(str))

    # Match title+genre rows to title+provider rows (same tmdb_id and media_type).
    gdf = prov_df.merge(
        t_base[["tmdb_id", "media_type", "genre_id", "genre_name"]],
        on=["tmdb_id", "media_type"],
        how="inner",
    )

    print(
        "Question: On each platform, which genre has the highest average rating, and does the "
        "top genre differ meaningfully between platforms?\n"
    )
    print(
        "How its computed: explode genre_ids → merge with provider table → groupby "
        "(provider_name, genre_name) → keep groups with enough rows → idxmax of mean rating per provider.\n"
    )

    if gdf.empty:
        print("No rows to analyze (missing genre_ids or no overlap with US provider data).\n")
        return

    # Ignore tiny samples so one movie does not define the "top genre" for a service.
    min_rows = 3
    top_k = 20
    top_providers = provider_counts.head(top_k).index

    by_pg = (
        gdf.loc[gdf["provider_name"].isin(top_providers)]
        .groupby(["provider_name", "genre_name"], as_index=False)
        .agg(mean_rating=("vote_average", "mean"), n=("vote_average", "count"))
    )
    by_pg = by_pg[by_pg["n"] >= min_rows]

    print("--- Table: mean vote_average and row count per (platform, genre) after filters ---")
    print(by_pg.to_string(index=False))
    print()

    if by_pg.empty:
        print("No platform had enough rows (min_rows) to name a reliable top genre.\n")
        return

    # For each provider, pick the single genre row with the highest mean_rating.
    winners_df = by_pg.loc[by_pg.groupby("provider_name")["mean_rating"].idxmax()]

    print("--- Top genre per platform ---")
    for row in winners_df.itertuples(index=False):
        print(
            f"  {row.provider_name}: best genre {row.genre_name!r} "
            f"(mean vote_average {row.mean_rating:.2f}; n={int(row.n)} title–genre rows)"
        )
    print()

    if len(winners_df) >= 2:
        unique_genres = set(winners_df["genre_name"].astype(str))
        if len(unique_genres) > 1:
            print(
                f"Across these platforms, the winning genre name is not the same everywhere "
                f"({len(unique_genres)} different genres). "
                "This is only for the current trending pull, not each app’s full library.\n"
            )
        else:
            print(
                "The same genre name is the winner for every platform listed above "
                "(still a small, day-to-day sample).\n"
            )


# Operations that give a quick overview of the dataset, including multiple operations from class.


def main() -> None:
    # df holds one row per trending title (movie or TV).
    df = trending_all_usable(max_pages=2)
    genre_names = _genre_lookup()
    prov_df = watch_provider_exploded(df)
    provider_counts = (
        prov_df["provider_name"].value_counts() if not prov_df.empty else pd.Series(dtype=int)
    )

    # Read the first and last few rows.
    print("--- head ---\n", df.head(), sep="")
    print("--- tail ---\n", df.tail(), sep="")
    # Column names, types, and how many non-empty values per column.
    print("--- info ---")
    df.info()
    # describe() focuses on numeric columns (ratings, vote counts, popularity, etc.).
    print("--- describe (numeric) ---\n", df.describe(), sep="")
    print("--- describe (all dtypes) ---\n", df.describe(include="all"), sep="")

    # Count missing values per column, then show the same thing as a percent of rows.
    null_counts = df.isnull().sum()
    print("--- isnull sum ---\n", null_counts, sep="")
    missing_pct = df.isnull().mean().mul(100).round(1)
    print("--- isnull % ---\n", missing_pct, sep="")

    # Count how many titles per original language.
    lang = "original_language"
    if lang in df.columns:
        lang_counts = df[lang].value_counts()
        print(f"--- value_counts ({lang}) ---\n", lang_counts, sep="")
        # dropna=False means "also show how many rows have a missing language if any."
        lang_counts_with_na = df[lang].value_counts(dropna=False)
        print(f"--- value_counts ({lang}, dropna=False) ---\n", lang_counts_with_na, sep="")

    # Keep only rows with user rating above 7.
    if "vote_average" in df.columns:
        high_rated = df[df["vote_average"] > 7.0]
        print("--- filter: vote_average > 7 ---\n", high_rated, sep="")
    # "&" means both conditions must be true (rating OK and enough people voted).
    if "vote_average" in df.columns and "vote_count" in df.columns:
        popular_and_ok = df[(df["vote_average"] > 6.5) & (df["vote_count"] > 100)]
        print(
            "--- filter: vote_average > 6.5 and vote_count > 100 ---\n",
            popular_and_ok,
            sep="",
        )

    # Average rating grouped by language; second line adds count and spread (std) per group.
    if lang in df.columns and "vote_average" in df.columns:
        by_lang = df.groupby(lang)["vote_average"]
        print("--- groupby mean ---\n", by_lang.mean(), sep="")
        print("--- groupby agg ---\n", by_lang.agg(["mean", "count", "std"]), sep="")

    print_question3_genre_by_platform(df, prov_df, genre_names, provider_counts)


# Program entry point
# Python sets __name__ to "__main__" only when you run this file directly (not when another file imports it).
if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        # TMDB sent back an error status (401 wrong key, 404 bad path, rate limit, etc.).
        detail = e.read().decode("utf-8", errors="replace")
        raise SystemExit(f"TMDB HTTP {e.code}: {detail}") from e
    except urllib.error.URLError as e:
        # No network, DNS failure, or other connection-level problem.
        raise SystemExit(f"Request failed: {e}") from e