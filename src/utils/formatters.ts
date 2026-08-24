/**
 * Formats a number into Uzbek Som currency format (e.g., "3 450 000 сум")
 */
export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU').replace(/,/g, ' ') + ' сум';
}

/**
 * Triggers Telegram Haptic Feedback if supported
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    const haptic = window.Telegram.WebApp.HapticFeedback;
    if (type === 'success' || type === 'warning') {
      haptic.notificationOccurred(type);
    } else {
      haptic.impactOccurred(type);
    }
  }
}

/**
 * Format ISO date string into readable RU date time
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
