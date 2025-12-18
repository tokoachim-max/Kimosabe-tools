const input = document.getElementById("imageInput");
const button = document.getElementById("compressBtn");
const result = document.getElementById("result");

button.addEventListener("click", () => {
  if (!input.files.length) {
    alert("Please select an image first.");
    return;
  }

  result.innerHTML = "<p>Processing...</p>";

  const file = input.files[0];
  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => img.src = e.target.result;

  img.onload = () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale = 0.7;
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      result.innerHTML = `
        <a class="tool-card" href="${url}" download="compressed-${file.name}">
          Download Compressed Image
        </a>
        <p class="donate-inline">
  ❤️ <a href="../donate.html">Support Kimosabe Tools</a>
        </p>

      `;
    }, "image/jpeg", 0.7);
  };

  reader.readAsDataURL(file);
});
