"""
Fetch app reviews from the HCDE 530 Week 4 API and export category + helpful votes.

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
PAGE_SIZE = 100
OUTPUT_CSV = Path(__file__).parent / "reviews_category_helpful_votes.csv"

# Creates a function to fetch a page of reviews from the API
def fetch_page(offset: int, limit: int) -> dict:
    params = urllib.parse.urlencode({"offset": offset, "limit": limit})
    url = f"{BASE_URL}{REVIEWS_PATH}?{params}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))

# Loop through each page of reviews and extract the category and helpful votes
def main() -> None:
    rows: list[tuple[str, int]] = []
    offset = 0

    while True:
        data = fetch_page(offset=offset, limit=PAGE_SIZE)
        reviews = data.get("reviews", [])
        for review in reviews:
            category = review.get("category", "")
            helpful = review.get("helpful_votes", 0)
            print(f"{category}\t{helpful}")
            rows.append((category, helpful))

        returned = data.get("returned", len(reviews))
        total = data.get("total", 0)
        offset += returned
        if offset >= total or returned == 0:
            break

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["category", "helpful_votes"])
        writer.writerows(rows)

    print(f"\nWrote {len(rows)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as e:
        raise SystemExit(f"Request failed: {e}") from e
