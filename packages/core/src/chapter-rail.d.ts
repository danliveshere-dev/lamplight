/** Enhance a chapter rail. Call the returned function to restore its static navigation. */
export declare function initChapterRail(
  rail?: HTMLElement | null,
  options?: { header?: HTMLElement | null }
): () => void;
