const MY_APPS_CHANGED_EVENT = "ui:my-apps-changed";

export function emitMyAppsChanged() {
  window.dispatchEvent(new CustomEvent(MY_APPS_CHANGED_EVENT));
}

export function onMyAppsChanged(handler) {
  window.addEventListener(MY_APPS_CHANGED_EVENT, handler);
  return () => window.removeEventListener(MY_APPS_CHANGED_EVENT, handler);
}

