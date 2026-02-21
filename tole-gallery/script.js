const GALLERY_EL = document.getElementById("gallery");

const LIGHTBOX = document.getElementById("lightbox");
const DIALOG = document.querySelector(".lightbox__dialog");
const LIGHTBOX_IMG = document.getElementById("lightboxImg");
const LIGHTBOX_CAPTION = document.getElementById("lightboxCaption");
const PREV_BTN = document.getElementById("prevBtn");
const NEXT_BTN = document.getElementById("nextBtn");

const MANIFEST_URL = "./assets/tole/manifest.json";

let images = [];
let basePath = "./assets/tole/";
let currentIndex = 0;

(async function init() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      images = data;
    } else {
      images = data.images || [];
      basePath = data.basePath || basePath;
    }

    buildGallery(images);
  } catch (err) {
    console.error(err);
    GALLERY_EL.innerHTML = `
      <p style="color:#b00020">
        Could not load <code>${MANIFEST_URL}</code>.
      </p>`;
  }
})();

function buildGallery(files) {
  GALLERY_EL.innerHTML = "";

  files.forEach((filename, index) => {
    const btn = document.createElement("button");
    btn.className = "thumb";
    btn.type = "button";
    btn.setAttribute("aria-label", `Open image ${index + 1}`);

    const frame = document.createElement("span");
    frame.className = "thumb__frame";

    const img = document.createElement("img");
    img.className = "thumb__img";
    img.loading = "lazy";
    img.src = encodeURI(`${basePath}${filename}`);
    img.alt = filename;

    frame.appendChild(img);
    btn.appendChild(frame);
    btn.addEventListener("click", () => openLightbox(index));

    GALLERY_EL.appendChild(btn);
  });
}

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();

  document.body.classList.add("viewer-open");

  LIGHTBOX.classList.remove("is-closing");
  LIGHTBOX.classList.add("is-open");
  LIGHTBOX.setAttribute("aria-hidden", "false");

  // restart animation
  void LIGHTBOX.offsetWidth;
  LIGHTBOX.classList.add("is-visible");
}

function closeLightbox() {
  document.body.classList.remove("viewer-open");

  LIGHTBOX.classList.add("is-closing");
  LIGHTBOX.classList.remove("is-visible");
  LIGHTBOX.setAttribute("aria-hidden", "true");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const delay = prefersReduced ? 0 : 160;

  window.setTimeout(() => {
    LIGHTBOX.classList.remove("is-open");
    LIGHTBOX.classList.remove("is-closing");
  }, delay);
}

function renderLightbox() {
  const filename = images[currentIndex];
  if (!filename) return;

  LIGHTBOX_IMG.src = encodeURI(`${basePath}${filename}`);
  LIGHTBOX_IMG.alt = filename;
  LIGHTBOX_CAPTION.textContent = filename;

  PREV_BTN.classList.toggle("is-hidden", currentIndex === 0);
  NEXT_BTN.classList.toggle("is-hidden", currentIndex === images.length - 1);
}

function prevImage() {
  if (currentIndex <= 0) return;
  currentIndex -= 1;
  renderLightbox();
}

function nextImage() {
  if (currentIndex >= images.length - 1) return;
  currentIndex += 1;
  renderLightbox();
}

PREV_BTN.addEventListener("click", (e) => { e.stopPropagation(); prevImage(); });
NEXT_BTN.addEventListener("click", (e) => { e.stopPropagation(); nextImage(); });

// Click outside image closes (transparent overlay)
LIGHTBOX.addEventListener("click", (e) => {
  if (e.target === LIGHTBOX) closeLightbox();
});

// Prevent clicks inside from closing
DIALOG.addEventListener("click", (e) => e.stopPropagation());

// Close button
LIGHTBOX.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeLightbox();
});

// Keyboard
document.addEventListener("keydown", (e) => {
  if (!LIGHTBOX.classList.contains("is-open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
});