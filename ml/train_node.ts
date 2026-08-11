import fs from 'fs';
import path from 'path';

interface RawRow {
  date: string;
  building: string;
  students_present: number;
  temperature_c: number;
  ac_hours_per_day: number;
  solar_generated_kwh: number;
  electricity_kwh: number;
  water_liters: number;
  waste_kg: number;
}

interface ProcessedRow {
  date: string;
  building: string;
  // Features (X)
  students_present: number;
  temperature_c: number;
  ac_hours_per_day: number;
  solar_generated_kwh: number;
  lag_1_electricity: number;
  lag_7_avg_electricity: number;
  day_of_week: number;
  month: number;
  is_weekend: number;
  b_eng: number;
  b_sci: number;
  b_admin: number;
  b_hostel: number;
  b_library: number;
  // Target (y)
  next_day_electricity: number;
  // Metadata for evaluation
  current_electricity: number;
  water_liters: number;
  waste_kg: number;
}

// 1. Read Raw CSV
const csvPath = path.join(process.cwd(), 'ml', 'dataset', 'campus_sustainability_dataset.csv');
const rawContent = fs.readFileSync(csvPath, 'utf-8');
const lines = rawContent.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());

const rawRows: RawRow[] = [];

for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  const cols = lines[i].split(',').map(c => c.trim());
  rawRows.push({
    date: cols[0],
    building: cols[1],
    students_present: parseFloat(cols[2]),
    temperature_c: cols[3] === '' ? NaN : parseFloat(cols[3]),
    ac_hours_per_day: parseFloat(cols[4]),
    solar_generated_kwh: cols[5] === '' ? NaN : parseFloat(cols[5]),
    electricity_kwh: parseFloat(cols[6]),
    water_liters: parseFloat(cols[7]),
    waste_kg: parseFloat(cols[8]),
  });
}

console.log(`Loaded ${rawRows.length} raw rows from CSV.`);

// 2. Data Cleaning & Imputation
// Group by building to compute mean temperature and solar
const buildingTempSum: Record<string, { sum: number; count: number }> = {};
const buildingSolarSum: Record<string, { sum: number; count: number }> = {};

for (const r of rawRows) {
  if (!buildingTempSum[r.building]) {
    buildingTempSum[r.building] = { sum: 0, count: 0 };
    buildingSolarSum[r.building] = { sum: 0, count: 0 };
  }
  if (!isNaN(r.temperature_c)) {
    buildingTempSum[r.building].sum += r.temperature_c;
    buildingTempSum[r.building].count++;
  }
  if (!isNaN(r.solar_generated_kwh)) {
    buildingSolarSum[r.building].sum += r.solar_generated_kwh;
    buildingSolarSum[r.building].count++;
  }
}

const cleanedRows: RawRow[] = rawRows.map(r => ({
  ...r,
  temperature_c: isNaN(r.temperature_c)
    ? Math.round((buildingTempSum[r.building].sum / buildingTempSum[r.building].count) * 10) / 10
    : r.temperature_c,
  solar_generated_kwh: isNaN(r.solar_generated_kwh)
    ? Math.round((buildingSolarSum[r.building].sum / buildingSolarSum[r.building].count) * 10) / 10
    : r.solar_generated_kwh,
}));

// 3. Feature Engineering & Lag Generation
// Group by building and sort chronologically
const buildingGroups: Record<string, RawRow[]> = {};
for (const r of cleanedRows) {
  if (!buildingGroups[r.building]) buildingGroups[r.building] = [];
  buildingGroups[r.building].push(r);
}

const processedRows: ProcessedRow[] = [];

for (const bName of Object.keys(buildingGroups)) {
  const group = buildingGroups[bName].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 0; i < group.length - 1; i++) {
    const curr = group[i];
    const next = group[i + 1];

    // Compute 7-day rolling average up to day i
    const lagStart = Math.max(0, i - 6);
    const lagSlice = group.slice(lagStart, i + 1);
    const lag7Avg = lagSlice.reduce((acc, x) => acc + x.electricity_kwh, 0) / lagSlice.length;

    const d = new Date(curr.date);
    const dayOfWeek = d.getDay(); // 0-6
    const month = d.getMonth() + 1; // 1-12
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;

    processedRows.push({
      date: curr.date,
      building: curr.building,
      students_present: curr.students_present,
      temperature_c: curr.temperature_c,
      ac_hours_per_day: curr.ac_hours_per_day,
      solar_generated_kwh: curr.solar_generated_kwh,
      lag_1_electricity: curr.electricity_kwh,
      lag_7_avg_electricity: Math.round(lag7Avg * 10) / 10,
      day_of_week: dayOfWeek,
      month: month,
      is_weekend: isWeekend,
      b_eng: curr.building === 'Engineering Block' ? 1 : 0,
      b_sci: curr.building === 'Science Block' ? 1 : 0,
      b_admin: curr.building === 'Admin Block' ? 1 : 0,
      b_hostel: curr.building === 'Student Hostel' ? 1 : 0,
      b_library: curr.building === 'Central Library' ? 1 : 0,
      next_day_electricity: next.electricity_kwh,
      current_electricity: curr.electricity_kwh,
      water_liters: curr.water_liters,
      waste_kg: curr.waste_kg,
    });
  }
}

// Sort all processed rows chronologically
processedRows.sort((a, b) => a.date.localeCompare(b.date));

console.log(`Processed ${processedRows.length} feature-engineered samples.`);

// 4. Chronological Train / Validation / Test Split
// 545 samples per building. Dates: Jan 1, 2025 -> June 29, 2026
const trainSet = processedRows.filter(r => r.date <= '2025-12-31');
const valSet = processedRows.filter(r => r.date >= '2026-01-01' && r.date <= '2026-03-31');
const testSet = processedRows.filter(r => r.date >= '2026-04-01');

console.log(`\nData Split Sizes:`);
console.log(`  - Train Set (2025-01-01 to 2025-12-31): ${trainSet.length} rows`);
console.log(`  - Validation Set (2026-01-01 to 2026-03-31): ${valSet.length} rows`);
console.log(`  - Test Set (2026-04-01 to 2026-06-29): ${testSet.length} rows`);

// Feature Vector Definition
const featureNames = [
  'students_present',
  'temperature_c',
  'ac_hours_per_day',
  'solar_generated_kwh',
  'lag_1_electricity',
  'lag_7_avg_electricity',
  'day_of_week',
  'month',
  'is_weekend',
  'b_eng',
  'b_sci',
  'b_admin',
  'b_hostel',
  'b_library',
];

function extractX(row: ProcessedRow): number[] {
  return [
    row.students_present,
    row.temperature_c,
    row.ac_hours_per_day,
    row.solar_generated_kwh,
    row.lag_1_electricity,
    row.lag_7_avg_electricity,
    row.day_of_week,
    row.month,
    row.is_weekend,
    row.b_eng,
    row.b_sci,
    row.b_admin,
    row.b_hostel,
    row.b_library,
  ];
}

// 5. Decision Tree & Random Forest Model Implementation
interface DecisionNode {
  isLeaf: boolean;
  value?: number;
  featureIndex?: number;
  threshold?: number;
  left?: DecisionNode;
  right?: DecisionNode;
}

function buildDecisionTree(X: number[][], y: number[], depth: number, maxDepth: number, minSamplesSplit: number, featureIndices: number[]): DecisionNode {
  if (depth >= maxDepth || X.length < minSamplesSplit || y.length === 0) {
    const avg = y.reduce((a, b) => a + b, 0) / (y.length || 1);
    return { isLeaf: true, value: avg };
  }

  const currentVariance = calculateVariance(y);
  if (currentVariance < 0.001) {
    return { isLeaf: true, value: y[0] };
  }

  let bestGain = -Infinity;
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestLeftX: number[][] = [];
  let bestLeftY: number[] = [];
  let bestRightX: number[][] = [];
  let bestRightY: number[] = [];

  for (const featIdx of featureIndices) {
    const values = X.map(row => row[featIdx]);
    // Sample 15 candidate thresholds for speed and variance reduction
    const sortedVals = Array.from(new Set(values)).sort((a, b) => a - b);
    const step = Math.max(1, Math.floor(sortedVals.length / 15));
    const thresholds: number[] = [];
    for (let k = 0; k < sortedVals.length - 1; k += step) {
      thresholds.push((sortedVals[k] + sortedVals[k + 1]) / 2);
    }

    for (const thresh of thresholds) {
      const leftX: number[][] = [];
      const leftY: number[] = [];
      const rightX: number[][] = [];
      const rightY: number[] = [];

      for (let i = 0; i < X.length; i++) {
        if (X[i][featIdx] <= thresh) {
          leftX.push(X[i]);
          leftY.push(y[i]);
        } else {
          rightX.push(X[i]);
          rightY.push(y[i]);
        }
      }

      if (leftY.length === 0 || rightY.length === 0) continue;

      const varLeft = calculateVariance(leftY);
      const varRight = calculateVariance(rightY);
      const weightLeft = leftY.length / y.length;
      const weightRight = rightY.length / y.length;
      const varianceGain = currentVariance - (weightLeft * varLeft + weightRight * varRight);

      if (varianceGain > bestGain) {
        bestGain = varianceGain;
        bestFeature = featIdx;
        bestThreshold = thresh;
        bestLeftX = leftX;
        bestLeftY = leftY;
        bestRightX = rightX;
        bestRightY = rightY;
      }
    }
  }

  if (bestGain <= 0 || bestFeature === -1) {
    const avg = y.reduce((a, b) => a + b, 0) / y.length;
    return { isLeaf: true, value: avg };
  }

  return {
    isLeaf: false,
    featureIndex: bestFeature,
    threshold: bestThreshold,
    left: buildDecisionTree(bestLeftX, bestLeftY, depth + 1, maxDepth, minSamplesSplit, featureIndices),
    right: buildDecisionTree(bestRightX, bestRightY, depth + 1, maxDepth, minSamplesSplit, featureIndices),
  };
}

function predictTree(node: DecisionNode, x: number[]): number {
  if (node.isLeaf) return node.value!;
  if (x[node.featureIndex!] <= node.threshold!) {
    return predictTree(node.left!, x);
  } else {
    return predictTree(node.right!, x);
  }
}

function calculateVariance(vals: number[]): number {
  if (vals.length <= 1) return 0;
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
}

// Train Random Forest Ensemble (15 Decision Trees)
const numTrees = 15;
const maxDepth = 7;
const minSamplesSplit = 8;
const trees: DecisionNode[] = [];

const XTrain = trainSet.map(extractX);
const yTrain = trainSet.map(r => r.next_day_electricity);

console.log(`\nTraining Random Forest Regressor (${numTrees} trees, max_depth=${maxDepth})...`);

for (let t = 0; t < numTrees; t++) {
  // Bootstrap sampling (with replacement)
  const bootX: number[][] = [];
  const bootY: number[] = [];
  for (let i = 0; i < XTrain.length; i++) {
    const randIdx = Math.floor(Math.random() * XTrain.length);
    bootX.push(XTrain[randIdx]);
    bootY.push(yTrain[randIdx]);
  }

  // Feature subspace sampling (mtry = sqrt(p))
  const numFeaturesToSelect = Math.floor(Math.sqrt(featureNames.length)) + 2;
  const shuffledFeatures = [...Array(featureNames.length).keys()].sort(() => 0.5 - Math.random());
  const selectedFeatureIndices = shuffledFeatures.slice(0, numFeaturesToSelect);

  const tree = buildDecisionTree(bootX, bootY, 0, maxDepth, minSamplesSplit, selectedFeatureIndices);
  trees.push(tree);
}

function predictForest(x: number[]): number {
  const preds = trees.map(tree => predictTree(tree, x));
  return preds.reduce((a, b) => a + b, 0) / preds.length;
}

// 6. Evaluation Function
function evaluateModel(dataset: ProcessedRow[]) {
  let totalAE = 0;
  let totalSE = 0;
  const actuals = dataset.map(r => r.next_day_electricity);
  const preds = dataset.map(r => predictForest(extractX(r)));

  const meanActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  let totalSST = 0;
  let totalSSR = 0;

  for (let i = 0; i < dataset.length; i++) {
    const err = Math.abs(preds[i] - actuals[i]);
    totalAE += err;
    totalSE += err * err;
    totalSST += Math.pow(actuals[i] - meanActual, 2);
    totalSSR += Math.pow(actuals[i] - preds[i], 2);
  }

  const mae = totalAE / dataset.length;
  const rmse = Math.sqrt(totalSE / dataset.length);
  const r2 = 1 - totalSSR / totalSST;

  return { mae: Math.round(mae * 10) / 10, rmse: Math.round(rmse * 10) / 10, r2: Math.round(r2 * 1000) / 1000 };
}

const trainMetrics = evaluateModel(trainSet);
const valMetrics = evaluateModel(valSet);
const testMetrics = evaluateModel(testSet);

console.log(`\n=== MODEL EVALUATION RESULTS ===`);
console.log(`Training Set:   MAE = ${trainMetrics.mae} kWh | RMSE = ${trainMetrics.rmse} kWh | R² = ${trainMetrics.r2}`);
console.log(`Validation Set: MAE = ${valMetrics.mae} kWh | RMSE = ${valMetrics.rmse} kWh | R² = ${valMetrics.r2}`);
console.log(`Test Set:       MAE = ${testMetrics.mae} kWh | RMSE = ${testMetrics.rmse} kWh | R² = ${testMetrics.r2}`);

// 7. Feature Importance Analysis via Permutation Importance on Validation Set
console.log(`\n=== FEATURE IMPORTANCES (%) ===`);
const baseValScore = valMetrics.mae;
const featureImportances: { name: string; importance: number }[] = [];

for (let f = 0; f < featureNames.length; f++) {
  // Permute feature f in validation set
  let permutedAE = 0;
  for (const row of valSet) {
    const x = extractX(row);
    // Substitute with random row's feature f
    const randomRow = valSet[Math.floor(Math.random() * valSet.length)];
    x[f] = extractX(randomRow)[f];
    const pred = predictForest(x);
    permutedAE += Math.abs(pred - row.next_day_electricity);
  }
  const permutedMAE = permutedAE / valSet.length;
  const importanceScore = Math.max(0, permutedMAE - baseValScore);
  featureImportances.push({ name: featureNames[f], importance: importanceScore });
}

const totalImpSum = featureImportances.reduce((a, b) => a + b.importance, 0) || 1;
featureImportances.forEach(item => {
  item.importance = Math.round((item.importance / totalImpSum) * 1000) / 10;
});
featureImportances.sort((a, b) => b.importance - a.importance);

featureImportances.forEach(fi => {
  console.log(`  - ${fi.name.padEnd(25)} : ${fi.importance}%`);
});

// 8. 10 Representative Test Set Predictions
console.log(`\n=== 10 REPRESENTATIVE TEST SET PREDICTIONS (UNSEEN DATA) ===`);
console.log(`Date       | Building          | Students | Temp(°C) | Actual (kWh) | Predicted (kWh) | Error (kWh)`);
console.log(`--------------------------------------------------------------------------------------------------`);

const testSampleIndices = [10, 45, 90, 140, 185, 230, 280, 330, 380, 420];
const sampleTableRows: any[] = [];

testSampleIndices.forEach(idx => {
  const sample = testSet[idx];
  const pred = predictForest(extractX(sample));
  const err = Math.round(Math.abs(pred - sample.next_day_electricity) * 10) / 10;
  const actualRounded = Math.round(sample.next_day_electricity * 10) / 10;
  const predRounded = Math.round(pred * 10) / 10;

  sampleTableRows.push({
    date: sample.date,
    building: sample.building,
    students: sample.students_present,
    temp: sample.temperature_c,
    actual: actualRounded,
    predicted: predRounded,
    error: err,
  });

  console.log(
    `${sample.date} | ${sample.building.padEnd(17)} | ${String(sample.students_present).padStart(8)} | ${String(sample.temperature_c).padStart(8)} | ${String(actualRounded).padStart(12)} | ${String(predRounded).padStart(15)} | ${String(err).padStart(11)}`
  );
});

// 9. Export Trained Model Artifacts
const modelArtifact = {
  trained_at: new Date().toISOString(),
  total_records_processed: rawRows.length,
  feature_names: featureNames,
  train_metrics: trainMetrics,
  val_metrics: valMetrics,
  test_metrics: testMetrics,
  feature_importances: featureImportances,
  trees: trees, // Embedded JSON decision trees
  sample_test_predictions: sampleTableRows,
};

const modelDir = path.join(process.cwd(), 'ml', 'model');
if (!fs.existsSync(modelDir)) {
  fs.mkdirSync(modelDir, { recursive: true });
}

fs.writeFileSync(path.join(modelDir, 'trained_model.json'), JSON.stringify(modelArtifact, null, 2));
console.log(`\nTrained Random Forest Model artifact saved successfully to ml/model/trained_model.json`);
