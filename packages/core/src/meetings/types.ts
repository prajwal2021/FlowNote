export type MeetingStatus = 'recording' | 'transcribing' | 'ready' | 'failed';

export type MeetingSpeaker = 'me' | 'others';

export interface MeetingSource {
  app?: { name: string; id?: string };
  window?: { title: string | null };
}

export interface Meeting {
  id: string;
  title: string;
  startedAt: number;
  endedAt: number | null;
  status: MeetingStatus;
  source: MeetingSource;
  participantsNotified: boolean;
  notifiedAt: number | null;
  micOnly: boolean;
  failureReason?: string;
  deletedAt: number | null;
}

export interface MeetingSegment {
  id: string;
  meetingId: string;
  speaker: MeetingSpeaker;
  start: number;
  end: number;
  text: string;
}

export interface MeetingFrame {
  id: string;
  meetingId: string;
  atSec: number;
  blob: Blob;
  src?: string;
  mimeType: string;
  width: number;
  height: number;
}

export type StoredMeetingFrame = Omit<MeetingFrame, 'blob'> & { blob?: Blob };

export interface MeetingActionItem {
  text: string;
  owner: string | null;
  due: string | null;
  mine: boolean;
  atSec: number | null;
}

export interface MeetingInsights {
  meetingId: string;
  summary: string;
  takeaways: string[];
  decisions: string[];
  actionItems: MeetingActionItem[];
  generatedAt: number;
  model: string;
}

export interface MeetingAnswer {
  question: string;
  answer: string;
  citations: number[];
  askedAt: number;
}
