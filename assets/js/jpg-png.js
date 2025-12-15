const input = document.getElementById("imageInput");
const formatSelect = document.getElementById("formatSelect");
const button = document.getElementById("convertBtn");
const status = document.getElementById("status");
const result = document.getElementById("result");

button.addEventListener("click", () => {
  if (!input.files.length) {
    alert("Please select an image.");
    return;
  }

  status.textContent = "Converting...";
  result.innerHTML = "";

  const file = input.files[0];
  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => img.src = e.target.result;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext("2d");

    if (formatSelect.value === "jpeg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      status.textContent = "Done!";

      const ext = formatSelect.value === "jpeg" ? "jpg" : "png";

      result.innerHTML = `
        <a class="tool-card" href="${url}" download="converted.${ext}">
          Download Converted Image
        </a>
      `;
    }, `image/${formatSelect.value}`, 0.95);
  };

  reader.readAsDataURL(file);
});
