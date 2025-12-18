const input = document.getElementById("resizeInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const lockRatio = document.getElementById("lockRatio");
const button = document.getElementById("resizeBtn");
const result = document.getElementById("resizeResult");
const status = document.getElementById("resizeStatus");

let originalWidth, originalHeight;

input.addEventListener("change", () => {
  const file = input.files[0];
  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => img.src = e.target.result;
  img.onload = () => {
    originalWidth = img.width;
    originalHeight = img.height;
    widthInput.value = originalWidth;
    heightInput.value = originalHeight;
  };
  reader.readAsDataURL(file);
});

button.addEventListener("click", () => {
  if (!input.files.length) {
    alert("Please select an image.");
    return;
  }

  status.textContent = "Processing...";
  result.innerHTML = "";

  const file = input.files[0];
  let newWidth = parseInt(widthInput.value);
  let newHeight = parseInt(heightInput.value);

  if (lockRatio.checked) {
    const ratio = originalWidth / originalHeight;
    if (newWidth && !newHeight) newHeight = Math.round(newWidth / ratio);
    if (newHeight && !newWidth) newWidth = Math.round(newHeight * ratio);
  }

  const img = new Image();
  const reader = new FileReader();

  reader.onload = e => img.src = e.target.result;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = newWidth;
    canvas.height = newHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      status.textContent = "Done!";
      result.innerHTML = `
        <a class="tool-card" href="${url}" download="resized-${file.name}">
          Download Resized Image
        </a>
        <p class="donate-inline">
  ❤️ <a href="../donate.html">Support Kimosabe Tools</a>
        </p>

      `;
    }, "image/jpeg", 0.9);
  };

  reader.readAsDataURL(file);
});
