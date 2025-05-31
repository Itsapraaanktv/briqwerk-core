import { truncateText } from '../truncateText';
import { MAX_TEXT_LENGTH } from '../../lib/constants';

describe('truncateText', () => {
  it('should return empty string for null or undefined input', () => {
    expect(truncateText('')).toBe('');
    expect(truncateText(undefined as unknown as string)).toBe('');
    expect(truncateText(null as unknown as string)).toBe('');
  });

  it('should not modify text shorter than max length', () => {
    const shortText = 'Hello World';
    expect(truncateText(shortText)).toBe(shortText);
    expect(truncateText(shortText, 20)).toBe(shortText);
  });

  it('should not modify text exactly at max length', () => {
    const exactText = 'a'.repeat(MAX_TEXT_LENGTH);
    expect(truncateText(exactText)).toBe(exactText);
    
    const customLengthText = 'a'.repeat(10);
    expect(truncateText(customLengthText, 10)).toBe(customLengthText);
  });

  it('should truncate text longer than max length and add ellipsis', () => {
    const longText = 'a'.repeat(MAX_TEXT_LENGTH + 10);
    const expected = 'a'.repeat(MAX_TEXT_LENGTH) + '...';
    expect(truncateText(longText)).toBe(expected);

    const customText = 'Hello World';
    const customExpected = 'Hello...';
    expect(truncateText(customText, 5)).toBe(customExpected);
  });

  it('should handle custom max length', () => {
    const text = 'Hello World';
    expect(truncateText(text, 7)).toBe('Hello...');
    expect(truncateText(text, 3)).toBe('Hel...');
    expect(truncateText(text, text.length)).toBe(text);
  });
}); 