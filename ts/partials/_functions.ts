declare const ga: (...args: unknown[]) => void;

export function addCommas(intNum: number): string {
  return (intNum + "").replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function sendEvent(c: string, a: string, l?: string, v?: number): void {
  if (v) {
    ga("send", "event", { eventCategory: c, eventAction: a, eventLabel: l, eventValue: v });
  } else if (l) {
    ga("send", "event", { eventCategory: c, eventAction: a, eventLabel: l });
  } else {
    ga("send", "event", { eventCategory: c, eventAction: a });
  }
}
