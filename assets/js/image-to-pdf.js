const { jsPDF } = window.jspdf;

const input = document.getElementById("imageInput");
const button = document.getElementById("convertBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

button.addEventListener("click", async () => {
  if (!input.files.length) {
    alert("Please select one or more images.");
    return;
  }

  status.textContent = "Creating PDF...";
  result.innerHTML = "";

  const pdf = new jsPDF();
  const files = Array.from(input.files);

  for (let i = 0; i < files.length; i++) {
    const imgData = await readImage(files[i]);

    const img = new Image();
    img.src = imgData;

    await img.decode();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (img.height * pageWidth) / img.width;

    if (i > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
  }

  status.textContent = "Done!";
  result.innerHTML = `
    <button class="tool-card" id="downloadPdf">Download PDF</button>
  `;

  document.getElementById("downloadPdf").onclick = () => {
    pdf.save("images-to-pdf.pdf");
  };
});

function readImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}
