import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api";

/**
 * Tự động chuyển đổi mảng lỗi 422 Unprocessable Entity từ Laravel API sang React Hook Form errors
 *
 * @param err Lỗi bắt được từ try/catch (thường là ApiError)
 * @param setError Hàm setError từ useForm
 * @param setGeneralError Callback để gán lỗi tổng quan nếu có
 * @param fallbackMessage Thông báo lỗi mặc định nếu không parse được lỗi chi tiết
 * @returns Chuỗi thông báo lỗi tổng quan
 */
export function setFormApiErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  setGeneralError?: (msg: string) => void,
  fallbackMessage = "Đã xảy ra lỗi. Vui lòng kiểm tra lại thông tin."
): string {
  let message = fallbackMessage;

  if (err instanceof ApiError) {
    if (err.errors && typeof err.errors === "object") {
      for (const [key, msgs] of Object.entries(err.errors)) {
        const errorMsg = Array.isArray(msgs) ? msgs[0] : String(msgs);
        try {
          setError(key as Path<T>, {
            type: "server",
            message: errorMsg,
          });
        } catch {
          // Bỏ qua nếu field không tồn tại trong form schema
        }
      }
    }
    message = err.message || fallbackMessage;
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (setGeneralError) {
    setGeneralError(message);
  }

  return message;
}
