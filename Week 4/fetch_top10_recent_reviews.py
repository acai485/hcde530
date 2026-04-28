"""
Fetch app reviews from the HCDE 530 Week 4 API, pick the 10 most recent by date,
and save them to a CSV file.

API docs: https://brockcraft.github.io/docs/hcde530_api_documentation.html
"""

import csv
import json
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

BASE_URL = "https://hcde530-week4-api.onrender.com"
REVIEWS_PATH = "/reviews"
OUTPUT_CSV = Path(__file__).parent / "top_10_recent_reviews.csv"

FIELDNAMES = [
    "id",
    "app",
    "category",
    "rating",
    "review",
    "date",
    "helpful_votes",
    "verified_purchase",
]

# Load all reviews from the API
def fetch_all_reviews() -> list[dict]:
    """GET /reviews with a high limit so we can sort the full set by date locally."""
    params = urllib.parse.urlencode({"offset": 0, "limit": 500})
    url = f"{BASE_URL}{REVIEWS_PATH}?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data.get("reviews", [])

# Sort the reviews by date (newest to oldest)
def main() -> None:
    reviews = fetch_all_reviews()
    # Dates are YYYY-MM-DD; string sort matches chronological order. This is to ensure that the reviews are sorted by date in the correct order.
    # Tie-break on id so ordering is stable if two reviews share a date.
    sorted_reviews = sorted(
        reviews,
        key=lambda r: (r.get("date") or "", r.get("id") or 0),
        reverse=True,
    )
    # Find the most recent 10 reviews
    top_10 = sorted_reviews[:10]

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES, extrasaction="ignore")
        writer.writeheader()
        for row in top_10:
            writer.writerow({k: row.get(k, "") for k in FIELDNAMES})

    print(f"Wrote {len(top_10)} rows to {OUTPUT_CSV}")
    for r in top_10:
        print(f"{r.get('date')}  id={r.get('id')}  {r.get('app')}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as e:
        raise SystemExit(f"Request failed: {e}") from e
