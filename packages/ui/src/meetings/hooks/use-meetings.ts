import { meetingStore } from '@flownote/core/meetings/meeting-store';
import type { Meeting } from '@flownote/core/meetings/types';
import { useCallback, useEffect, useState } from 'react';

export function useMeetings(): { meetings: Meeting[]; loading: boolean; reload: () => void } {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    let live = true;
    void meetingStore
      .getMeetings()
      .then((rows) => {
        if (!live) return;
        setMeetings(rows);
        setLoading(false);
      })
      .catch(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => reload(), [reload]);

  return { meetings, loading, reload: () => void reload() };
}
