let counter = 0;

/** Unikalny identyfikator elementu tworzonego w przeglądarce (np. `i-lq3k9x-0`). */
export const newId = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
