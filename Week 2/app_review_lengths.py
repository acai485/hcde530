import csv
from pathlib import Path

# Load the CSV file.
csv_path = Path(__file__).parent / "app_reviews_data.csv"
word_counts = []


print(f"{'Review ID':<10} {'Words':<6} Review")
print("-" * 72)

#
with open(csv_path, newline="", encoding="utf-8") as file:
    reader = csv.DictReader(file)
    for row in reader:
        review_id = row["review_id"]
        review_text = row["review_text"]
        count = len(review_text.split())
        word_counts.append(count)
        print(f"{review_id:<10} {count:<6} {review_text}")

print("\nSummary")
print(f"Shortest review: {min(word_counts)} words")
print(f"Longest review: {max(word_counts)} words")
print(f"Average length: {sum(word_counts) / len(word_counts):.1f} words")
