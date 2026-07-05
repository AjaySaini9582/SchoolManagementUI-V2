export interface CsvColumn {
  key: string;
  header: string;
}

const UTF8_BOM = String.fromCharCode(0xfeff);

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const header = columns.map((column) => escapeCsvValue(column.header)).join(',');
  const lines = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(','));
  return [header, ...lines].join('\r\n');
}

/** Prefixes a UTF-8 BOM so Excel opens the file with correct encoding
 * instead of mangling non-ASCII characters (names, addresses, etc.). */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([UTF8_BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** RFC4180-ish CSV parser (quoted fields, embedded commas/newlines) — good
 * enough for admin-authored import spreadsheets exported from Excel/Sheets.
 * Rows are matched to the header row by column name, so column order in the
 * source file doesn't matter. */
export function parseCsv(content: string): Record<string, string>[] {
  const rows = splitCsvRows(content);
  if (rows.length === 0) {
    return [];
  }
  const header = rows[0].map((cell) => cell.trim());
  return rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const record: Record<string, string> = {};
      header.forEach((key, index) => {
        record[key] = (row[index] ?? '').trim();
      });
      return record;
    });
}

function splitCsvRows(content: string): string[][] {
  const text = content.startsWith(UTF8_BOM) ? content.slice(1) : content;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}
