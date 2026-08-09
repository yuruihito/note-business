export type RequestStatus = "queued" | "in_progress" | "done" | "failed";

export type CeoRequest = {
  id: string;
  text: string;
  status: RequestStatus;
  result: string | null;
  created_at: string;
  completed_at: string | null;
};

export type IdeaStatus = "draft" | "approved" | "rejected";

export type ContentIdea = {
  id: string;
  title: string;
  summary: string;
  market_notes: string | null;
  body: string | null;
  status: IdeaStatus;
  decision_reason: string | null;
  note_draft_url: string | null;
  created_at: string;
  updated_at: string;
};

export type OfficeDept = "cmo" | "cfo" | "ceo" | "secretary";

export type OfficeProfile = {
  dept: OfficeDept;
  display_name: string;
  updated_at: string;
};

export type ActivityActor = "orchestrator" | "cmo" | "cfo" | "secretary";

export type ActivityLogEntry = {
  id: string;
  actor: ActivityActor;
  message: string;
  request_id: string | null;
  created_at: string;
};

export type Setting = {
  key: string;
  value: string;
  updated_at: string;
};
