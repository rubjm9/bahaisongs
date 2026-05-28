import { describe, expect, it } from 'vitest';
import { htmlToText } from './html-to-text';

describe('htmlToText', () => {
  it('returns empty string for empty input', () => {
    expect(htmlToText('')).toBe('');
  });

  it('strips paragraph tags and preserves stanza breaks', () => {
    const html = '<p>line one</p><p>line two</p>';
    expect(htmlToText(html)).toBe('line one\n\nline two');
  });

  it('converts <br> to newlines', () => {
    expect(htmlToText('a<br>b<br/>c')).toBe('a\nb\nc');
  });

  it('decodes the entities used in the WP export', () => {
    expect(htmlToText('<p>Bah&#8217;u&#8217;ll&#225;h</p>')).toBe('Bah’u’llá h'.replace(' ', ''));
    expect(htmlToText('<p>nbsp&nbsp;here</p>')).toBe('nbsp here');
  });

  it('collapses excessive blank lines', () => {
    const html = '<p>a</p><p>&nbsp;</p><p>&nbsp;</p><p>b</p>';
    expect(htmlToText(html)).toBe('a\n\nb');
  });

  it('drops nested tags but keeps inner text', () => {
    expect(htmlToText('<p><strong>Hello</strong> <em>world</em></p>')).toBe('Hello world');
  });
});
