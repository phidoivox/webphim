import { useEffect, useRef, useState } from "react";

/**
 * Hook quản lý trạng thái mở/đóng Dropdown khi rê chuột (hover) và bấm ngoài (click outside).
 *
 * @param delayMs Thời gian trễ trước khi đóng dropdown khi rời chuột (mặc định 150ms)
 */
export function useHoverDropdown(delayMs = 150) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, delayMs);
  };

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    open,
    setOpen,
    containerRef,
    handleMouseEnter,
    handleMouseLeave,
  };
}
