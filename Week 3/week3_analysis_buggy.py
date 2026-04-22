import csv
from pathlib import Path

# Load the survey data from a CSV file
filename = Path(__file__).with_name("week3_survey_messy.csv")
rows = []

with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

# Count responses by role
# Normalize role names so "ux researcher" and "UX Researcher" are counted together
role_counts = {}

for row in rows:
    role = row["role"].strip().title()
    if role in role_counts:
        role_counts[role] += 1
    else:
        role_counts[role] = 1

print("Responses by role:")
for role, count in sorted(role_counts.items()):
    print(f"  {role}: {count}")

# Calculate the average years of experience
total_experience = 0
valid_count = 0
for row in rows:
# read each row in the experience_years column and remove any spaces
    raw = row["experience_years"].strip()
# Check if the row is empty and if so, continue on and skip the row
    if not raw:
        continue
# Attempt to convert the experience years to an integer
    try:
        years = int(raw)
# If the conversion fails, continue on and skip the row
    except ValueError:
        continue
# Add the years to the total
    total_experience += years
# Adds one valid row to the count
    valid_count += 1
# Calculate the average years of experience only using valid rows
avg_experience = total_experience / valid_count
print(f"\nAverage years of experience: {avg_experience:.1f}")

# Find the top 5 highest satisfaction scores
scored_rows = []
# Loops through each survey row one by one
for row in rows:
# Filters through and only keeps rows where the satisfaction_score column is not empty
    if row["satisfaction_score"].strip():
# Adds the participant name and satisfaction score to the scored_rows list
        scored_rows.append((row["participant_name"], int(row["satisfaction_score"])))
# Sorts the scored_rows list by the satisfaction score in descending order
scored_rows.sort(key=lambda x: x[1], reverse=True)
# Extracts the top 5 satisfaction scores from the scored_rows list
top5 = scored_rows[:5]

print("\nTop 5 satisfaction scores:")
for name, score in top5:
    print(f"  {name}: {score}")

def average_satisfaction_by_role_no_dict(rows):
    """Returns a list of (role, average_score) tuples."""
    roles = []
    totals = []
    counts = []

    for row in rows:
        role = row["role"].strip().title()
        raw_score = row["satisfaction_score"].strip()

        if not raw_score:
            continue

        try:
            score = int(raw_score)
        except ValueError:
            continue

        if role in roles:
            i = roles.index(role)
            totals[i] += score
            counts[i] += 1
        else:
            roles.append(role)
            totals.append(score)
            counts.append(1)

    averages = []
    for i in range(len(roles)):
        avg = totals[i] / counts[i]
        averages.append((roles[i], avg))

    return averages

print("\nAverage satisfaction by role:")
for role, avg in sorted(average_satisfaction_by_role_no_dict(rows)):
    print(f"  {role}: {avg:.2f}")

# Write analysis results to CSV
output_path = Path(__file__).with_name("week3_analysis_output.csv")
with open(output_path, "w", newline="", encoding="utf-8") as out:
    writer = csv.writer(out)
    writer.writerow(["section", "name", "value"])
    for role, count in sorted(role_counts.items()):
        writer.writerow(["role_distribution", role if role else "(blank)", count])
    writer.writerow(["summary", "average_years_experience", f"{avg_experience:.1f}"])
    for name, score in top5:
        writer.writerow(["top_satisfaction", name, score])
    for role, avg in sorted(average_satisfaction_by_role_no_dict(rows)):
        writer.writerow(["avg_satisfaction_by_role", role if role else "(blank)", f"{avg:.2f}"])