import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock dependencies before importing the hook
vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockReturnValue({ data: 0, isLoading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: "test-user-id" },
  }),
}));

vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: vi.fn().mockReturnValue({
    isPro: false,
    isLoading: false,
  }),
}));

import { useAccessControl } from "@/hooks/useAccessControl";
import { useSubscription } from "@/hooks/useSubscription";
import { useQuery } from "@tanstack/react-query";

describe("useAccessControl", () => {
  beforeEach(() => {
    vi.mocked(useSubscription).mockReturnValue({
      isPro: false,
      isLoading: false,
      isExpired: false,
      subscriptionType: "free",
      expiresAt: null,
    });
    vi.mocked(useQuery).mockReturnValue({
      data: 0,
      isLoading: false,
    } as any);
  });

  it("should have FREE_READS_LIMIT equal to 10", () => {
    const { result } = renderHook(() => useAccessControl());
    expect(result.current.freeReadsLimit).toBe(10);
  });

  it("should return canHighlight as always true regardless of count", () => {
    const { result } = renderHook(() => useAccessControl());
    // canHighlight should always return true, even with high counts
    expect(result.current.canHighlight(0)).toBe(true);
    expect(result.current.canHighlight(100)).toBe(true);
    expect(result.current.canHighlight(999)).toBe(true);
  });

  it("should return canReadFull true for Pro users regardless of read count", () => {
    vi.mocked(useSubscription).mockReturnValue({
      isPro: true,
      isLoading: false,
      isExpired: false,
      subscriptionType: "pro",
      expiresAt: null,
    });
    vi.mocked(useQuery).mockReturnValue({ data: 50, isLoading: false } as any);

    const { result } = renderHook(() => useAccessControl());
    expect(result.current.canReadFull("any-book-id")).toBe(true);
  });

  it("should return canReadFull true for free users with fewer than 10 reads", () => {
    vi.mocked(useQuery).mockReturnValue({ data: 5, isLoading: false } as any);

    const { result } = renderHook(() => useAccessControl());
    expect(result.current.canReadFull("new-book-id")).toBe(true);
  });

  it("should return canReadFull false for free users with 10 or more reads", () => {
    vi.mocked(useQuery).mockReturnValue({ data: 10, isLoading: false } as any);

    const { result } = renderHook(() => useAccessControl());
    expect(result.current.canReadFull("new-book-id")).toBe(false);
  });

  it("should return canReadFull true if user has existing progress on the book even at limit", () => {
    vi.mocked(useQuery).mockReturnValue({ data: 10, isLoading: false } as any);

    const { result } = renderHook(() => useAccessControl());
    expect(result.current.canReadFull("existing-book", ["existing-book", "other-book"])).toBe(true);
  });

  it("should not export highlightLimit or set it to Infinity", () => {
    const { result } = renderHook(() => useAccessControl());
    // highlightLimit should either not exist or be Infinity
    const limit = (result.current as any).highlightLimit;
    expect(limit === undefined || limit === Infinity).toBe(true);
  });

  it("should have freeReadsLimit equal to 10", () => {
    const { result } = renderHook(() => useAccessControl());
    expect(result.current.freeReadsLimit).toBe(10);
  });
});
