import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSwitcher } from './ThemeSwitcher';

const setTheme = vi.fn();

vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme,
    resolvedTheme: 'dark',
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const labels: Record<string, string> = {
      themeAria: 'Change theme',
      themeSystem: 'System',
      themeLight: 'Light',
      themeDark: 'Dark',
    };
    return labels[key] ?? key;
  },
}));

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    setTheme.mockClear();
  });

  it('calls setTheme with light when light option is chosen', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByRole('button', { name: 'Change theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'Light' }));

    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with dark when dark option is chosen', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByRole('button', { name: 'Change theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'Dark' }));

    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme with system when system option is chosen', async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);

    await user.click(screen.getByRole('button', { name: 'Change theme' }));
    await user.click(screen.getByRole('menuitem', { name: 'System' }));

    expect(setTheme).toHaveBeenCalledWith('system');
  });
});
