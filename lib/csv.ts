import Papa from "papaparse";
import { csvRowSchema } from "@/lib/validations";

export interface CsvRow {
  email: string;
  role: string;
  password: string;
}

export interface ParsedCsvResult {
  valid: CsvRow[];
  errors: { row: number; data: Partial<CsvRow>; errors: string[] }[];
}

export function parseCsvFile(content: string): ParsedCsvResult {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const valid: CsvRow[] = [];
  const errors: { row: number; data: Partial<CsvRow>; errors: string[] }[] = [];

  result.data.forEach((row, index) => {
    const parsed = csvRowSchema.safeParse({
      email: row.email?.trim().toLowerCase(),
      role: row.role?.trim().toUpperCase(),
      password: row.password?.trim(),
    });

    if (parsed.success) {
      valid.push(parsed.data);
    } else {
      errors.push({
        row: index + 2,
        data: { email: row.email, role: row.role },
        errors: parsed.error.errors.map((e) => e.message),
      });
    }
  });

  return { valid, errors };
}

export function deduplicateCsvRows(rows: CsvRow[]): CsvRow[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.email)) return false;
    seen.add(r.email);
    return true;
  });
}
