export interface SupervisorUser {
  id: number;
  email: string;
}

export interface SupervisorEvent {
  id: number;
  name: string;
  role: "SUPERVISOR";
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  user: SupervisorUser;
  events: SupervisorEvent[];
}

export interface CheckInSession extends LoginResponse {
  selected_event_id: number | null;
}

export type PresenceStatus = "PENDING" | "PARTIAL" | "COMPLETE";

export interface Category {
  id: number;
  name: string;
}

export interface ParticipantPreview {
  id: number;
  name: string;
  is_present: boolean;
  matched?: boolean;
}

export interface InvitationSearchResult {
  id: number;
  description: string;
  responsible_name: string;
  category: Category;
  confirmed_count: number;
  present_count: number;
  presence_status: PresenceStatus;
  participants_preview: ParticipantPreview[];
  remaining_participants: number;
}

export interface UserSummary {
  id: number;
  email: string;
}

export interface CheckInSummary {
  id: number;
  checked_in_at: string;
  checked_in_by: UserSummary;
}

export interface CheckInHistoryItem extends CheckInSummary {
  cancelled_at: string | null;
  cancelled_by: UserSummary | null;
  cancellation_reason: string | null;
}

export interface OperationalGuest {
  id: number;
  name: string;
  is_present: boolean;
  active_check_in: CheckInSummary | null;
  check_in_history: CheckInHistoryItem[];
}

export interface InvitationDetail {
  id: number;
  description: string;
  responsible_name: string;
  category: Category;
  notes: string;
  confirmed_count: number;
  present_count: number;
  presence_status: PresenceStatus;
  guests: OperationalGuest[];
}

export interface CheckInMetrics {
  confirmed_guests: number;
  present_guests: number;
  pending_guests: number;
  invitations_total: number;
  invitations_pending: number;
  invitations_partial: number;
  invitations_complete: number;
}

export interface MutationResponse {
  result: "CHECKED_IN" | "ALREADY_PRESENT" | "CANCELLED";
  invitation: InvitationDetail;
  checked_in_guest_ids?: number[];
  already_present_guest_ids?: number[];
}
