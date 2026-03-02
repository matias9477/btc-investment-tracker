import Papa from 'papaparse';
import { Purchase } from '../types/database';

/** Configuration for mapping spreadsheet columns to Purchase fields. */
export interface SheetColumnConfig {
  /** Full Google Sheets share URL */
  sheetsUrl: string;
  /** Column letter for the purchase date (e.g. 'A') */
  colDate: string;
  /** Column letter for the BTC price at purchase (e.g. 'B') */
  colPrice: string;
  /** Column letter for the BTC amount bought (e.g. 'C') */
  colAmount: string;
  /** Column letter for the USD amount spent (e.g. 'D') */
  colSpent: string;
}

/**
 * Extracts the spreadsheet ID from any Google Sheets share or edit URL.
 * Supports formats like:
 *   https://docs.google.com/spreadsheets/d/{ID}/edit?usp=sharing
 *   https://docs.google.com/spreadsheets/d/{ID}/pub
 *
 * @returns The spreadsheet ID string, or null if not found.
 */
export const extractSpreadsheetId = (url: string): string | null => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

/**
 * Builds the CSV fetch URL for a given Google Sheets spreadsheet ID using
 * the Google Visualization (gviz) query endpoint.
 *
 * This endpoint returns CSV directly without redirects, which makes it
 * compatible with React Native's fetch implementation. The `/export?format=csv`
 * alternative issues a 302 redirect that React Native's XHR layer cannot
 * follow reliably.
 *
 * The sheet must be publicly accessible ("Anyone with the link can view").
 */
export const buildCsvExportUrl = (spreadsheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`;

/**
 * Converts a column letter (or letters) to a zero-based column index.
 * Examples: 'A' → 0, 'B' → 1, 'Z' → 25, 'AA' → 26.
 *
 * @param col - Uppercase or lowercase column letter string.
 * @returns Zero-based numeric index.
 */
export const columnLetterToIndex = (col: string): number => {
  const upper = col.toUpperCase().trim();
  let index = 0;
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
};

/**
 * Strips currency symbols, commas, and extra whitespace from a string value
 * and parses it as a floating-point number.
 *
 * @returns A finite number, or NaN if the value cannot be parsed.
 */
export const parseNumericValue = (val: string): number => {
  const cleaned = val.replace(/[$,\s]/g, '');
  return parseFloat(cleaned);
};

/**
 * Parses a date string in DD-MM-YYYY format to ISO format YYYY-MM-DD.
 * Falls back to returning the original string if format does not match.
 *
 * @param val - Date string, e.g. '28-12-2024'.
 * @returns ISO date string, e.g. '2024-12-28'.
 */
export const parseDateValue = (val: string): string => {
  const parts = val.trim().split('-');
  if (parts.length === 3 && parts[2].length === 4) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return val.trim();
};

/**
 * Parses a cell reference string (e.g. "I7") into zero-based row/column indices.
 * Supports single and double letter column identifiers (e.g. "AA7").
 *
 * @param ref - Cell reference such as 'I7' or 'AB12'.
 * @returns An object with zero-based `colIndex` and `rowIndex`, or null if invalid.
 */
export const parseCellReference = (
  ref: string,
): { colIndex: number; rowIndex: number } | null => {
  const match = ref.trim().toUpperCase().match(/^([A-Z]{1,2})(\d+)$/);
  if (!match) return null;
  return {
    colIndex: columnLetterToIndex(match[1]),
    rowIndex: parseInt(match[2], 10) - 1,
  };
};

/**
 * Fetches a publicly shared Google Sheets document and returns the raw CSV
 * data as a 2-D array of strings (rows × columns).
 *
 * @param sheetsUrl - Full Google Sheets share URL.
 * @returns Parsed CSV rows as `string[][]`.
 * @throws Error if the URL is invalid, the sheet is not publicly accessible,
 *         or the network request fails.
 */
export const fetchSheetRows = async (sheetsUrl: string): Promise<string[][]> => {
  const spreadsheetId = extractSpreadsheetId(sheetsUrl);
  if (!spreadsheetId) {
    throw new Error(
      'Invalid Google Sheets URL. Please paste the full sharing link from your browser.',
    );
  }

  const csvUrl = buildCsvExportUrl(spreadsheetId);
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch spreadsheet (HTTP ${response.status}). Make sure the sheet is set to "Anyone with the link can view".`,
    );
  }

  const csvText = await response.text();
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: true });
  return data;
};

/**
 * Maps raw CSV rows to `Purchase` objects, silently discarding any row where
 * the price, amount, or spent columns don't contain valid finite numbers —
 * this naturally filters out header rows, empty rows, and label rows.
 *
 * @param rows  - 2-D array from `fetchSheetRows`.
 * @param config - Column mapping configuration (without the URL).
 * @param userId - Authenticated user ID used to populate Purchase.user_id.
 * @returns An array of Purchase objects sorted by date descending.
 */
export const mapRowsToPurchases = (
  rows: string[][],
  config: Omit<SheetColumnConfig, 'sheetsUrl'>,
  userId: string,
): Purchase[] => {
  const dateIdx = columnLetterToIndex(config.colDate);
  const priceIdx = columnLetterToIndex(config.colPrice);
  const amountIdx = columnLetterToIndex(config.colAmount);
  const spentIdx = columnLetterToIndex(config.colSpent);

  const purchases: Purchase[] = [];

  rows.forEach((row, rowIndex) => {
    const rawPrice = row[priceIdx] ?? '';
    const rawAmount = row[amountIdx] ?? '';
    const rawSpent = row[spentIdx] ?? '';

    const price = parseNumericValue(rawPrice);
    const amount = parseNumericValue(rawAmount);
    const spent = parseNumericValue(rawSpent);

    if (!isFinite(price) || !isFinite(amount) || !isFinite(spent)) {
      return;
    }

    const rawDate = row[dateIdx] ?? '';
    const purchaseDate = parseDateValue(rawDate);

    purchases.push({
      id: `sheet-row-${rowIndex}`,
      user_id: userId,
      purchase_date: purchaseDate,
      btc_price_at_purchase: price,
      btc_amount: amount,
      usd_spent: spent,
      created_at: new Date().toISOString(),
    });
  });

  return purchases.sort(
    (a, b) =>
      new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime(),
  );
};

/**
 * Extracts the numeric value stored at a specific cell reference within an
 * already-parsed set of CSV rows.
 *
 * This is used to read the user's total BTC balance from a dedicated
 * spreadsheet cell (e.g. 'I7') without issuing an additional network request.
 *
 * @param rows    - 2-D array from `fetchSheetRows`.
 * @param cellRef - Cell reference string, e.g. 'I7' or 'AB12'.
 * @returns The parsed number, or null if the reference is invalid or the
 *          value at that position is not a finite number.
 */
export const extractCellValue = (rows: string[][], cellRef: string): number | null => {
  const parsed = parseCellReference(cellRef);
  if (!parsed) return null;

  const row = rows[parsed.rowIndex];
  if (!row) return null;

  const val = row[parsed.colIndex] ?? '';
  const num = parseNumericValue(val);
  return isFinite(num) ? num : null;
};

/**
 * Convenience function that fetches and parses a Google Sheet in one step.
 * Internally calls `fetchSheetRows` + `mapRowsToPurchases`.
 *
 * @param config - Column mapping and sheet URL configuration.
 * @param userId - The authenticated user's ID.
 * @returns An array of Purchase objects sorted by date descending.
 */
export const fetchSheetPurchases = async (
  config: SheetColumnConfig,
  userId: string,
): Promise<Purchase[]> => {
  const rows = await fetchSheetRows(config.sheetsUrl);
  return mapRowsToPurchases(rows, config, userId);
};
