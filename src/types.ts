export type RSVPStatus = "PENDING" | "CONFIRMED" | "DECLINED";
export type RSVPSubmissionStatus = Exclude<RSVPStatus, "PENDING">;

export interface PublicEvent {
  name: string;
  starts_at: string;
  timezone: string;
  location: string;
  rsvp_deadline: string;
}

export interface PublicInvitation {
  description: string;
  responsible_name: string;
  guest_limit: number;
}

export interface PublicRSVPState {
  status: RSVPStatus;
  guests: string[];
  can_respond: boolean;
}

export interface PublicRSVP {
  event: PublicEvent;
  invitation: PublicInvitation;
  rsvp: PublicRSVPState;
}

export interface RSVPSubmission {
  status: RSVPSubmissionStatus;
  guests: string[];
}
