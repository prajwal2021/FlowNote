import { canExportVideo } from '@flownote/core/export/video-support';
import { useEffect, useState } from 'react';

export function useVideoSupported(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    let alive = true;
    void canExportVideo().then((can) => {
      if (alive) setSupported(can);
    });
    return () => {
      alive = false;
    };
  }, []);
  return supported;
}
