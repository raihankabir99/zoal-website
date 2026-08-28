/**
 * Universal Scroll-to-Section Navigation Engine for ZOAL Legal & Policy Pages
 * 
 * Accurately aligns target sections directly beneath the fixed Navbar and ReadingProgressBar
 * across all device breakpoints without gaps or overlaps.
 */

/**
 * Calculates the exact dynamic offset for the fixed Navbar + ReadingProgressBar
 * Responsive dimensions:
 * - Mobile (<640px): 50px (Navbar) + 3px (ReadingProgressBar) + 12px (Clearance) = 65px
 * - sm (640px - 767px): 64px (Navbar) + 3px (ReadingProgressBar) + 14px (Clearance) = 81px
 * - md (768px - 1023px): 68px (Navbar) + 3px (ReadingProgressBar) + 16px (Clearance) = 87px
 * - lg+ (>=1024px): 72px (Navbar) + 3px (ReadingProgressBar) + 18px (Clearance) = 93px
 */
export function getLegalHeaderOffset(): number {
  if (typeof window === 'undefined') return 80;
  const width = window.innerWidth;
  if (width < 640) {
    return 65;
  } else if (width < 768) {
    return 81;
  } else if (width < 1024) {
    return 87;
  } else {
    return 93;
  }
}

export interface ScrollToLegalSectionOptions {
  id: string;
  element?: HTMLElement | null;
  onExpand?: (id: string) => void;
  onSelect?: (id: string) => void;
  closeMobileMenu?: () => void;
  behavior?: ScrollBehavior;
}

/**
 * Universal safe scroll-to-section navigation handler for ZOAL legal & policy pages.
 * Handles accordion expansion, DOM layout reflow, and precise header clearance.
 */
export function scrollToLegalSection({
  id,
  element,
  onExpand,
  onSelect,
  closeMobileMenu,
  behavior = 'smooth',
}: ScrollToLegalSectionOptions): void {
  // 1. If an expand handler is provided (for collapsible/accordion sections), expand first
  if (onExpand) {
    onExpand(id);
  }

  // 2. Close mobile TOC/dropdown if open
  if (closeMobileMenu) {
    closeMobileMenu();
  }

  // 3. Mark the section as active
  if (onSelect) {
    onSelect(id);
  }

  // 4. Delay scroll execution slightly if expanding to allow DOM layout reflow
  const delay = onExpand ? 80 : 0;

  const performScroll = () => {
    const targetElement = element || document.getElementById(id);
    if (!targetElement) return;

    const offset = getLegalHeaderOffset();
    const elementRect = targetElement.getBoundingClientRect();
    const targetScrollTop = elementRect.top + window.scrollY - offset;

    window.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior,
    });
  };

  if (delay > 0) {
    setTimeout(performScroll, delay);
  } else {
    requestAnimationFrame(performScroll);
  }
}
