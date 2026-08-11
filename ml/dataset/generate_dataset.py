import os
import csv
import random
import math
from datetime import datetime, timedelta

os.makedirs("ml/dataset", exist_ok=True)

start_date = datetime(2025, 1, 1)
num_days = 546  # 18 months

buildings = [
    {"name": "Engineering Block", "base_students": 1200, "base_kwh": 1850, "base_water": 24000, "base_waste": 420},
    {"name": "Science Block", "base_students": 950, "base_kwh": 1520, "base_water": 19500, "base_waste": 340},
    {"name": "Admin Block", "base_students": 300, "base_kwh": 920, "base_water": 8200, "base_waste": 140},
    {"name": "Student Hostel", "base_students": 1500, "base_kwh": 2100, "base_water": 45000, "base_waste": 680},
    {"name": "Central Library", "base_students": 600, "base_kwh": 1100, "base_water": 9500, "base_waste": 180},
]

random.seed(42)
rows = []

for day_idx in range(num_days):
    curr_date = start_date + timedelta(days=day_idx)
    is_weekend = curr_date.weekday() >= 5
    month = curr_date.month

    # Seasonal temperature in Kanpur (°C)
    if month in [5, 6]:
        temp = random.gauss(39, 2.5)
    elif month in [12, 1]:
        temp = random.gauss(14, 2.0)
    elif month in [7, 8, 9]:
        temp = random.gauss(32, 1.8)
    else:
        temp = random.gauss(26, 2.5)
    temp = round(temp, 1)

    for b in buildings:
        if b["name"] == "Student Hostel":
            student_factor = 0.9 if is_weekend else 1.0
        else:
            student_factor = 0.15 if is_weekend else random.uniform(0.85, 1.05)

        if month in [6, 1] and b["name"] != "Student Hostel":
            student_factor *= 0.4

        students = int(b["base_students"] * student_factor)

        if temp > 30:
            ac_hours = round(min(14.0, max(2.0, (temp - 25) * 0.7 + random.uniform(-1, 1))), 1)
        else:
            ac_hours = round(max(0.0, (temp - 18) * 0.3 + random.uniform(-0.5, 0.5)), 1)
        if is_weekend and b["name"] != "Student Hostel":
            ac_hours = round(ac_hours * 0.2, 1)

        solar_base = 380 if b["name"] in ["Engineering Block", "Science Block"] else 220
        solar_kwh = round(max(10.0, solar_base * (1 + (30 - abs(temp - 30))/100) + random.gauss(0, 25)), 1)

        elec_kwh = b["base_kwh"] * (0.4 + 0.6 * student_factor) + ac_hours * 65 + random.gauss(0, 35)
        elec_kwh = round(max(100.0, elec_kwh), 1)

        water_l = b["base_water"] * (0.3 + 0.7 * student_factor) + (temp * 120) + random.gauss(0, 500)

        # Anomaly injection (~1.5%)
        is_anomaly = random.random() < 0.015
        if is_anomaly:
            if random.random() < 0.5:
                elec_kwh = round(elec_kwh * 1.65, 1)
            else:
                water_l = round(water_l * 2.1, 1)
        water_l = round(max(500.0, water_l), 1)

        waste_kg = b["base_waste"] * (0.2 + 0.8 * student_factor) + random.gauss(0, 18)
        waste_kg = round(max(10.0, waste_kg), 1)

        rows.append({
            "date": curr_date.strftime("%Y-%m-%d"),
            "building": b["name"],
            "students_present": students,
            "temperature_c": temp,
            "ac_hours_per_day": ac_hours,
            "solar_generated_kwh": solar_kwh,
            "electricity_kwh": elec_kwh,
            "water_liters": water_l,
            "waste_kg": waste_kg
        })

# Inject 15 missing values intentionally to test data cleaning
missing_indices = random.sample(range(len(rows)), 15)
for idx in missing_indices[:8]:
    rows[idx]["temperature_c"] = ""
for idx in missing_indices[8:]:
    rows[idx]["solar_generated_kwh"] = ""

filepath = "ml/dataset/campus_sustainability_dataset.csv"
fieldnames = ["date", "building", "students_present", "temperature_c", "ac_hours_per_day", "solar_generated_kwh", "electricity_kwh", "water_liters", "waste_kg"]

with open(filepath, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {len(rows)} rows saved to {filepath}")
