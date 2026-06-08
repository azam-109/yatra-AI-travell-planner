import jsPDF from "jspdf";

export function exportTripPdf(title, content) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 42;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(content, width);
  let y = 76;
  lines.forEach((line) => {
    if (y > 780) {
      doc.addPage();
      y = 42;
    }
    doc.text(line, margin, y);
    y += 14;
  });
  doc.save(`${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`);
}
