export type Standard = "ISO 9001:2015" | "AS9100 Rev D" | "ISO 14001:2015" | "ISO 45001:2018";

export type EvidenceStatus = "found" | "partial" | "not_found";
export type ClauseStatus = "conforming" | "partial" | "gap";
export type Priority = "P1" | "P2" | "P3";
export type AssessmentStatus = "completed" | "running" | "draft";

export interface EvidenceItem {
  name: string;
  status: EvidenceStatus;
}

export interface ClauseResult {
  id: string;
  title: string;
  standard: Standard;
  status: ClauseStatus;
  priority: Priority | null;
  evidence: EvidenceItem[];
  gap: string | null;
  actionRequired: string | null;
}

export interface StandardResult {
  standard: Standard;
  score: number;
  totalClauses: number;
  conforming: number;
  partial: number;
  gaps: number;
  clauses: ClauseResult[];
}

export interface Assessment {
  id: string;
  name: string;
  date: string;
  status: AssessmentStatus;
  standards: Standard[];
  documents: string[];
  results: StandardResult[];
}
