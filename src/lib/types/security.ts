export interface SecurityCheck {
  id: string
  context_id: string
  category: "auth_authz" | "input_data" | "ai_specific" | "race_conditions" | "secrets" | "exposure"
  check_key: string
  label: string
  status: "pass" | "warn" | "fail" | "pending" | "na"
  last_checked_at?: string
  notes?: string
  auto_checkable: boolean
}
