// =============================================================================
// Globe Trotter - Formatting and Date Helpers
// =============================================================================

export const CURRENCY_SYMBOL = '₹';

/**
 * Format a number into currency representation (e.g. ₹1,500.00)
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${CURRENCY_SYMBOL}0.00`;
  }
  return `${CURRENCY_SYMBOL}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date for human reading: "01 Jul 2026"
 */
export const formatDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

/**
 * Format date for HTML input type="date": "YYYY-MM-DD"
 */
export const formatDateInput = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/**
 * Format time for display: "09:30 AM"
 */
export const formatTime = (timeStr: string | Date | undefined | null): string => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
};

/**
 * Format time for HTML input type="time": "HH:mm"
 */
export const formatTimeInput = (timeStr: string | Date | undefined | null): string => {
  if (!timeStr) return '';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Calculate the inclusive duration in days between two dates
 */
export const calculateDuration = (
  startDate: string | Date | undefined | null,
  endDate: string | Date | undefined | null
): number => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};
