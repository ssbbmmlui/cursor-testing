export function needsPseudoFullscreen(
  userAgent: string,
  platform: string,
  maxTouchPoints: number,
): boolean {
  const iOS = /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
  const safari =
    /Safari/i.test(userAgent) &&
    !/Chrome|CriOS|Chromium|Edg|EdgiOS|OPR|OPiOS|Firefox|FxiOS|SamsungBrowser|Android/i.test(userAgent);
  return iOS || safari;
}

export function deviceNeedsPseudoFullscreen(): boolean {
  if (typeof navigator === 'undefined') return false;
  return needsPseudoFullscreen(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
}

export async function requestElementFullscreen(element: HTMLElement): Promise<boolean> {
  if (typeof element.requestFullscreen !== 'function') return false;
  try {
    await element.requestFullscreen();
    return document.fullscreenElement === element;
  } catch {
    return false;
  }
}
