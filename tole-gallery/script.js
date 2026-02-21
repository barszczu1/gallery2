const GALLERY_EL = document.getElementById("gallery");

const LIGHTBOX = document.getElementById("lightbox");
const LIGHTBOX_IMG = document.getElementById("lightboxImg");
const LIGHTBOX_CAPTION = document.getElementById("lightboxCaption");
const PREV_BTN = document.getElementById("prevBtn");
const NEXT_BTN = document.getElementById("nextBtn");

const MANIFEST_URL = "./assets/tole/manifest.json";

let images = []; // filenames
let basePath = "./assets/tole/";
let currentIndex = 0;

// --------- Load manifest + build grid ----------
(async function init() {
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
    const data = await res.json();

    // Accept either { basePath, images: [...] } or just [...]
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
        Could not load <code>${MANIFEST_URL}</code>.<br/>
        Generate it using <code>node tools/generate-manifest.js</code>.
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
    img.src = `${basePath}${filename}`;
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

  // reset closing state so animation can replay
  LIGHTBOX.classList.remove("is-closing");
  LIGHTBOX.classList.add("is-open");
  LIGHTBOX.setAttribute("aria-hidden", "false");
  document.documentElement.style.overflow = "hidden";

  // force reflow so animation restarts reliably
  void LIGHTBOX.offsetWidth;

  // trigger pop-in
  LIGHTBOX.classList.add("is-visible");

  const closeBtn = LIGHTBOX.querySelector("[data-close]");
  closeBtn?.focus();
}

function closeLightbox() {
  // trigger pop-out
  LIGHTBOX.classList.add("is-closing");
  LIGHTBOX.classList.remove("is-visible");
  LIGHTBOX.setAttribute("aria-hidden", "true");
  document.documentElement.style.overflow = "";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const delay = prefersReduced ? 0 : 150;

  window.setTimeout(() => {
    LIGHTBOX.classList.remove("is-open");
    LIGHTBOX.classList.remove("is-closing");
  }, delay);
}


function renderLightbox() {
  const filename = images[currentIndex];
  if (!filename) return;

  LIGHTBOX_IMG.src = `${basePath}${filename}`;
  LIGHTBOX_IMG.alt = filename;
  LIGHTBOX_CAPTION.textContent = filename;

  // Hide arrows at ends
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

// Buttons
PREV_BTN.addEventListener("click", (e) => {
  e.stopPropagation();
  prevImage();
});
NEXT_BTN.addEventListener("click", (e) => {
  e.stopPropagation();
  nextImage();
});

// Close on backdrop / close button
LIGHTBOX.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) closeLightbox();
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  const isOpen = LIGHTBOX.classList.contains("is-open");
  if (!isOpen) return;

  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") prevImage();
  if (e.key === "ArrowRight") nextImage();
});

// Touch swipe (simple)
let touchStartX = null;
LIGHTBOX.addEventListener(
  "touchstart",
  (e) => {
    touchStartX = e.touches?.[0]?.clientX ?? null;
  },
  { passive: true },
);

LIGHTBOX.addEventListener(
  "touchend",
  (e) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches?.[0]?.clientX ?? touchStartX;
    const dx = endX - touchStartX;
    touchStartX = null;

    // swipe threshold
    if (Math.abs(dx) < 40) return;

    if (dx > 0) prevImage();
    else nextImage();
  },
  { passive: true },
);
