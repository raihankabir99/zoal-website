export const downloadHtmlAsPdf = async (html: string, filename: string) => {
  if (typeof window === 'undefined') return;
  const html2pdf = (await import('html2pdf.js')).default;
  const element = document.createElement('div');
  element.innerHTML = html;
  
  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // @ts-ignore
  return html2pdf().from(element).set(opt).save();
};
