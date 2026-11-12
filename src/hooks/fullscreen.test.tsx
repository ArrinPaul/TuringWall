import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFullscreen } from './fullscreen';

function TestHarness() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  return (
    <button type="button" onClick={toggleFullscreen}>
      {isFullscreen ? 'exit' : 'enter'}
    </button>
  );
}

describe('useFullscreen', () => {
  afterEach(() => {
    // @ts-expect-error cleaning up test-only stubs
    delete document.documentElement.requestFullscreen;
    // @ts-expect-error cleaning up test-only stubs
    delete document.exitFullscreen;
  });

  it('calls requestFullscreen when supported and not currently fullscreen', () => {
    const requestFullscreen = vi.fn();
    document.documentElement.requestFullscreen = requestFullscreen;
    render(<TestHarness />);
    fireEvent.click(screen.getByText('enter'));
    expect(requestFullscreen).toHaveBeenCalled();
  });

  it('does not throw when the Fullscreen API is unsupported', () => {
    render(<TestHarness />);
    expect(() => fireEvent.click(screen.getByText('enter'))).not.toThrow();
  });

  it('swallows a rejected requestFullscreen promise instead of producing an unhandled rejection', async () => {
    // Real browsers reject this promise when the call isn't tied to an active user
    // gesture or permission is denied — this must fail quietly, not throw/reject upward.
    document.documentElement.requestFullscreen = vi.fn(() => Promise.reject(new Error('not granted')));
    render(<TestHarness />);
    fireEvent.click(screen.getByText('enter'));
    // Let the rejected promise's microtask settle before the test ends.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  it('swallows a rejected exitFullscreen promise the same way', async () => {
    document.exitFullscreen = vi.fn(() => Promise.reject(new Error('not granted')));
    render(<TestHarness />);
    // The hook only knows it's fullscreen via the 'fullscreenchange' event, not by
    // reading document.fullscreenElement directly — so drive it the same way a real
    // browser would after a successful requestFullscreen().
    Object.defineProperty(document, 'fullscreenElement', { value: document.body, configurable: true });
    fireEvent(document, new Event('fullscreenchange'));
    fireEvent.click(await screen.findByText('exit'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    // @ts-expect-error cleaning up this test's own stub
    delete document.fullscreenElement;
  });
});
