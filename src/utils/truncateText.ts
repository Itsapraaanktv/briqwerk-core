import { MAX_TEXT_LENGTH } from '../lib/constants';

/**
 * Truncates text to a specified length and adds ellipsis if needed
 * @param text The text to truncate
 * @param maxLength Maximum length of the text (defaults to MAX_TEXT_LENGTH)
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = MAX_TEXT_LENGTH): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}; 