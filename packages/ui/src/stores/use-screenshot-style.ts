import { loadExportOptions, saveExportOptions } from '@flownote/core/export/options';
import type { ScreenshotStyle } from '@flownote/core/screenshot/screenshot-style';
import { create } from 'zustand';

interface ScreenshotStyleState {
  style: ScreenshotStyle;
  setStyle: (style: ScreenshotStyle) => void;
}

export const useScreenshotStyle = create<ScreenshotStyleState>((set) => {
  void loadExportOptions().then((options) => set({ style: options.screenshotStyle }));
  return {
    style: 'both',
    setStyle: (style) => {
      set({ style });
      void loadExportOptions().then((options) => saveExportOptions({ ...options, screenshotStyle: style }));
    },
  };
});
