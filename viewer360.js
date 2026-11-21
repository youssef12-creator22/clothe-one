/* CLOTHE-ONE 360 product viewer
   Uses the product's existing multi-angle images as rotation frames. */
(() => {
  let frames = [];
  let frame = 0;
  let dragging = false;
  let lastX = 0;
  let dragRemainder = 0;
  let zoomed = false;
  let startDistance = 0;

  const viewer = () => document.getElementById("imageViewer");
  const image = () => document.getElementById("viewerImage");
  const counter = () => document.getElementById("viewerCounter");

  function render() {
    if (!frames.length) return;
    image().src = frames[frame];
    counter().textContent = frames.length > 1
      ? `360° • ${frame + 1}/${frames.length} — اسحب يمين ويسار للدوران`
      : "زيد صور من زوايا مختلفة باش تفعّل دوران 360°";
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

  function rotateByPixels(delta) {
    dragRemainder += delta;
    const step = 34;
    while (Math.abs(dragRemainder) >= step) {
      const direction = dragRemainder > 0 ? -1 : 1;
      frame = (frame + direction + frames.length) % frames.length;
      dragRemainder += dragRemainder > 0 ? -step : step;
      render();
    }
  }

  image().addEventListener("pointerdown", event => {
    if (frames.length < 2 || zoomed) return;
    dragging = true;
    lastX = event.clientX;
    dragRemainder = 0;
    image().classList.add("viewer-grabbing");
    image().setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  image().addEventListener("pointermove", event => {
    if (!dragging) return;
    const delta = event.clientX - lastX;
    lastX = event.clientX;
    rotateByPixels(delta);
  });
  const stopDrag = () => {
    dragging = false;
    image().classList.remove("viewer-grabbing");
  };
  image().addEventListener("pointerup", stopDrag);
  image().addEventListener("pointercancel", stopDrag);
  image().addEventListener("lostpointercapture", stopDrag);

  image().addEventListener("dblclick", () => {
    zoomed = !zoomed;
    image().classList.toggle("viewer-zoomed", zoomed);
  });
  image().addEventListener("wheel", event => {
    if (event.deltaY < 0) zoomed = true;
    else zoomed = false;
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