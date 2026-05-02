export type RuleSeverity = "error" | "warning" | "info" | "success";

export interface PolicyRule {
  id: string;
  icon: string;
  title_key: string;
  pending_desc_key: string;
  ok_desc_key: string;
  triggered_desc_key: string;
  severity: RuleSeverity;
  blocks_save: boolean;
  condition: string;
}

export interface InsightCmsItem {
  id: string;
  icon: string;
  severity: RuleSeverity;
  title_key: string;
  text_key: string;
  link_label_key?: string;
  condition: string;
}

export interface PolicyScreenConfig {
  part_id: string;
  compliance: PolicyRule[];
  insight: InsightCmsItem[];
}
