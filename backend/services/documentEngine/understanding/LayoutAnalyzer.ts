import { DocumentBlock, PageAnalysis } from '../core/NormalizedDocument';

export interface PageLayoutStructure {
  pageNumber: number;
  isTwoColumn: boolean;
  leftColumnBlocks: DocumentBlock[];
  rightColumnBlocks: DocumentBlock[];
  orderedBlocks: DocumentBlock[];
  headerBlocks: DocumentBlock[];
  footerBlocks: DocumentBlock[];
}

export class LayoutAnalyzer {
  /**
   * Analyzes page geometry, column splits, and reading order
   */
  static analyzePage(page: PageAnalysis): PageLayoutStructure {
    const blocks = [...page.blocks].sort((a, b) => a.order - b.order);

    const headerBlocks: DocumentBlock[] = [];
    const footerBlocks: DocumentBlock[] = [];
    const contentBlocks: DocumentBlock[] = [];

    const pageHeight = page.height || 1000;
    const pageWidth = page.width || 800;

    for (const b of blocks) {
      const text = b.text.trim();

      // Header / Footer Detection by position & page numbers
      if (b.bbox) {
        if (b.bbox.y < pageHeight * 0.08 && /page\s*\d+|[0-9]{1,3}$/i.test(text)) {
          headerBlocks.push(b);
          continue;
        }
        if (b.bbox.y > pageHeight * 0.92 && /page\s*\d+|[0-9]{1,3}$/i.test(text)) {
          footerBlocks.push(b);
          continue;
        }
      } else {
        if (/^(?:page\s*\d+|-?\s*\d+\s*-?)$/i.test(text)) {
          footerBlocks.push(b);
          continue;
        }
      }

      contentBlocks.push(b);
    }

    // Determine if page has two-column layout using bounding box horizontal midpoints
    const blocksWithBbox = contentBlocks.filter(b => b.bbox);
    let isTwoColumn = false;
    const leftColumnBlocks: DocumentBlock[] = [];
    const rightColumnBlocks: DocumentBlock[] = [];

    if (blocksWithBbox.length > 4) {
      const midX = pageWidth / 2;
      const leftCount = blocksWithBbox.filter(b => (b.bbox!.x + b.bbox!.width) < midX + 20).length;
      const rightCount = blocksWithBbox.filter(b => b.bbox!.x > midX - 20).length;

      if (leftCount > 2 && rightCount > 2) {
        isTwoColumn = true;
      }
    }

    if (isTwoColumn) {
      const midX = pageWidth / 2;
      for (const b of contentBlocks) {
        if (b.bbox && b.bbox.x >= midX - 20) {
          rightColumnBlocks.push(b);
        } else {
          leftColumnBlocks.push(b);
        }
      }
      // Re-order blocks left column top-to-bottom then right column top-to-bottom
      const sortedLeft = leftColumnBlocks.sort((a, b) => (a.bbox?.y || a.order) - (b.bbox?.y || b.order));
      const sortedRight = rightColumnBlocks.sort((a, b) => (a.bbox?.y || a.order) - (b.bbox?.y || b.order));
      contentBlocks.length = 0;
      contentBlocks.push(...sortedLeft, ...sortedRight);
    }

    return {
      pageNumber: page.pageNumber,
      isTwoColumn,
      leftColumnBlocks,
      rightColumnBlocks,
      orderedBlocks: contentBlocks,
      headerBlocks,
      footerBlocks
    };
  }
}
