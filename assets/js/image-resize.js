const input = document.getElementById("resizeInput");
const widthInput = document.getElementById("widthInput");
const button = document.getElementById("resizeBtn");
const result = document.getElementById("resizeResult");

button.addEventListener("click", () => {
  if (!input.files.length || !widthInput.value) {
    alert("Please select an image and enter width.");
    return;
  }

  const file = input.files[0];
  const newWidth = parseInt(widthInput.value, 10);

  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => img.src = e.target.result;

  img.onload = () => {
    const scale = newWidth / img.width;
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      result.innerHTML = `
        <p>Resized Image:</p>
        <a href="${url}" download="resized-${file.name}">
          Download Image
        </a>
      `;
    }, "image/jpeg", 0.9);
  };

  reader.readAsDataURL(file);
});
