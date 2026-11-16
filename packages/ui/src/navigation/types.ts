export type Route =
  | { page: 'library'; category: 'all' | 'starred' | 'trash' }
  | { page: 'meetings' }
  | { page: 'meeting'; meetingId: string }
  | {
      page: 'guide';
      guideId: string;
      stepId?: string;
      tool?: 'annotate' | 'redact' | 'crop' | 'target';
      copied?: { stepIds: string[]; from: string };
    };
