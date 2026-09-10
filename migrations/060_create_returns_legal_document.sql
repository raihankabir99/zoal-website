-- Establish the missing Return/Refund Legal document exactly once.
-- The payload mirrors the existing ReturnsConfig defaults so this migration
-- does not invent or overwrite an existing production policy.
-- Existing records are protected by the slug existence check.

DO $$
DECLARE
  returns_doc_id UUID;
  returns_version_id UUID;
  returns_content TEXT := $returns$
{
  "returnWindowDays": 7,
  "returnWindowDaysPromo": 14,
  "inspectionDaysEn": "1–3 Business Days",
  "inspectionDaysAr": "1-3 أيام عمل",
  "refundProcessingDaysEn": "3–10 Business Days",
  "refundProcessingDaysAr": "3-10 أيام عمل",
  "supportWhatsApp": "+966 56 769 9315",
  "supportEmail": "alzoal3003@gmail.com",
  "supportPhone": "+966 56 769 9315",
  "supportAddressEn": "Abu Bakr As Siddiq Rd, Almuallimeen, Al Hofuf 36361, Saudi Arabia",
  "supportAddressAr": "طريق أبو بكر الصديق، المعلمين، الهفوف 36361، المملكة العربية السعودية",
  "supportHoursEn": "Daily: 9:00 AM – 11:00 PM (AST)",
  "supportHoursAr": "يومياً: 9:00 صباحاً – 11:00 مساءً",
  "exchangeOptionsEn": [
    "Different Size",
    "Different Color",
    "Replacement Item (subject to stock availability)"
  ],
  "exchangeOptionsAr": [
    "مقاس مختلف",
    "لون مختلف",
    "منتج بديل (خاضع لتوفر المخزون)"
  ],
  "nonReturnableEn": [
    "Food & Beverage (Fresh bakery, bread, cakes, pastries, cookies, opened coffee or tea)",
    "Cosmetics & Personal Care (Opened beauty, skincare, makeup, perfumes)",
    "Personalized or Custom-Tailored Thobes and altered items",
    "Digital Gift Cards & Final Clearance/Sale items",
    "Hygiene-sensitive items"
  ],
  "nonReturnableAr": [
    "المأكولات والمشروبات (المخبوزات الطازجة، الخبز، الكعك، الحلويات، القهوة والشاي المفتوحة)",
    "مستحضرات التجميل والعناية الشخصية المفتوحة (منتجات العناية بالبشرة والمكياج والعطور المفتوحة)",
    "الثياب الفاخرة المفصلة خصيصاً بمقاسات معينة أو الملابس المعدلة",
    "بطاقات الهدايا الرقمية والمنتجات المشتراة في التصفية النهائية والخصومات",
    "المنتجات الحساسة لداعي الصحة والسلامة العامة والتعقيم"
  ]
}
$returns$;
BEGIN
  SELECT id INTO returns_doc_id
  FROM zoal_legal_documents
  WHERE slug = 'returns'
  LIMIT 1;

  IF returns_doc_id IS NULL THEN
    INSERT INTO zoal_legal_documents (slug, title)
    VALUES ('returns', 'Return & Refund Policy')
    RETURNING id INTO returns_doc_id;

    INSERT INTO zoal_legal_document_versions (document_id, content, version_number, status)
    VALUES (returns_doc_id, returns_content, 1, 'Published')
    RETURNING id INTO returns_version_id;

    UPDATE zoal_legal_documents
    SET current_version_id = returns_version_id,
        updated_at = NOW()
    WHERE id = returns_doc_id;
  END IF;
END $$;
