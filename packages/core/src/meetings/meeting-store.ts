import { db } from '@/core/guides/db';
import type {
  Meeting,
  MeetingFrame,
  MeetingInsights,
  MeetingSegment,
  MeetingSource,
  MeetingStatus,
  StoredMeetingFrame,
} from './types';

async function hydrateFrame(row: StoredMeetingFrame): Promise<MeetingFrame | null> {
  if (row.blob) return row as MeetingFrame;
  if (!row.src) return null;
  const response = await fetch(row.src).catch(() => null);
  if (!response?.ok) return null;
  return { ...row, blob: await response.blob() };
}

export const meetingStore = {
  async createMeeting(id: string, title: string, source: MeetingSource, micOnly: boolean): Promise<Meeting> {
    const meeting: Meeting = {
      id,
      title,
      startedAt: Date.now(),
      endedAt: null,
      status: 'recording',
      source,
      participantsNotified: false,
      notifiedAt: null,
      micOnly,
      deletedAt: null,
    };
    await db.meetings.put(meeting);
    return meeting;
  },

  async markNotified(id: string): Promise<void> {
    await db.meetings.update(id, { participantsNotified: true, notifiedAt: Date.now() });
  },

  async setMeetingStatus(id: string, status: MeetingStatus, failureReason?: string): Promise<void> {
    await db.meetings.update(id, {
      status,
      ...(failureReason === undefined ? {} : { failureReason }),
    });
  },

  async endMeeting(id: string): Promise<void> {
    await db.meetings.update(id, { endedAt: Date.now(), status: 'transcribing' });
  },

  async renameMeeting(id: string, title: string): Promise<void> {
    const clean = title.replace(/\s+/g, ' ').trim();
    if (clean) await db.meetings.update(id, { title: clean });
  },

  getMeeting(id: string): Promise<Meeting | undefined> {
    return db.meetings.get(id);
  },

  async getMeetings(): Promise<Meeting[]> {
    const rows = await db.meetings.orderBy('startedAt').reverse().toArray();
    return rows.filter((row) => row.deletedAt === null);
  },

  async softDeleteMeeting(id: string): Promise<void> {
    await db.meetings.update(id, { deletedAt: Date.now() });
  },

  async permanentlyDeleteMeeting(id: string): Promise<void> {
    await db.transaction('rw', db.meetings, db.meetingSegments, db.meetingFrames, db.meetingInsights, async () => {
      await db.meetingSegments.where('meetingId').equals(id).delete();
      await db.meetingFrames.where('meetingId').equals(id).delete();
      await db.meetingInsights.where('meetingId').equals(id).delete();
      await db.meetings.delete(id);
    });
  },

  async addSegments(segments: MeetingSegment[]): Promise<void> {
    if (segments.length > 0) await db.meetingSegments.bulkPut(segments);
  },

  async getSegments(meetingId: string): Promise<MeetingSegment[]> {
    const rows = await db.meetingSegments.where('meetingId').equals(meetingId).toArray();
    return rows.sort((a, b) => a.start - b.start || a.end - b.end);
  },

  async addFrame(frame: MeetingFrame): Promise<void> {
    await db.meetingFrames.put(frame);
  },

  async getFrames(meetingId: string): Promise<MeetingFrame[]> {
    const rows = await db.meetingFrames.where('meetingId').equals(meetingId).toArray();
    const hydrated = await Promise.all(rows.sort((a, b) => a.atSec - b.atSec).map(hydrateFrame));
    return hydrated.filter((row): row is MeetingFrame => row !== null);
  },

  async frameNear(meetingId: string, atSec: number): Promise<MeetingFrame | null> {
    const frames = await this.getFrames(meetingId);
    if (frames.length === 0) return null;
    return frames.reduce((best, frame) =>
      Math.abs(frame.atSec - atSec) < Math.abs(best.atSec - atSec) ? frame : best,
    );
  },

  async saveInsights(insights: MeetingInsights): Promise<void> {
    await db.meetingInsights.put(insights);
  },

  getInsights(meetingId: string): Promise<MeetingInsights | undefined> {
    return db.meetingInsights.get(meetingId);
  },
};
