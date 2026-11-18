/**
 * Jedna skala z-indexów dla całej aplikacji (klasy Tailwinda zapisane literalnie,
 * żeby JIT je wykrył). Kolejność od najniższej do najwyższej warstwy.
 */
export const LAYER = {
  /** Panele robocze (sidebar, lista) */
  panel: 'z-20',
  /** Górny pasek aplikacji */
  header: 'z-40',
  /** Mapa na pełnym ekranie */
  fullscreen: 'z-50',
  /** Przyciski/kontrolki pływające nad mapą lub panelem */
  floating: 'z-[60]',
  /** Listy podpowiedzi i menu rozwijane */
  dropdown: 'z-[70]',
  /** Modale (tło + okno) */
  modal: 'z-[100]',
} as const;
