import { navigate } from './navigate';

export function goBack(): void {
  if (window.history.length > 1) window.history.back();
  else navigate({ page: 'library', category: 'all' });
}
