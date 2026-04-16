import csv


INPUT_FILE = "responses.csv"
OUTPUT_FILE = "responses_cleaned.csv"


def is_name_empty(name_value: str) -> bool:
    return not (name_value or "").strip()


def clean_csv(input_file: str, output_file: str) -> None:
    with open(input_file, "r", newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        if reader.fieldnames is None:
            raise ValueError("Input CSV appears to have no header row.")

        with open(output_file, "w", newline="", encoding="utf-8") as outfile:
            writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
            writer.writeheader()

            for row in reader:
                if is_name_empty(row.get("name", "")):
                    continue

                if "role" in row and row["role"] is not None:
                    row["role"] = row["role"].capitalize()

                writer.writerow(row)


if __name__ == "__main__":
    clean_csv(INPUT_FILE, OUTPUT_FILE)
    print(f"Cleaned data written to {OUTPUT_FILE}")
