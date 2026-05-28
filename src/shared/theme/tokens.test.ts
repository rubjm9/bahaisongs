import { describe, expect, it } from 'vitest';
import {
  accent,
  getGradients,
  getSemanticPalette,
  getShadows,
  semanticDark,
  semanticLight,
} from './tokens';

describe('theme tokens', () => {
  it('keeps accent colors identical across modes', () => {
    expect(accent.electric).toBe('#1E90FF');
    expect(accent.cyan).toBe('#4FD1FF');
    expect(accent.glow).toBe('#6EA8FE');
    expect(accent.indigo).toBe('#6366F1');
  });

  it('returns dark semantic palette', () => {
    const dark = getSemanticPalette('dark');
    expect(dark.bg.primary).toBe(semanticDark.bg.primary);
    expect(dark.text.primary).toBe('#E6F0FF');
  });

  it('returns light semantic palette', () => {
    const light = getSemanticPalette('light');
    expect(light.bg.primary).toBe(semanticLight.bg.primary);
    expect(light.text.primary).toBe('#0D1F3C');
    expect(light.bg.primary).not.toBe(semanticDark.bg.primary);
  });

  it('provides mode-specific gradients and shadows', () => {
    const darkGradients = getGradients('dark');
    const lightGradients = getGradients('light');
    expect(darkGradients.spiritual).toContain('rgba(5,11,26');
    expect(lightGradients.spiritual).toContain('rgba(240,244,250');
    expect(getShadows('light').card).not.toBe(getShadows('dark').card);
  });
});
