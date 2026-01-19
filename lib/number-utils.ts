/**
 * Utility functions for normalizing and formatting numbers in forms
 */

/**
 * Normalizes a number string input by removing spaces, handling commas/periods as decimal separators,
 * and converting to a standard format (period as decimal separator)
 * 
 * Examples:
 * - "1,234.56" -> "1234.56"
 * - "1.234,56" -> "1234.56" (European format)
 * - "1 234,56" -> "1234.56"
 * - "1234" -> "1234"
 * 
 * @param input - The raw input string from the user
 * @returns Normalized number string with period as decimal separator, or empty string if invalid
 */
export const normalizeNumberInput = (input: string): string => {
  if (!input) return '';
  
  // Remove all spaces
  let normalized = input.replace(/\s/g, '');
  
  // Handle empty string
  if (normalized === '') return '';
  
  // If it's just a period or comma, allow it (user might be typing)
  if (normalized === '.' || normalized === ',') return '.';
  
  // Check if it's European format (comma as decimal separator)
  // Look for pattern: digits, comma, digits (e.g., "1234,56" or "85.736,55")
  // European format has a comma followed by digits at the end
  const hasComma = normalized.includes(',');
  const commaIndex = normalized.lastIndexOf(',');
  const periodIndex = normalized.lastIndexOf('.');
  
  if (hasComma) {
    // Check if comma is followed by digits (European decimal separator)
    const afterComma = normalized.substring(commaIndex + 1);
    if (/^\d+$/.test(afterComma)) {
      // European format: remove all periods (thousands separators), then replace comma with period
      normalized = normalized.replace(/\./g, '');
      normalized = normalized.replace(',', '.');
    } else {
      // Invalid format, try to salvage
      normalized = normalized.replace(/\./g, '');
      normalized = normalized.replace(/,/g, '');
    }
  } else {
    // US format: remove commas (thousands separators)
    normalized = normalized.replace(/,/g, '');
  }
  
  // Validate: should only contain digits and one period
  const validPattern = /^-?\d*\.?\d*$/;
  if (!validPattern.test(normalized)) {
    // If invalid, try to salvage: keep only digits, one period, and one comma
    normalized = normalized.replace(/[^\d.,-]/g, '');
    // If there's a comma, treat it as decimal separator
    if (normalized.includes(',')) {
      normalized = normalized.replace(',', '.');
    }
    // Remove any remaining commas
    normalized = normalized.replace(/,/g, '');
    // Ensure only one period
    const parts = normalized.split('.');
    if (parts.length > 2) {
      normalized = parts[0] + '.' + parts.slice(1).join('');
    }
  }
  
  return normalized;
};

/**
 * Detects if the input uses European format (comma as decimal separator)
 * 
 * @param input - The raw input string
 * @returns True if European format is detected
 */
const detectEuropeanFormat = (input: string): boolean => {
  if (!input) return false;
  
  const commaIndex = input.lastIndexOf(',');
  const periodIndex = input.lastIndexOf('.');
  
  // If there's a comma and it's followed by digits, it's likely European decimal separator
  if (commaIndex !== -1) {
    const afterComma = input.substring(commaIndex + 1);
    // If after comma there are only digits (and possibly more commas/periods), it's European format
    if (/^\d+/.test(afterComma)) {
      // If there's a period before the comma, it's likely a thousands separator (European format)
      if (periodIndex !== -1 && periodIndex < commaIndex) {
        return true;
      }
      // If there's only a comma (no period), check if it looks like European format
      // European format: digits, comma, digits (e.g., "1234,56" or "85.736,55")
      if (periodIndex === -1 || periodIndex < commaIndex) {
        // Count commas - if there's only one comma and it's followed by digits, it's European
        const commaCount = (input.match(/,/g) || []).length;
        if (commaCount === 1) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Formats a number string for display with thousand separators
 * Uses European format (period for thousands, comma for decimal) if detected
 * 
 * @param value - The normalized number string (e.g., "1234.56")
 * @param originalInput - The original input before normalization (for format detection)
 * @param maxDecimals - Maximum number of decimal places to show (default: 8)
 * @returns Formatted string with thousand separators
 */
export const formatNumberForDisplay = (
  value: string, 
  originalInput?: string,
  maxDecimals: number = 8
): string => {
  if (!value || value === '.' || value === ',') return value;
  
  // Parse the number
  const num = parseFloat(value);
  
  // If not a valid number, return as is
  if (isNaN(num)) return value;
  
  // Detect format preference from original input
  const useEuropeanFormat = originalInput ? detectEuropeanFormat(originalInput) : false;
  
  // Format with thousand separators
  const parts = value.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] || '';
  
  // Add thousand separators to integer part only (not to decimal part!)
  // Use period for European format, comma for US format
  const thousandsSeparator = useEuropeanFormat ? '.' : ',';
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
  
  // Limit decimal places (don't add separators to decimal part)
  const formattedDecimal = decimalPart.length > maxDecimals 
    ? decimalPart.substring(0, maxDecimals)
    : decimalPart;
  
  // Combine with appropriate decimal separator
  const decimalSeparator = useEuropeanFormat ? ',' : '.';
  
  if (formattedDecimal) {
    return `${formattedInteger}${decimalSeparator}${formattedDecimal}`;
  }
  
  // If user is typing a separator, show it
  if (value.endsWith('.') || value.endsWith(',')) {
    return `${formattedInteger}${decimalSeparator}`;
  }
  
  return formattedInteger;
};

/**
 * Formats a number string for display as USD currency
 * 
 * @param value - The normalized number string
 * @param originalInput - The original input before normalization (for format detection)
 * @returns Formatted string with dollar sign and thousand separators
 */
export const formatUSDForDisplay = (value: string, originalInput?: string): string => {
  if (!value || value === '.' || value === ',') return value;
  
  const normalized = normalizeNumberInput(value);
  if (!normalized || normalized === '.') return value;
  
  const num = parseFloat(normalized);
  if (isNaN(num)) return value;
  
  const formatted = formatNumberForDisplay(normalized, originalInput || value, 2);
  
  // Add dollar sign
  if (value.startsWith('-')) {
    return `-$${formatted.substring(1)}`;
  }
  
  return `$${formatted}`;
};

/**
 * Formats a number string for display as Bitcoin amount
 * 
 * @param value - The normalized number string
 * @param originalInput - The original input before normalization (for format detection)
 * @returns Formatted string with thousand separators and up to 8 decimals
 */
export const formatBTCForDisplay = (value: string, originalInput?: string): string => {
  if (!value || value === '.' || value === ',') return value;
  
  return formatNumberForDisplay(value, originalInput || value, 8);
};

/**
 * Converts a normalized number string to a number for calculations
 * 
 * @param value - The normalized number string
 * @returns The parsed number, or NaN if invalid
 */
export const parseNormalizedNumber = (value: string): number => {
  if (!value || value === '.' || value === ',') return NaN;
  
  const normalized = normalizeNumberInput(value);
  if (!normalized || normalized === '.') return NaN;
  
  return parseFloat(normalized);
};
