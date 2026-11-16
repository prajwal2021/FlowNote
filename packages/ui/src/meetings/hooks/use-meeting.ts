import { meetingStore } from '@flownote/core/meetings/meeting-store';
import type { Meeting, MeetingFrame, MeetingInsights, MeetingSegment } from '@flownote/core/meetings/types';
import { useCallback, useEffect, useState } from 'react';

export interface LoadedMeeting {
  meeting: Meeting | null;
  segments: MeetingSegment[];
  frames: MeetingFrame[];
  insights: MeetingInsights | null;
  loading: boolean;
  reload: () => void;
}

export function useMeeting(meetingId: string): LoadedMeeting {
  const [state, setState] = useState<Omit<LoadedMeeting, 'reload'>>({
    meeting: null,
    segments: [],
    frames: [],
    insights: null,
    loading: true,
  });

  const load = useCallback(async () => {
    const [meeting, segments, frames, insights] = await Promise.all([
      meetingStore.getMeeting(meetingId),
      meetingStore.getSegments(meetingId),
      meetingStore.getFrames(meetingId),
      meetingStore.getInsights(meetingId),
    ]);
    setState({
      meeting: meeting ?? null,
      segments,
      frames,
      insights: insights ?? null,
      loading: false,
    });
  }, [meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: () => void load() };
}
