import { describe, expect, it } from 'vitest';
import { detectChords } from './chord-detection';

describe('detectChords', () => {
  it('returns false for plain prose without any chord hint', () => {
    expect(detectChords('Hoy camino decidido a servir Servir a la humanidad')).toBe(false);
  });

  it('detects a parenthesised Spanish note list at the start of a stanza', () => {
    expect(detectChords('(La M, Re M, Mi M, La M) Mientras pienso en mi futuro')).toBe(true);
    expect(detectChords('(Do Re Sol Mim) Pedrito ha llegado al barrio')).toBe(true);
    expect(detectChords('(Fa Do Sol Lam) Glorificaré tu alabanza')).toBe(true);
  });

  it('detects English note shorthand inside brackets [C][G]', () => {
    expect(detectChords('[C]Hello [G]world this is a [Am]chord sheet')).toBe(true);
  });

  it('rejects a parenthesis that is not a chord list', () => {
    expect(detectChords('(bis) repetir el estribillo')).toBe(false);
    expect(detectChords('(este es un comentario) y el resto')).toBe(false);
  });

  it('handles empty input safely', () => {
    expect(detectChords('')).toBe(false);
  });
});
