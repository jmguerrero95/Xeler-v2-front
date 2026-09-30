const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "src");
const patterns = [
  /(?<![A-Za-z0-9_])parseFloat\(/,
  /\.toFixed\(/,
  /(?<![A-Za-z0-9_])Number\(/,
  /Math\.round/,
];
const strictnessPatterns = [
  /normalizeDecimal\(/,
  /normalizeDecimalInput\(/,
  /safeDecimalInput\(/,
  /[0-9]+(\.[0-9]+)?e[+-]?[0-9]+/i,
];
const criticalPaths = [
  "views/user/Compra",
  "views/user/Venta",
  "views/user/walletXCOP",
  "views/admin/transactions",
  "views/admin/withdrawalXcop",
  "stores/TransactionStore.ts",
];

const mediumHints = ["Calculadora", "Preview", "TransactionView", "WalletStore"];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(vue|ts)$/.test(entry.name) ? [full] : [];
  });

const classify = (relativePath) => {
  const normalized = relativePath.replace(/\\/g, "/");
  if (criticalPaths.some((item) => normalized.includes(item))) return "critical";
  if (mediumHints.some((item) => normalized.includes(item))) return "medium";
  return "low";
};

const results = { critical: [], medium: [], low: [] };
const strictnessResults = { critical: [], medium: [], low: [] };

for (const file of walk(root)) {
  const relativePath = path.relative(root, file);
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    if (!patterns.some((pattern) => pattern.test(line))) return;
    const level = classify(relativePath);
    results[level].push({
      file: relativePath,
      line: index + 1,
      text: line.trim(),
    });
  });

  lines.forEach((line, index) => {
    if (!strictnessPatterns.some((pattern) => pattern.test(line))) return;
    const level = classify(relativePath);
    strictnessResults[level].push({
      file: relativePath,
      line: index + 1,
      text: line.trim(),
    });
  });
}

for (const level of ["critical", "medium", "low"]) {
  console.log(`\n${level.toUpperCase()} (${results[level].length})`);
  for (const item of results[level]) {
    console.log(`${item.file}:${item.line}: ${item.text}`);
  }
}

console.log("\nDECIMAL STRICTNESS SIGNALS");
for (const level of ["critical", "medium", "low"]) {
  console.log(`\n${level.toUpperCase()} (${strictnessResults[level].length})`);
  for (const item of strictnessResults[level]) {
    console.log(`${item.file}:${item.line}: ${item.text}`);
  }
}
