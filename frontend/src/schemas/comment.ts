import { z } from "zod";

/**
 * Validation schema cho biểu mẫu gửi bình luận
 */
export const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, "Bình luận phải có ít nhất 2 ký tự.")
    .max(2000, "Bình luận không được vượt quá 2000 ký tự."),
  is_spoiler: z.boolean(),
  parent_id: z.number().nullable().optional(),
});


export type CommentInput = z.infer<typeof commentSchema>;
