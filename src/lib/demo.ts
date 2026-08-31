/**
 * Demo data for the preview shell. Everything here is placeholder — it exists
 * so the redesigned pages have something to render before the real Supabase
 * queries land. Delete this file when data is wired up.
 */

import type { Expense, Member } from "./types";

export const DEMO_MEMBERS: Member[] = [
  { id: "1", first_name: "yueran", display_name: "Yueran", email: null, avatar_color: "#f97316", created_at: "", deactivated_at: null },
  { id: "2", first_name: "dory", display_name: "Dory", email: null, avatar_color: "#3b82f6", created_at: "", deactivated_at: null },
  { id: "3", first_name: "jenny", display_name: "Jenny", email: null, avatar_color: "#ec4899", created_at: "", deactivated_at: null },
  { id: "4", first_name: "eric", display_name: "Eric", email: null, avatar_color: "#10b981", created_at: "", deactivated_at: null },
  { id: "5", first_name: "siva", display_name: "Siva", email: null, avatar_color: "#8b5cf6", created_at: "", deactivated_at: null },
];

export const DEMO_EXPENSES: Expense[] = [
  {
    id: "e1",
    date: "2026-08-27",
    paid_by: "2",
    description: "Kimi API",
    category: "software",
    amount_cents: 2770,
    note: null,
    created_at: "",
    deleted_at: null,
  },
  {
    id: "e2",
    date: "2026-08-15",
    paid_by: "1",
    description: "Domain from GoDaddy (miluo.ca)",
    category: "other",
    amount_cents: 5058,
    note: null,
    created_at: "",
    deleted_at: null,
  },
];

export const DEMO_CURRENT_MEMBER_ID = "1";
