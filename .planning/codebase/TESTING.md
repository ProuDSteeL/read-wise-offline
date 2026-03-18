# Testing Patterns

**Analysis Date:** 2026-03-18

## Test Framework

**Runner:**
- Vitest ^3.2.4
- Config: `vitest.config.ts`
- Environment: jsdom (browser-like environment)
- Globals enabled: `true` (describe, it, expect available without imports)

**Assertion Library:**
- Vitest built-in assertions (uses standard expect syntax)

**Run Commands:**
```bash
npm test              # Run all tests once
npm run test:watch   # Watch mode for development
```

**Configuration Details:**
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

## Test File Organization

**Location:**
- Co-located: Tests live alongside source files
- Test discovery pattern: Files matching `src/**/*.{test,spec}.{ts,tsx}`

**Naming:**
- Pattern: `{component-name}.test.ts` or `{component-name}.spec.ts`
- Example: `example.test.ts` (currently only one test file)

**Current Structure:**
```
src/
├── test/
│   ├── setup.ts          # Test setup file
│   └── example.test.ts   # Example test
└── [other source files]
```

## Test Structure

**Suite Organization:**
```typescript
// From src/test/example.test.ts
import { describe, it, expect } from "vitest";

describe("example", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });
});
```

**Patterns:**
- Describe blocks group related tests by feature or component
- Individual test cases use `it()` for readable test descriptions
- Globals enabled means no explicit imports needed for describe/it/expect (but can be imported for clarity)

**Test Naming Convention:**
- Describe: lowercase, feature-focused (e.g., "example", "authentication", "file-download")
- It: descriptive action (e.g., "should pass", "should authenticate user", "should save to offline storage")

## Setup and Configuration

**Setup File Location:**
- `src/test/setup.ts`

**Current Setup:**
```typescript
import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
```

**What it Does:**
- Imports testing-library matchers for DOM assertions
- Polyfills `window.matchMedia` for components that use media queries
- Runs before each test suite

## Testing Libraries Available

**Core Testing:**
- `@testing-library/react` ^16.0.0 - React component testing
- `@testing-library/jest-dom` ^6.6.0 - Extended DOM matchers

**Mocking & Test Utilities:**
- `@playwright/test` ^1.57.0 - Available for E2E tests (installed but not configured in Vitest)
- `jsdom` ^20.0.3 - Browser environment simulation

**Not Detected:**
- Jest (Vitest used instead)
- Sinon or other mocking libraries
- Custom test utilities or factories

## Mocking

**Framework:**
- Vitest provides built-in mocking capabilities
- No explicit mock utilities detected in setup

**Patterns:**
- No existing mocks in codebase to reference
- Standard approach would use Vitest's `vi.mock()` for module mocking
- Browser APIs mocked in setup.ts (`window.matchMedia`)

**What to Mock:**
- External API calls (Supabase queries)
- Browser APIs (localStorage, fetch, audio playback)
- File system operations
- Timer functions (setTimeout, setInterval)

**What NOT to Mock:**
- React components (prefer rendering with testing-library)
- Context providers (test with actual providers when possible)
- Custom hooks (test through component rendering)
- Utility functions (test in isolation without mocking)

## Testing React Components

**Approach:**
- Use `@testing-library/react` for component tests
- Render components in jsdom environment
- Query and assert on rendered DOM

**Example Pattern (from setup):**
```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Component", () => {
  it("should render content", () => {
    render(<Component />);
    expect(screen.getByText("text")).toBeInTheDocument();
  });

  it("should handle interaction", async () => {
    render(<Component />);
    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("clicked")).toBeInTheDocument();
  });
});
```

## Testing Hooks

**Pattern for Custom Hooks:**
- Use `renderHook` from testing-library/react for hook testing
- Test hook in isolation or within component context
- Verify state changes and side effects

**Example (recommended approach):**
```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

describe("useOnlineStatus", () => {
  it("should return online status", async () => {
    const { result } = renderHook(() => useOnlineStatus());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
```

## Async Testing

**Pattern:**
- Use `waitFor` for async state updates
- Use `expect(...).rejects.toThrow()` for promise rejections
- Wrap async operations in `act()`

**Example:**
```typescript
it("should handle async operation", async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });
});
```

## Error Testing

**Pattern:**
- Test error states and error handling
- Mock APIs to return errors
- Verify error messages displayed to user

**Example:**
```typescript
it("should handle errors gracefully", async () => {
  vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
      from: () => ({
        select: () => Promise.reject(new Error("Network error"))
      })
    }
  }));

  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });
});
```

## Coverage

**Requirements:** Not enforced in configuration

**View Coverage:**
- To add coverage reporting, extend vitest config with:
  ```bash
  npm test -- --coverage
  ```
- Currently no coverage configuration in `vitest.config.ts`

## Test Types

**Unit Tests:**
- Scope: Individual functions, hooks, components
- Approach: Test in isolation, mock dependencies
- Location: Co-located with source files

**Integration Tests:**
- Scope: Multiple components working together, hooks with providers
- Approach: Render with actual providers/contexts
- Would test user flows through multiple components

**E2E Tests:**
- Framework: Playwright available (installed as `@playwright/test`)
- Status: Not configured in Vitest setup
- Would require separate configuration to run

**Current Test Coverage:**
- Only one example test exists (`example.test.ts`)
- Most of codebase is untested
- Test infrastructure in place but not utilized

## Fixtures and Test Data

**Test Data:**
- No existing fixtures or factories in codebase
- Would create interfaces matching types in codebase

**Recommended Pattern:**
```typescript
// src/test/fixtures/book.ts
export const createMockBook = (overrides = {}): Book => ({
  id: "test-book-1",
  title: "Test Book",
  author: "Test Author",
  cover_url: null,
  status: "published",
  ...overrides,
});

// Usage in tests
it("should display book", () => {
  const book = createMockBook({ title: "My Book" });
  render(<BookCard book={book} />);
  expect(screen.getByText("My Book")).toBeInTheDocument();
});
```

**Location:**
- Recommended: `src/test/fixtures/`
- Or: Co-located `__fixtures__` directories next to test files

## Testing Contexts and Providers

**Pattern:**
- Wrap components in provider when testing components that use contexts
- Mock context for isolated component testing

**Example (AuthContext):**
```typescript
describe("Component using Auth", () => {
  it("should work with auth", () => {
    const mockUser = { id: "123", email: "test@test.com" };

    render(
      <AuthProvider>
        <Component />
      </AuthProvider>
    );

    expect(screen.getByText("Authenticated")).toBeInTheDocument();
  });
});
```

## Testing Async Operations (React Query)

**Pattern:**
- Wrap component in QueryClientProvider
- Use `waitFor` to wait for queries to complete
- Mock Supabase client for data fetching

**Example:**
```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

it("should fetch and display books", async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  vi.mock("@/integrations/supabase/client", () => ({
    supabase: { from: () => ({ select: () => Promise.resolve({ data: [...] }) }) }
  }));

  render(
    <QueryClientProvider client={queryClient}>
      <BooksComponent />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.getByText("Book Title")).toBeInTheDocument();
  });
});
```

## Browser API Mocking

**Existing Examples:**
- `window.matchMedia` polyfilled in setup for media query support

**Common Mocks Needed:**
```typescript
// localStorage
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    blob: () => Promise.resolve(new Blob()),
  })
);

// navigator.onLine
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});
```

## Best Practices

1. **Test user behavior, not implementation details** - Test what users see and interact with
2. **Use data-testid sparingly** - Prefer semantic queries (getByRole, getByText, getByLabelText)
3. **Avoid testing library internals** - Don't mock React internals or test framework code
4. **Keep tests focused** - One concept per test
5. **Use descriptive test names** - Test name should explain what is being tested
6. **Clean up after tests** - Vitest handles this automatically with jsdom cleanup

## Running Tests

```bash
# Run all tests once
npm test

# Watch mode for TDD
npm run test:watch

# Run specific test file
npm test useOnlineStatus

# Run tests matching pattern
npm test -- --grep "authentication"
```

---

*Testing analysis: 2026-03-18*
