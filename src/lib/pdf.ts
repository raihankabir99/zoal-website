import html2pdf from 'html2pdf.js';

export const downloadHtmlAsPdf = (html: string, filename: string) => {
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
