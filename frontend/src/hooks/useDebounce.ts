import { useEffect, useState } from "react";

/**
 * Hook làm chậm (debounce) giá trị thay đổi để tối ưu hóa tần suất gọi API / tính toán.
 *
 * @param value Giá trị cần debounce
 * @param delayMs Thời gian trễ tính bằng mili-giây (mặc định 250ms)
 * @returns Giá trị sau khi đã debounce
 */
export function useDebounce<T>(value: T, delayMs = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debouncedValue;
}
