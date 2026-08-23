import { createRoot } from "react-dom/client";
import { TabRoot } from "./TabRoot";
import panelStyles from "../ui/panel.css";

const styleTag = document.createElement("style");
styleTag.textContent = panelStyles;
document.head.appendChild(styleTag);

const mountPoint = document.getElementById("root");
if (mountPoint) {
  createRoot(mountPoint).render(<TabRoot />);
}
