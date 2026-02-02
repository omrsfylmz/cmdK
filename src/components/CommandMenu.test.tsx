import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommandMenu from './CommandMenu';

// Mock Lucide icons to avoid rendering issues
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Bookmark: () => <div data-testid="bookmark-icon" />,
}));

// Mock logo
vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

describe('CommandMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chrome.runtime.lastError
    if (global.chrome.runtime) {
        global.chrome.runtime.lastError = undefined;
    }
  });

  it('renders correctly', () => {
    render(<CommandMenu />);
    // Ideally it's hidden initially, but we might want to trigger opening it or mock state if we could.
    // Since we can't easily access state from outside without exporting it or using a driver,
    // we rely on the component's internal logic.
    // Wait, the component is only rendered if `open` state is true.
    // But `open` defaults to false.
    // We need to trigger the keyboard event 'Cmd+K' to open it.
    
    // Simulate Cmd+K
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    
    expect(screen.getByPlaceholderText(/Type a command or search/i)).toBeInTheDocument();
  });

  it('fetches bookmarks on open', async () => {
    const mockBookmarks = [
      { id: '1', title: 'Test Bookmark', url: 'https://test.com' }
    ];

    (global.chrome.runtime.sendMessage as any).mockImplementation((message, callback) => {
      if (message.type === 'GET_BOOKMARKS') {
        callback(mockBookmarks);
      }
    });

    render(<CommandMenu />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      expect(screen.getByText('Test Bookmark')).toBeInTheDocument();
    });
  });

  it('handles "Extension context invalidated" error gracefully', async () => {
    // Simulate runtime error
    (global.chrome.runtime.sendMessage as any).mockImplementation((message, callback) => {
        // Simulate immediate error or error in callback check
        global.chrome.runtime.lastError = { message: 'Extension context invalidated.' };
        // Callback might still be called or not.
        callback(undefined); 
    });

    const consoleLogSpy = vi.spyOn(console, 'log');
    const consoleWarnSpy = vi.spyOn(console, 'warn');

    render(<CommandMenu />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    await waitFor(() => {
      // Expect our friendly log message
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Please refresh the page'));
    });
    
    // Expect NO warnings (we suppressed them)
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Exception'));
  });

  it('handles missing chrome API (strictly local mode) gracefully', async () => {
    // Completely remove chrome global
    vi.stubGlobal('chrome', undefined);

    const consoleLogSpy = vi.spyOn(console, 'log');
    
    render(<CommandMenu />);
    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    // Verify it opened first (logo presence indicates rendering content)
    expect(screen.getByAltText('CmdK Logo')).toBeInTheDocument();

    await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Extension updated or context invalidated'));
    });

    // cleanup is handled by vistes/jsdom environment reset usually, 
    // but explicit restore if needed:
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn(), lastError: undefined } });
  });
});
