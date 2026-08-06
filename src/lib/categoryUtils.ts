export interface CategoryLike {
  id?: string;
  slug?: string;
  name?: string;
  nameAr?: string;
  name_ar?: string;
  [key: string]: any;
}

/**
 * Standardized Category Resolver for ZOAL Sovereign System.
 * Priorities:
 * 1. Translation Key (store.category.<slug>) if available & non-empty
 * 2. cat.nameAr
 * 3. cat.name_ar
 * 4. cat.name
 * 5. cat.slug
 */
export function getLocalizedCategoryName(
  cat: CategoryLike | string | null | undefined,
  isArabic: boolean,
  t?: (key: string, options?: any) => string
): string {
  if (!cat) return '';

  if (typeof cat === 'string') {
    const slugKey = cat.toLowerCase().trim().replace(/\s+/g, '_');
    if (t) {
      const translationKey = `store.category.${slugKey}`;
      const translated = t(translationKey, { defaultValue: '' });
      if (translated && translated !== translationKey && translated.trim() !== '') {
        return translated;
      }
    }
    return cat;
  }

  const slug = (cat.slug || cat.id || '').toLowerCase().trim().replace(/\s+/g, '_');

  if (isArabic) {
    if (cat.nameAr && cat.nameAr.trim() !== '') {
      return cat.nameAr;
    }
    if (cat.name_ar && cat.name_ar.trim() !== '') {
      return cat.name_ar;
    }
    if (t && slug) {
      const translationKey = `store.category.${slug}`;
      const translated = t(translationKey, { defaultValue: '' });
      if (translated && translated !== translationKey && translated.trim() !== '') {
        return translated;
      }
    }
    return cat.name || cat.slug || cat.id || '';
  }

  // Non-Arabic (English)
  if (t && slug) {
    const translationKey = `store.category.${slug}`;
    const translated = t(translationKey, { defaultValue: '' });
    if (translated && translated !== translationKey && translated.trim() !== '') {
      return translated;
    }
  }

  return cat.name || cat.nameAr || cat.name_ar || cat.slug || cat.id || '';
}
