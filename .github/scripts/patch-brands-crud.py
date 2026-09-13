from pathlib import Path

path = Path('src/components/BrandManagement.tsx')
s = path.read_text(encoding='utf-8')

# The Brands CRUD patch is already present on the audited branch.
# Keep this repair step idempotent: never duplicate or rewrite the component.
required_markers = ('getBrandAuthHeaders', 'refreshBrandsFromServer')
if all(marker in s for marker in required_markers):
    print('Brands CRUD patch already present; no changes required')
    raise SystemExit(0)

raise SystemExit('Brands CRUD patch is missing; refusing unsafe automatic reconstruction')
