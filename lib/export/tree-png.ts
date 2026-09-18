import {
  getNodesBounds,
  getViewportForBounds,
  type Node,
} from "@xyflow/react";
import { toPng } from "html-to-image";

const EXPORT_PADDING = 0.12;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 1.25;
const PIXEL_RATIO = 2;
const MAX_EDGE_PX = 6000;
const MIN_EDGE_PX = 720;
const BACKGROUND = "#f3f4f6";

export function pngExportFilename(familyName: string): string {
  const safe = familyName
    .trim()
    .replace(/[^\p{L}\p{N}\-_ ]+/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);

  return `${safe || "stammbaum"}.png`;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

/**
 * Exportiert den gesamten React-Flow-Baum als PNG (unabhängig vom aktuellen Zoom).
 */
export async function downloadTreePng(options: {
  nodes: Node[];
  viewportElement: HTMLElement;
  familyName: string;
}): Promise<void> {
  const { nodes, viewportElement, familyName } = options;

  if (nodes.length === 0) {
    throw new Error("EMPTY_TREE");
  }

  const bounds = getNodesBounds(nodes);
  const contentWidth = Math.max(bounds.width, 1);
  const contentHeight = Math.max(bounds.height, 1);

  // Bildgröße so wählen, dass Karten bei Zoom≈1 lesbar bleiben, aber Canvas-Limit wahren.
  const paddedWidth = contentWidth * (1 + EXPORT_PADDING * 2);
  const paddedHeight = contentHeight * (1 + EXPORT_PADDING * 2);
  const scale = Math.min(
    1,
    MAX_EDGE_PX / paddedWidth,
    MAX_EDGE_PX / paddedHeight
  );

  const imageWidth = Math.ceil(
    Math.max(MIN_EDGE_PX, paddedWidth * scale)
  );
  const imageHeight = Math.ceil(
    Math.max(MIN_EDGE_PX, paddedHeight * scale)
  );

  const viewport = getViewportForBounds(
    bounds,
    imageWidth,
    imageHeight,
    MIN_ZOOM,
    MAX_ZOOM,
    EXPORT_PADDING
  );

  const dataUrl = await toPng(viewportElement, {
    backgroundColor: BACKGROUND,
    width: imageWidth,
    height: imageHeight,
    pixelRatio: PIXEL_RATIO,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
    },
    filter: (domNode) => {
      if (!(domNode instanceof HTMLElement)) {
        return true;
      }
      return !(
        domNode.classList.contains("react-flow__controls") ||
        domNode.classList.contains("react-flow__minimap") ||
        domNode.classList.contains("react-flow__panel")
      );
    },
  });

  downloadDataUrl(dataUrl, pngExportFilename(familyName));
}
