/* CLOTHE ONE — genuine GLB product viewer */
(() => {
  const model = () => document.getElementById("productModel3D");
  const image = () => document.getElementById("viewerImage");
  const viewer = () => document.getElementById("imageViewer");

  window.openProduct3D = function(index) {
    const product = products[index];
    if (!product || !product.model_url) return;
    image().classList.add("hidden");
    document.querySelectorAll(".viewer-arrow").forEach(button => button.classList.add("hidden"));
    document.getElementById("viewerCounter").textContent = "اسحب القطعة لتدويرها • قرّب/بعّد للتكبير";
    model().src = product.model_url;
    model().classList.remove("hidden");
    viewer().classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };

  const originalClose = window.closeImageViewer;
  window.closeImageViewer = function(event) {
    if (event && event.target === image()) return;
    if (event && event.target !== viewer() && !event.target.classList.contains("viewer-close")) return;
    model().removeAttribute("src");
    model().classList.add("hidden");
    image().classList.remove("hidden");
    document.querySelectorAll(".viewer-arrow").forEach(button => button.classList.remove("hidden"));
    viewer().classList.add("hidden");
    document.body.style.overflow = "";
  };
})();