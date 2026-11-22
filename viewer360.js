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

  const activePointers = new Map();
  let pinchStartDistance = 0;

  const pointerDistance = () => {
    const points = [...activePointers.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };

  image().addEventListener("pointerdown", event => {
    activePointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
    image().setPointerCapture(event.pointerId);
    if (activePointers.size === 2) {
      dragging = false;
      pinchStartDistance = pointerDistance();
      return;
    }
    if (activePointers.size === 1 && !zoomed) {
      dragging = true;
      startX = event.clientX;
      image().classList.add("viewer-grabbing");
    }
  });

  image().addEventListener("pointermove", event => {
    if (!activePointers.has(event.pointerId)) return;
    activePointers.set(event.pointerId, {x:event.clientX, y:event.clientY});
    if (activePointers.size >= 2) {
      const distance = pointerDistance();
      if (pinchStartDistance && distance > pinchStartDistance * 1.08) {
        zoomed = true;
        image().classList.add("viewer-zoomed");
      } else if (pinchStartDistance && distance < pinchStartDistance * 0.88) {
        zoomed = false;
        image().classList.remove("viewer-zoomed");
      }
      return;
    }
  });

  image().addEventListener("pointerup", event => {
    const point = activePointers.get(event.pointerId);
    if (dragging && point && activePointers.size === 1) {
      const distance = event.clientX - startX;
      if (Math.abs(distance) >= 35) {
        window.changeViewerImage(distance < 0 ? 1 : -1);
      }
    }
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinchStartDistance = 0;
    dragging = false;
    image().classList.remove("viewer-grabbing");
  });

  const stopDrag = event => {
    activePointers.delete(event.pointerId);
    dragging = false;
    pinchStartDistance = 0;
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