const input = document.getElementById("pdfInput");
const button = document.getElementById("mergeBtn");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
  if (input.files.length < 2) {
    alert("Please select at least two PDF files.");
    return;
  }

  result.innerHTML = "<p>Merging PDFs...</p>";

  const mergedPdf = await PDFLib.PDFDocument.create();

  for (const file of input.files) {
    const bytes = await file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  result.innerHTML = `
    <a class="tool-card" href="${url}" download="merged.pdf">
      Download Merged PDF
    </a>
  `;
});
