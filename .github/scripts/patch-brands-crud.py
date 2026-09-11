from pathlib import Path

path = Path('src/components/BrandManagement.tsx')
s = path.read_text()
if 'getBrandAuthHeaders' in s or 'refreshBrandsFromServer' in s:
    raise SystemExit('Brands patch markers already present; refusing duplicate patch')

anchor = '  // Search & Filters\n'
if s.count(anchor) != 1:
    raise SystemExit('Search & Filters anchor mismatch')

helpers = '''  const getBrandAuthHeaders = () => {
    const token = localStorage.getItem('zoal_auth_token') || sessionStorage.getItem('zoal_auth_token') || '';
    return token ? { Authorization: 'Bearer ' + token } : {};
  };
  const mapApiBrand = (b: any): Brand => ({
    id: String(b.id), name: b.name || '', nameAr: b.name_ar || '', slug: b.slug || '', logoUrl: b.logo_url || '',
    coverBannerUrl: b.cover_banner_url || '', description: b.description || '', country: b.country || '', website: b.website || '',
    supportEmail: b.support_email || '', supportPhone: b.support_phone || '', brandStory: b.brand_story || '', brandStoryAr: b.brand_story_ar || '',
    featuredToggle: Boolean(b.featured_toggle), status: b.status || 'Published', seoTitle: b.seo_title || '', seoDescription: b.seo_description || '',
    seoKeywords: b.seo_keywords || '', canonicalUrl: b.canonical_url || '', openGraphImage: b.open_graph_image || '', structuredData: b.structured_data || '',
    galleryImages: Array.isArray(b.gallery_images) ? b.gallery_images : [], brandVideos: Array.isArray(b.brand_videos) ? b.brand_videos : [],
    createdAt: b.created_at || new Date().toISOString()
  });
  const mapUiBrandToApi = (b: Partial<Brand>) => ({
    name: b.name, slug: b.slug, description: b.description, logoUrl: b.logoUrl, nameAr: b.nameAr, coverBannerUrl: b.coverBannerUrl,
    country: b.country, website: b.website, supportEmail: b.supportEmail, supportPhone: b.supportPhone, brandStory: b.brandStory,
    brandStoryAr: (b as any).brandStoryAr, featuredToggle: b.featuredToggle, status: b.status, seoTitle: b.seoTitle,
    seoDescription: b.seoDescription, seoKeywords: b.seoKeywords, canonicalUrl: b.canonicalUrl, openGraphImage: b.openGraphImage,
    structuredData: b.structuredData, galleryImages: b.galleryImages || [], brandVideos: b.brandVideos || []
  });
  const refreshBrandsFromServer = async () => {
    const response = await fetch('/api/brands', { cache: 'no-store' });
    const result = await response.json();
    if (!response.ok || result?.success === false) throw new Error(result?.error || 'Brand fetch failed (' + response.status + ')');
    const serverBrands = Array.isArray(result?.data) ? result.data.map(mapApiBrand) : [];
    setBrands(serverBrands);
    return serverBrands;
  };
  useEffect(() => {
    refreshBrandsFromServer().catch(error => console.error('Brand management server sync failed:', error));
  }, [setBrands]);

'''
s = s.replace(anchor, helpers + anchor, 1)

def replace_between(start, end, replacement):
    global s
    a = s.index(start)
    b = s.index(end, a + len(start))
    s = s[:a] + replacement + s[b:]

replace_between('  // Save brand\n', '  // Delete a brand\n', '''  // Save brand
  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeRole === 'customer') { alert('Permission Denied: Read-only Website Access. Customers cannot register or modify brands.'); return; }
    if (!name || !slug) { alert('Brand Name (English) and Slug are required fields.'); return; }
    const galleryImages = galleryInput ? galleryInput.split(',').map(s => s.trim()).filter(Boolean) : [];
    const brandVideos = videoInput ? videoInput.split(',').map(s => s.trim()).filter(Boolean) : [];
    const brandData: any = { name, nameAr, slug, logoUrl, coverBannerUrl, description, country, website, supportEmail, supportPhone, brandStory, brandStoryAr, featuredToggle, status, seoTitle, seoDescription, seoKeywords, canonicalUrl, openGraphImage, structuredData, galleryImages, brandVideos };
    try {
      const response = await fetch('/api/brands', { method: editingBrand ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', ...getBrandAuthHeaders() }, body: JSON.stringify(editingBrand ? { ...brandData, id: editingBrand.id } : brandData) });
      const result = await response.json();
      if (!response.ok || result?.success === false) throw new Error(result?.error || 'Brand save failed (' + response.status + ')');
      await refreshBrandsFromServer();
      addLog(editingBrand ? 'Updated Luxury Brand: ' + name : 'Registered Luxury Brand: ' + name, editingBrand ? 'ID: ' + editingBrand.id : 'Slug: ' + slug);
      setIsFormOpen(false);
    } catch (error: any) { console.error('Brand save failed:', error); alert(error?.message || 'Brand could not be saved. No local-only save was performed.'); }
  };

''')

replace_between('  // Delete a brand\n', '  // Duplicate a brand\n', '''  // Delete a brand
  const handleDelete = async (id: string, brandName: string) => {
    if (activeRole === 'customer') { alert('Permission Denied: Read-only Website Access. Customers cannot delete brands.'); return; }
    if (activeRole === 'staff') { alert('Permission Denied: Staff level users are restricted from deleting brands.'); return; }
    if (!window.confirm('Are you absolutely sure you want to delete the premium brand "' + brandName + '"?')) return;
    try {
      const response = await fetch('/api/brands', { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...getBrandAuthHeaders() }, body: JSON.stringify({ id }) });
      const result = await response.json();
      if (!response.ok || result?.success === false) throw new Error(result?.error || 'Brand delete failed (' + response.status + ')');
      await refreshBrandsFromServer();
      setSelectedIds(prev => prev.filter(i => i !== id));
      addLog('Deleted Luxury Brand: ' + brandName, 'ID: ' + id);
    } catch (error: any) { console.error('Brand delete failed:', error); alert(error?.message || 'Brand could not be deleted.'); }
  };

''')

replace_between('  // Duplicate a brand\n', '  // Archive a brand\n', '''  // Duplicate a brand
  const handleDuplicate = async (brand: Brand) => {
    try {
      const duplicated = { ...brand, id: undefined, name: brand.name + ' (Copy)', slug: brand.slug + '-copy' };
      const response = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getBrandAuthHeaders() }, body: JSON.stringify(mapUiBrandToApi(duplicated)) });
      const result = await response.json();
      if (!response.ok || result?.success === false) throw new Error(result?.error || 'Brand duplicate failed');
      await refreshBrandsFromServer();
      addLog('Duplicated Brand: ' + brand.name, 'New Slug: ' + duplicated.slug);
    } catch (error: any) { console.error('Brand duplicate failed:', error); alert(error?.message || 'Brand could not be duplicated.'); }
  };

''')

replace_between('  // Archive a brand\n', '  // Bulk Actions\n', '''  // Archive / restore a brand
  const updateBrandStatus = async (id: string, brandName: string, nextStatus: Brand['status']) => {
    try {
      const response = await fetch('/api/brands', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getBrandAuthHeaders() }, body: JSON.stringify({ id, status: nextStatus }) });
      const result = await response.json();
      if (!response.ok || result?.success === false) throw new Error(result?.error || 'Brand status update failed');
      await refreshBrandsFromServer();
      addLog((nextStatus === 'Archived' ? 'Archived' : 'Restored') + ' Brand: ' + brandName, 'Status shifted to ' + nextStatus);
    } catch (error: any) { console.error('Brand status update failed:', error); alert(error?.message || 'Brand status could not be updated.'); }
  };
  const handleArchive = (id: string, brandName: string) => updateBrandStatus(id, brandName, 'Archived');
  const handleRestore = (id: string, brandName: string) => updateBrandStatus(id, brandName, 'Published');

  // Bulk Actions
''')

path.write_text(s)
print('Brands CRUD patch applied successfully')
