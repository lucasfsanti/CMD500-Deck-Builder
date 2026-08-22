import type { CaptureResult } from "./deck-page-parser";

export type PageParser = (root: ParentNode) => CaptureResult;

/**
 * Re-runs page capture whenever LigaMagic's page content changes after the
 * extension's first parse attempt (e.g. an asynchronous data load that
 * finishes after document_idle), so captured state never goes stale without
 * a manual refresh, per deck-page-capture's sync requirement.
 *
 * Takes the parser as a parameter (rather than hardcoding parseDeckPage) so
 * the caller can select parseDeckPage or parseCollectionPage based on which
 * kind of LigaMagic page is open.
 */
export function watchPage(
  root: ParentNode & Node,
  parse: PageParser,
  onCapture: (result: CaptureResult) => void,
): () => void {
  onCapture(parse(root));

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    // Coalesce bursts of mutations (a page reload fires many DOM changes at
    // once) into a single re-parse on the next microtask/frame.
    queueMicrotask(() => {
      scheduled = false;
      onCapture(parse(root));
    });
  });

  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}
