/* CLOTHE-ONE image viewer
   Manual swipe changes photos one by one; no 360-degree rotation mode. */
(() => {
  let frames = [];
  let frame = 0;
  let dragging = false;
  let startX = 0;
  let zoomed = false;

  const viewer = () => document.getElementById("imageViewer");
  const image = () => document.getElementById("viewerImage");
  const counter = () => document.getElementById("viewerCounter");

  function render() {
    if (!frames.length) return;
    image().src = frames[frame];
    counter().textContent = frames.length > 1
      ? `${frame + 1} / ${frames.length} — اسحب يمين أو يسار لتبديل الصور`
      : "صورة المنتج";
    document.querySelector(".viewer-prev").style.display = frames.length > 1 ? "block" : "none";
    document.querySelector(".viewer-next").style.display = frames.length > 1 ? "block" : "none";
  }

  window.openImageViewer = function(productIndex, imageIndex = 0) {
    const product = products[productIndex];
    if (!product) return;
    frames = (product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
    if (!frames.length) return;
    frame = Math.max(0, Math.min(imageIndex, frames.length - 1));
    zoomed = false;
    image().classList.remove("viewer-zoomed");
    render();
    viewer().classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  window.changeViewerImage = function(direction, event) {
    if (event) event.stopPropagation();
    if (frames.length < 2) return;
    frame = (frame + direction + frames.length) % frames.length;
    render();
  };

  window.closeImageViewer = function(event) {
    if (event && event.target !== viewer() &&
        !event.target.classList.contains("viewer-close")) return;
    viewer().classList.add("hidden");
    document.body.style.overflow = "";
    dragging = false;
  };

  image().addEventListener("pointerdown", event => {
    if (frames.length < 2 || zoomed) return;
    dragging = true;
    startX = event.clientX;
    image().classList.add("viewer-grabbing");
    image().setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  image().addEventListener("pointerup", event => {
    if (!dragging) return;
    const distance = event.clientX - startX;
    if (Math.abs(distance) >= 35) {
      window.changeViewerImage(distance < 0 ? 1 : -1);
    }
    dragging = false;
    image().classList.remove("viewer-grabbing");
  });
  const stopDrag = () => {
    dragging = false;
    image().classList.remove("viewer-grabbing");
  };
  image().addEventListener("pointercancel", stopDrag);
  image().addEventListener("lostpointercapture", stopDrag);

  image().addEventListener("dblclick", () => {
    zoomed = !zoomed;
    image().classList.toggle("viewer-zoomed", zoomed);
  });
  image().addEventListener("wheel", event => {
    zoomed = event.deltaY < 0;
    image().classList.toggle("viewer-zoomed", zoomed);
    event.preventDefault();
  }, {passive:false});

  document.addEventListener("keydown", event => {
    if (viewer().classList.contains("hidden")) return;
    if (event.key === "ArrowRight") window.changeViewerImage(1);
    if (event.key === "ArrowLeft") window.changeViewerImage(-1);
    if (event.key === "Escape") window.closeImageViewer({target:document.querySelector(".viewer-close")});
  });
})();