import type { Router } from 'expo-router';

/**
 * Go back if there is history; otherwise replace with fallback href.
 * Use this for back buttons so GO_BACK is never unhandled (e.g. when opening a deep link or first screen).
 */
export function safeBack(router: Router, fallbackHref: string): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackHref as never);
  }
}
