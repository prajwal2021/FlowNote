export const SYSTEM_DEFAULT_VALUE = 'flownote-system-default';

export function toSelectValue(storedId: string): string {
  return storedId.trim() || SYSTEM_DEFAULT_VALUE;
}
