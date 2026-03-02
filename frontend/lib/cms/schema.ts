import { z } from "zod";

/**
 * Recursive CMS node schema.
 *
 * Supported types:
 *   layout.page        — root wrapper, renders children
 *   layout.card        — white card container
 *   layout.action-bar  — horizontal button row, auto_hide_if_empty supported
 *   layout.form        — collapsible form panel (shown when activeFormId matches)
 *   display.field      — read-only label+value row, data_key → expense field
 *   input.button       — action button, label resolved via t(label_key)
 *   input.textarea     — controlled textarea, label resolved via t(label_key)
 *
 * Unknown types are silently skipped during rendering.
 *
 * function_id: when present, the node (and all its children) are hidden
 * unless the current user has that function ID granted.
 */

// z.lazy() is required for recursive types
export type CmsNode = {
  id: string;
  type: string;
  function_id?: number;
  auto_hide_if_empty?: boolean;
  parts?: CmsNode[];
  // display.field
  data_key?: string;
  // input.button
  label_key?: string;
  variant?: string;
  action?: string;
  // input.textarea
  required?: boolean;
};

export const CmsNodeSchema: z.ZodType<CmsNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    function_id: z.number().optional(),
    auto_hide_if_empty: z.boolean().optional(),
    parts: z.array(CmsNodeSchema).optional(),
    data_key: z.string().optional(),
    label_key: z.string().optional(),
    variant: z.string().optional(),
    action: z.string().optional(),
    required: z.boolean().optional(),
  })
);

export const ScreenConfigSchema = z.object({
  screen_key: z.string(),
  root: CmsNodeSchema,
});

export type ScreenConfig = z.infer<typeof ScreenConfigSchema>;
