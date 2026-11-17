import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettingsPanel } from './SettingsPanel';
import { DEFAULT_PREFERENCES, type UserPreferences } from '../prefs/prefs';

describe('SettingsPanel', () => {
  const defaultPrefs: UserPreferences = {
    ...DEFAULT_PREFERENCES,
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <SettingsPanel
        isOpen={false}
        onClose={vi.fn()}
        prefs={defaultPrefs}
        onUpdatePrefs={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with dialog semantics when open', () => {
    render(
      <SettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        prefs={defaultPrefs}
        onUpdatePrefs={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: /preferences/i })).toBeInTheDocument();
  });

  it('calls onClose when Close button or Done button is clicked', () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel
        isOpen={true}
        onClose={onClose}
        prefs={defaultPrefs}
        onUpdatePrefs={vi.fn()}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close settings/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const doneBtn = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('calls onClose on Escape key press', () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel
        isOpen={true}
        onClose={onClose}
        prefs={defaultPrefs}
        onUpdatePrefs={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onUpdatePrefs when toggling sound', () => {
    const onUpdatePrefs = vi.fn();
    render(
      <SettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        prefs={defaultPrefs}
        onUpdatePrefs={onUpdatePrefs}
      />
    );

    const soundSwitch = screen.getByRole('switch', { name: /toggle sound effects/i });
    fireEvent.click(soundSwitch);
    expect(onUpdatePrefs).toHaveBeenCalledWith({ sound: false });
  });

  it('calls onUpdatePrefs when changing motion preference', () => {
    const onUpdatePrefs = vi.fn();
    render(
      <SettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        prefs={defaultPrefs}
        onUpdatePrefs={onUpdatePrefs}
      />
    );

    const reduceOption = screen.getByRole('radio', { name: /reduce motion/i });
    fireEvent.click(reduceOption);
    expect(onUpdatePrefs).toHaveBeenCalledWith({ motion: 'reduce' });
  });

  it('calls onUpdatePrefs when toggling leaderboard name privacy', () => {
    const onUpdatePrefs = vi.fn();
    render(
      <SettingsPanel
        isOpen={true}
        onClose={vi.fn()}
        prefs={defaultPrefs}
        onUpdatePrefs={onUpdatePrefs}
      />
    );

    const privacySwitch = screen.getByRole('switch', {
      name: /toggle player name visibility on leaderboard/i,
    });
    fireEvent.click(privacySwitch);
    expect(onUpdatePrefs).toHaveBeenCalledWith({ showNameOnLeaderboard: false });
  });
});
