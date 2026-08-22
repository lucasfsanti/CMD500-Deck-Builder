import { createRoot } from "react-dom/client";
import { detectLigaMagicPage, type LigaMagicPageKind } from "./page-detection";
import { PanelRoot } from "./panel-root";
import panelStyles from "../ui/panel.css";

function injectPanel(pageKind: LigaMagicPageKind): void {
  const host = document.createElement("div");
  host.id = "commander-500-deckbuilder-root";
  document.body.appendChild(host);

  // Rendered in a shadow root so the panel's styles never leak into (or clash
  // with) LigaMagic's own page, and vice versa.
  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleTag = document.createElement("style");
  styleTag.textContent = panelStyles;
  shadowRoot.appendChild(styleTag);

  const mountPoint = document.createElement("div");
  shadowRoot.appendChild(mountPoint);

  createRoot(mountPoint).render(<PanelRoot watchRoot={document.body} pageKind={pageKind} />);
}

const pageKind = detectLigaMagicPage(new URL(window.location.href));
if (pageKind !== "none") {
  injectPanel(pageKind);
}
