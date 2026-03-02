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
 * Fetches purchase data from a publicly shared Google Sheets document
 * and maps each valid data row to a `Purchase` object.
 *
 * Rows are silently discarded when any of the three numeric columns
 * (price, amount, spent) do not resolve to a valid finite number —
 * this naturally filters out header rows, empty rows, and label rows.
 *
 * @param config - Column mapping and sheet URL configuration.
 * @param userId - The authenticated user's ID, used to satisfy the Purchase type.
 * @returns An array of Purchase objects sorted by date descending.
 * @throws Error if the URL is invalid, the sheet is not publicly accessible,
 *         or the network request fails.
 */
export const fetchSheetPurchases = async (
  config: SheetColumnConfig,
  userId: string,
): Promise<Purchase[]> => {
  const spreadsheetId = extractSpreadsheetId(config.sheetsUrl);
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

  const { data } = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const dateIdx = columnLetterToIndex(config.colDate);
  const priceIdx = columnLetterToIndex(config.colPrice);
  const amountIdx = columnLetterToIndex(config.colAmount);
  const spentIdx = columnLetterToIndex(config.colSpent);

  const purchases: Purchase[] = [];

  data.forEach((row, rowIndex) => {
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
