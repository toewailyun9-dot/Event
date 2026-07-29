import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "@/hooks/useDebounce"

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 300))
    expect(result.current).toBe("hello")
  })

  it("updates value after delay", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 100 } }
    )

    rerender({ value: "world", delay: 100 })

    act(() => { vi.advanceTimersByTime(100) })

    expect(result.current).toBe("world")
  })

  it("does not update before delay completes", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 200 } }
    )

    rerender({ value: "updated", delay: 200 })

    act(() => { vi.advanceTimersByTime(100) })

    expect(result.current).toBe("initial")
  })

  it("only emits the latest value after rapid changes", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 100 } }
    )

    rerender({ value: "ab", delay: 100 })
    rerender({ value: "abc", delay: 100 })
    rerender({ value: "abcd", delay: 100 })

    act(() => { vi.advanceTimersByTime(150) })

    expect(result.current).toBe("abcd")
  })
})
