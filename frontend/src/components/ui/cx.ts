/** Łączy klasy CSS, pomijając wartości puste. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');
