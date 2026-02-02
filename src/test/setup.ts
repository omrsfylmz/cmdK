import '@testing-library/jest-dom';

// Mock Chrome API globally
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    lastError: undefined,
  },
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
