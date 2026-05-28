import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { GlassPanel } from './GlassPanel';

describe('GlassPanel', () => {
  it('renders children', () => {
    const { getByText } = render(<GlassPanel>hello</GlassPanel>);
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('forwards refs', () => {
    let captured: HTMLDivElement | null = null;
    render(
      <GlassPanel
        ref={(node) => {
          captured = node;
        }}
      >
        x
      </GlassPanel>,
    );
    expect(captured).toBeInstanceOf(HTMLDivElement);
  });
});
