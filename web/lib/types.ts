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
  created_at: string;
  updated_at: string;
};
