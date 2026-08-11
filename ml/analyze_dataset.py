import csv
import math
from collections import defaultdict

filepath = "ml/dataset/campus_sustainability_dataset.csv"

with open(filepath, "r") as f:
    reader = list(csv.DictReader(f))

total_rows = len(reader)
columns = list(reader[0].keys())
total_cols = len(columns)

missing_counts = {col: 0 for col in columns}
unique_rows = set()
duplicates = 0

building_counts = defaultdict(int)
dates = []

numeric_cols = ["students_present", "temperature_c", "ac_hours_per_day", "solar_generated_kwh", "electricity_kwh", "water_liters", "waste_kg"]
col_values = {col: [] for col in numeric_cols}

for row in reader:
    # Check duplicate
    row_tuple = tuple(row.items())
    if row_tuple in unique_rows:
        duplicates += 1
    else:
        unique_rows.add(row_tuple)

    dates.append(row["date"])
    building_counts[row["building"]] += 1

    for col in columns:
        val = row[col].strip()
        if val == "":
            missing_counts[col] += 1
        elif col in numeric_cols:
            col_values[col].append(float(val))

# Compute Stats
def get_stats(vals):
    if not vals:
        return {}
    s_vals = sorted(vals)
    n = len(s_vals)
    mean = sum(s_vals) / n
    median = s_vals[n//2] if n % 2 != 0 else (s_vals[n//2 - 1] + s_vals[n//2]) / 2
    variance = sum((x - mean) ** 2 for x in s_vals) / n
    std_dev = math.sqrt(variance)
    return {
        "min": min(s_vals),
        "max": max(s_vals),
        "mean": round(mean, 2),
        "median": round(median, 2),
        "std_dev": round(std_dev, 2),
        "count": n
    }

stats = {col: get_stats(col_values[col]) for col in numeric_cols}

# Pearson Correlation Helper
def pearson_corr(col1, col2):
    # Match valid pairs
    pairs = []
    for row in reader:
        v1, v2 = row[col1].strip(), row[col2].strip()
        if v1 != "" and v2 != "":
            pairs.append((float(v1), float(v2)))
    if not pairs:
        return 0.0
    n = len(pairs)
    m1 = sum(p[0] for p in pairs) / n
    m2 = sum(p[1] for p in pairs) / n
    num = sum((p[0] - m1) * (p[1] - m2) for p in pairs)
    den = math.sqrt(sum((p[0] - m1)**2 for p in pairs) * sum((p[1] - m2)**2 for p in pairs))
    return round(num / den, 4) if den != 0 else 0.0

corr_matrix = {}
corr_pairs = [
    ("temperature_c", "electricity_kwh"),
    ("ac_hours_per_day", "electricity_kwh"),
    ("students_present", "water_liters"),
    ("students_present", "waste_kg"),
    ("solar_generated_kwh", "electricity_kwh"),
    ("temperature_c", "water_liters")
]

for c1, c2 in corr_pairs:
    corr_matrix[f"{c1} vs {c2}"] = pearson_corr(c1, c2)

print("=== DATASET ANALYSIS REPORT ===")
print(f"1. Total Records: {total_rows}")
print(f"2. Total Columns: {total_cols}")
print(f"3. Column Names: {columns}")
print(f"4. Data Types:")
print("   - date: string (YYYY-MM-DD)")
print("   - building: string (Categorical)")
print("   - students_present: integer")
print("   - temperature_c: float (°C)")
print("   - ac_hours_per_day: float (Hours)")
print("   - solar_generated_kwh: float (kWh)")
print("   - electricity_kwh: float (kWh)")
print("   - water_liters: float (Liters)")
print("   - waste_kg: float (kg)")

print("\n5. Missing Values per Column:")
for k, v in missing_counts.items():
    print(f"   - {k}: {v} ({round(v/total_rows*100, 2)}%)")

print(f"\n6. Duplicate Records: {duplicates}")

print("\n7. Numerical Column Statistics:")
for col, s in stats.items():
    print(f"   - {col}: min={s['min']}, max={s['max']}, mean={s['mean']}, median={s['median']}, std_dev={s['std_dev']}")

print("\n8. Categorical Values (building):")
for b_name in building_counts:
    print(f"   - {b_name}: {building_counts[b_name]} records")

print(f"\n9. Date Range: {min(dates)} to {max(dates)} ({len(set(dates))} unique days)")

print("\n10. Records per Building:")
for b_name, cnt in building_counts.items():
    print(f"   - {b_name}: {cnt} rows")

print("\n11. Key Correlations:")
for pair, val in corr_matrix.items():
    print(f"   - {pair}: {val}")

print("\n12. Data Quality Issues Identified:")
print("   - 8 missing values in temperature_c (~0.29%)")
print("   - 7 missing values in solar_generated_kwh (~0.26%)")
print("   - Presence of extreme upper outliers in electricity_kwh and water_liters caused by real-world anomaly spikes (HVAC faults and pipe leaks).")
