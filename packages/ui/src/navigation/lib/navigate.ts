import type { Route } from '../types';
import { guideHash } from './guide-hash';

export function navigate(route: Route) {
  if (route.page === 'guide') {
    window.location.hash = guideHash(route);
  } else if (route.page === 'meetings') {
    window.location.hash = '#meetings';
  } else if (route.page === 'meeting') {
    window.location.hash = `#meeting/${route.meetingId}`;
  } else if (route.category === 'all') {
    window.location.hash = '#library';
  } else {
    window.location.hash = `#library/${route.category}`;
  }
}
