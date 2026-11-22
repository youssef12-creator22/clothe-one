/* CLOTHE-ONE — Supabase connected */
const SUPABASE_URL = "https://zzbfqnqfxwsticbrmcbw.supabase.co";
const SUPABASE_KEY = "sb_publishable_KMs0ckMgfzTpaloAAnMARw_A9fHs1vQ";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let products = [];
let orders = [];
let cart = [];
let isAdmin = false;
let viewerImages = [];
let viewerIndex = 0;

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function money(value) { return Number(value || 0).toFixed(2); }

async function loadProducts() {
  const { data, error } = await supabaseClient.from("products").select("*").order("created_at", {ascending:false});
  if (error) { console.error(error); alert("Impossible de charger les produits. Réessayez."); return; }
  products = (data || []).map(p => {
    let images = [];
    try {
      const parsed = JSON.parse(p.image_url || '""');
      images = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" && Array.isArray(parsed.images) ? parsed.images : [parsed || p.image_url]);
      var embeddedDeliveryFee = parsed && !Array.isArray(parsed) && typeof parsed === "object" ? Number(parsed.delivery_fee || 0) : 0;
      var embeddedPromoPrice = parsed && !Array.isArray(parsed) && typeof parsed === "object" && parsed.promo_price != null && parsed.promo_price !== "" ? Number(parsed.promo_price) : null;
    } catch (_) {
      images = [p.image_url || ""];
    }
    images = images.filter(Boolean);
    return {id:p.id,name:p.name,price:Number(p.price),size:p.size || "",image:images[0] || "",images,delivery_fee:Number.isFinite(embeddedDeliveryFee)?embeddedDeliveryFee:0,promo_price:Number.isFinite(embeddedPromoPrice)&&embeddedPromoPrice>0&&embeddedPromoPrice<Number(p.price)?embeddedPromoPrice:null,sold:!!p.sold};
  });
  const liveIds=new Set(products.map(p=>p.id));
  cart=cart.filter(item=>liveIds.has(item.id) && !products.find(p=>p.id===item.id)?.sold);
  updateCartCount();
  displayProducts();
  displayManageProducts();
  if (document.getElementById("cartModal") && !document.getElementById("cartModal").classList.contains("hidden")) displayCart();
  updateStats();
}
async function loadOrders() {
  if (!isAdmin) return;
  const { data, error } = await supabaseClient.from("orders").select("*").order("created_at", {ascending:false});
  if (error) { console.error(error); alert("Impossible de charger les commandes."); return; }
  orders = (data || []).map(o => ({
    id:o.id, firstName:o.first_name, lastName:o.last_name, phone:o.phone,
    city:o.city, address:o.address, items:o.items || [], delivery_fee:Number(o.delivery_fee)||0, total:Number(o.total),
    status:o.status || "En attente"
  }));
  displayOrders();
  updateStats();
}

function displayProducts() {
  const container = document.getElementById("products");
  if (!products.length) {
    container.innerHTML = '<p style="text-align:center;grid-column:1/-1">Les produits seront bientôt disponibles.</p>';
    return;
  }
  container.innerHTML = products.map((p,i) => `
    <div class="product-card">
      <img class="product-image" src="${safe(p.image)}" alt="${safe(p.name)}" onclick="openImageViewer(${i},0)" loading="lazy">
      <div class="product-info">
        <h3>${safe(p.name)}</h3>
        <p class="product-size">Taille : ${safe(p.size)}</p>
        <p class="product-price">${p.promo_price ? `<span class="old-price">${money(p.price)} DT</span> <span class="promo-price">${money(p.promo_price)} DT</span> <span class="promo-badge">PROMO</span>` : `${money(p.price)} DT`}</p>
        <p class="delivery-price">${p.delivery_fee>0 ? `Livraison : ${money(p.delivery_fee)} DT` : "Livraison gratuite"}</p>
        ${p.sold ? '<div class="sold-badge">VENDUE</div>' : `<button class="main-btn" onclick="addToCart(${i})">Ajouter au panier</button>`}
      </div>
    </div>`).join("");
}

function openImageViewer(productIndex, imageIndex=0) {
  const product=products[productIndex];
  if (!product) return;
  viewerImages=(product.images && product.images.length ? product.images : [product.image]).filter(Boolean);
  if (!viewerImages.length) return;
  viewerIndex=Math.max(0,Math.min(imageIndex,viewerImages.length-1));
  renderImageViewer();
  document.getElementById("imageViewer").classList.remove("hidden");
  document.body.style.overflow="hidden";
}
function renderImageViewer() {
  const image=document.getElementById("viewerImage");
  image.src=viewerImages[viewerIndex];
  document.getElementById("viewerCounter").textContent=viewerImages.length>1 ? (viewerIndex+1)+" / "+viewerImages.length : "";
  document.querySelector(".viewer-prev").style.display=viewerImages.length>1 ? "block" : "none";
  document.querySelector(".viewer-next").style.display=viewerImages.length>1 ? "block" : "none";
}
function changeViewerImage(direction,event) {
  if (event) event.stopPropagation();
  if (!viewerImages.length) return;
  viewerIndex=(viewerIndex+direction+viewerImages.length)%viewerImages.length;
  renderImageViewer();
}
function closeImageViewer(event) {
  if (event) {
    if (event.target && event.target.id==="viewerImage") return;
    if (event.currentTarget && event.currentTarget!==event.target && !event.target.classList.contains("viewer-close")) return;
  }
  document.getElementById("imageViewer").classList.add("hidden");
  document.body.style.overflow="";
}

function addToCart(index) {
  const p = products[index];
  if (!p || p.sold) return alert("Cet article n'est plus disponible.");
  const found = cart.find(x => x.id === p.id);
  if (found) found.qty++;
  else cart.push({id:p.id,qty:1});
  updateCartCount();
  alert("Produit ajouté au panier !");
}
function getCartProduct(item) { return products.find(p => p.id === item.id); }
function updateCartCount() {
  document.getElementById("cartCount").textContent = cart.reduce((s,x)=>s+x.qty,0);
}
function openCart() { document.getElementById("cartModal").classList.remove("hidden"); displayCart(); }
function closeCart() { document.getElementById("cartModal").classList.add("hidden"); }
function displayCart() {
  const container = document.getElementById("cartItems");
  let subtotal = 0;
  let deliveryFee = 0;
  const rows = cart.map((item,i) => {
    const p = getCartProduct(item);
    if (!p) return "";
    const unitPrice=p.promo_price || p.price;
    subtotal += unitPrice*item.qty;
    deliveryFee = Math.max(deliveryFee, Number(p.delivery_fee)||0);
    return `<div class="cart-item"><h3>${safe(p.name)}</h3><p>${p.promo_price ? `<span class="old-price">${money(p.price)} DT</span> <span class="promo-price">${money(unitPrice)} DT</span>` : `${money(unitPrice)} DT`}</p><p>Quantité : ${item.qty}</p>
      <button onclick="changeQuantity(${i},-1)">−</button>
      <button onclick="changeQuantity(${i},1)">+</button>
      <button onclick="removeFromCart(${i})">Supprimer</button></div>`;
  });
  container.innerHTML = rows.join("") + `<p class="delivery-price">Livraison (une seule fois) : ${deliveryFee>0 ? money(deliveryFee)+" DT" : "Gratuite"}</p>`;
  document.getElementById("cartTotal").textContent = money(subtotal+deliveryFee);
}
function changeQuantity(i,amount) {
  const item=cart[i], p=item && getCartProduct(item);
  if (!item || !p) return;
  if (amount>0 && p.sold) return alert("Cet article est vendu.");
  item.qty += amount;
  if (item.qty<=0) cart.splice(i,1);
  updateCartCount(); displayCart();
}
function removeFromCart(i) { cart.splice(i,1); updateCartCount(); displayCart(); }
function showCheckout() {
  if (!cart.length) return alert("Votre panier est vide.");
  document.getElementById("checkoutModal").classList.remove("hidden");
}
function closeCheckout() { document.getElementById("checkoutModal").classList.add("hidden"); }

document.getElementById("checkoutForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!cart.length) return alert("Votre panier est vide.");
  const items = [];
  for (const entry of cart) {
    const p = getCartProduct(entry);
    if (!p || p.sold) return alert("Un produit de votre panier n'est plus disponible.");
    const unitPrice=p.promo_price || p.price;
    items.push({product_id:p.id,name:p.name,price:unitPrice,original_price:p.price,promo:!!p.promo_price,delivery_fee:p.delivery_fee,size:p.size,qty:entry.qty});
  }
  const deliveryFee = items.reduce((max,x)=>Math.max(max,Number(x.delivery_fee)||0),0);
  const subtotal = items.reduce((sum,x)=>sum+x.price*x.qty,0);
  const total = subtotal + deliveryFee;
  const payload = {
    first_name:document.getElementById("firstName").value.trim(),
    last_name:document.getElementById("lastName").value.trim(),
    phone:document.getElementById("phone").value.trim(),
    city:document.getElementById("city").value.trim(),
    address:document.getElementById("address").value.trim(),
    items,delivery_fee:deliveryFee,total,status:"En attente"
  };
  const {data:savedOrder,error} = await supabaseClient.from("orders").insert(payload).select("id").single();
  if (error) { console.error(error); alert("Erreur lors de l'envoi. Vérifiez votre connexion et réessayez."); return; }
  const {error:notificationError} = await supabaseClient.functions.invoke("telegram-order-notify", {body:{order:{...payload,id:savedOrder.id}}});
  if (notificationError) console.warn("Commande enregistrée, mais notification Telegram non envoyée:",notificationError);
  cart=[]; updateCartCount(); this.reset(); closeCart(); closeCheckout();
  alert(notificationError ? "Commande enregistrée ! La notification Telegram n'est pas encore configurée." : "Commande envoyée avec succès ! Merci ❤️");
  if (isAdmin) await loadOrders();
});

async function adminLogin() {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  if (!email || !password) return alert("Entrez votre email et mot de passe.");
  const {error} = await supabaseClient.auth.signInWithPassword({email,password});
  if (error) { console.error(error); return alert("Email ou mot de passe incorrect."); }
  await showAdminDashboard();
}
async function showAdminDashboard() {
  isAdmin = true;
  document.getElementById("adminDashboard").classList.remove("hidden");
  document.querySelector(".admin-login").classList.add("hidden");
  await loadProducts();
  await loadOrders();
  alert("Bienvenue dans Admin Panel !");
}
async function adminLogout() {
  await supabaseClient.auth.signOut();
  isAdmin=false; orders=[];
  document.getElementById("adminDashboard").classList.add("hidden");
  document.querySelector(".admin-login").classList.remove("hidden");
  document.getElementById("adminPassword").value="";
  document.getElementById("adminEmail").value="";
  displayOrders();
}

document.getElementById("productForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  if (!isAdmin) return;
  const name=document.getElementById("productName").value.trim();
  const price=Number(document.getElementById("productPrice").value);
  const size=document.getElementById("productSize").value.trim();
  const files=Array.from(document.getElementById("productImage").files || []);
  const deliveryRaw=document.getElementById("productDeliveryFee").value.trim();
  const deliveryFee=deliveryRaw===""?0:Number(deliveryRaw);
  if (!name || !size || !files.length || !Number.isFinite(price) || price<0 || !Number.isFinite(deliveryFee) || deliveryFee<0) return alert("Vérifiez les informations du produit.");
  if (files.length>36) return alert("تنجم تزيد حتى 36 تصويرة للمنتج الواحد.");
  if (files.some(file=>!file.type.startsWith("image/"))) return alert("Veuillez choisir uniquement des images.");
  if (files.some(file=>file.size>5*1024*1024)) return alert("Chaque image doit faire maximum 5 MB.");
  const uploadedPaths=[];
  const imageUrls=[];
  for (const file of files) {
    const cleanName=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");
    const path=crypto.randomUUID()+"-"+cleanName;
    const {error:uploadError}=await supabaseClient.storage.from("product-images").upload(path,file,{upsert:false});
    if (uploadError) {
      console.error(uploadError);
      if (uploadedPaths.length) await supabaseClient.storage.from("product-images").remove(uploadedPaths);
      return alert("Erreur upload image. Vérifiez les droits Storage.");
    }
    uploadedPaths.push(path);
    const {data:urlData}=supabaseClient.storage.from("product-images").getPublicUrl(path);
    imageUrls.push(urlData.publicUrl);
  }
  const {error}=await supabaseClient.from("products").insert({name,price,size,image_url:JSON.stringify({images:imageUrls,delivery_fee:deliveryFee,promo_price:null}),sold:false});
  if (error) {
    console.error(error);
    await supabaseClient.storage.from("product-images").remove(uploadedPaths);
    return alert("Erreur ajout produit. Vérifiez les permissions Supabase.");
  }
  this.reset();
  await loadProducts();
  alert("Produit ajouté ! Il est maintenant visible pour tous les visiteurs.");
});

function displayManageProducts() {
  const container=document.getElementById("manageProducts");
  if (!isAdmin) { container.innerHTML=""; return; }
  if (!products.length) { container.innerHTML="<p>Aucun produit.</p>"; return; }
  container.innerHTML=products.map((p,i)=>`
    <div class="manage-item">
      <img src="${safe(p.image)}" alt="${safe(p.name)}">
      <strong>${safe(p.name)}</strong><p>${money(p.price)} DT — ${safe(p.size)}</p>
      <p>${p.sold?"VENDUE":"Disponible"}</p>
      <p>Livraison : ${p.delivery_fee>0 ? money(p.delivery_fee)+" DT" : "Gratuite"}</p>
      <p>${p.promo_price ? `Promotion : ${money(p.price)} DT → ${money(p.promo_price)} DT` : "Aucune promotion"}</p>
      <button onclick="editPrice(${i})">Prix</button>
      <button onclick="editDeliveryFee(${i})">Livraison</button>
      <button onclick="editPromotion(${i})">${p.promo_price?"Annuler promo":"Promotion"}</button>
      <button onclick="editProductName(${i})">Nom</button>
      <button onclick="toggleSold(${i})">${p.sold?"Disponible":"VENDUE"}</button>
      <button onclick="deleteProduct(${i})">Supprimer</button>
    </div>`).join("");
}
async function editPrice(i) {
  if (!isAdmin || !products[i]) return;
  const value=prompt("Nouveau prix DT:",products[i].price);
  if (value===null || value.trim()==="") return;
  const price=Number(value);
  if (!Number.isFinite(price) || price<0) return alert("Prix invalide.");
  const {error}=await supabaseClient.from("products").update({price}).eq("id",products[i].id);
  if (error) return alert("Erreur modification prix.");
  await loadProducts();
}
async function saveProductMetadata(product, changes) {
  let meta={images:product.images||[product.image],delivery_fee:product.delivery_fee||0,promo_price:product.promo_price??null};
  const {data}=await supabaseClient.from("products").select("image_url").eq("id",product.id).single();
  if(data?.image_url){try{const parsed=JSON.parse(data.image_url);if(parsed&&!Array.isArray(parsed)&&typeof parsed==="object")meta={...meta,...parsed};else if(Array.isArray(parsed))meta.images=parsed;}catch(_){}}
  const {error}=await supabaseClient.from("products").update({image_url:JSON.stringify({...meta,...changes})}).eq("id",product.id);
  if(error){console.error(error);alert("Erreur de modification.");return;}
  await loadProducts();
}
async function editDeliveryFee(i){
  const p=products[i];if(!isAdmin||!p)return;
  const value=prompt("Prix livraison en DT (laisser vide = gratuite) :",p.delivery_fee>0?p.delivery_fee:"");
  if(value===null)return;const fee=value.trim()===""?0:Number(value);
  if(!Number.isFinite(fee)||fee<0)return alert("Prix invalide.");
  await saveProductMetadata(p,{delivery_fee:fee});
}
async function editPromotion(i){
  const p=products[i];if(!isAdmin||!p)return;
  if(p.promo_price){if(!confirm("Annuler la promotion et remettre le prix normal ?"))return;await saveProductMetadata(p,{promo_price:null});return;}
  const value=prompt("Prix promotionnel en DT (prix normal : "+money(p.price)+" DT) :");
  if(value===null||value.trim()==="")return;const promo=Number(value);
  if(!Number.isFinite(promo)||promo<=0||promo>=p.price)return alert("Le prix promo doit être inférieur au prix normal.");
  await saveProductMetadata(p,{promo_price:promo});
}
async function editProductName(i) {
  if (!isAdmin || !products[i]) return;
  const name=prompt("Nouveau nom:",products[i].name);
  if (!name || !name.trim()) return;
  const {error}=await supabaseClient.from("products").update({name:name.trim()}).eq("id",products[i].id);
  if (error) return alert("Erreur modification nom.");
  await loadProducts();
}
async function toggleSold(i) {
  if (!isAdmin || !products[i]) return;
  const {error}=await supabaseClient.from("products").update({sold:!products[i].sold}).eq("id",products[i].id);
  if (error) return alert("Erreur modification disponibilité.");
  await loadProducts();
  alert(products[i]?.sold ? "Produit marqué comme vendu pour tous les visiteurs." : "Produit remis disponible pour tous les visiteurs.");
}
async function deleteProduct(i) {
  const product=products[i];
  if (!isAdmin || !product || !confirm("Supprimer ce produit pour tous les visiteurs ?")) return;

  // Remove the database row first: this immediately removes it from the public catalogue.
  const {error}=await supabaseClient.from("products").delete().eq("id",product.id);
  if (error) {
    console.error(error);
    return alert("Erreur suppression produit. Vérifiez les permissions Supabase.");
  }

  // Also clean up all product photos from the public Storage bucket.
  const imagePaths=(product.images || [product.image]).map(url=>{
    try {
      const marker="/storage/v1/object/public/product-images/";
      const position=String(url).indexOf(marker);
      return position>=0 ? decodeURIComponent(String(url).slice(position+marker.length).split("?")[0]) : null;
    } catch (_) { return null; }
  }).filter(Boolean);

  if (imagePaths.length) {
    const {error:storageError}=await supabaseClient.storage.from("product-images").remove(imagePaths);
    if (storageError) console.warn("Produit supprimé, mais certaines images n'ont pas pu être supprimées:",storageError);
  }

  cart=cart.filter(x=>x.id!==product.id);
  updateCartCount();
  await loadProducts();
  alert("Produit supprimé du magasin pour tous les visiteurs.");
}

function displayOrders() {
  const container=document.getElementById("manageOrders");
  if (!isAdmin) { container.innerHTML=""; return; }
  if (!orders.length) { container.innerHTML="<p>Aucune commande pour le moment.</p>"; return; }
  container.innerHTML=orders.map((o,i)=>`
    <div class="manage-item">
      <h3>Commande #${o.id}</h3>
      <p>Client : ${safe(o.firstName)} ${safe(o.lastName)}</p>
      <p>Téléphone : ${safe(o.phone)}</p><p>Ville : ${safe(o.city)}</p><p>Adresse : ${safe(o.address)}</p>
      <p>Articles :</p>${o.items.map(x=>`<p>${safe(x.name)} × ${Number(x.qty)} — ${money(x.price)} DT</p>`).join("")}
      <p>Livraison (une seule fois) : ${o.delivery_fee>0 ? money(o.delivery_fee)+" DT" : "Gratuite"}</p>
      <strong>Total : ${money(o.total)} DT</strong><p class="status">Statut : ${safe(o.status)}</p>
      <button onclick="changeOrderStatus(${i},'Validée')">Valider</button>
      <button onclick="changeOrderStatus(${i},'Refusée')">Refuser</button>
      <button onclick="changeOrderStatus(${i},'En livraison')">En livraison</button>
      <button onclick="changeOrderStatus(${i},'Livrée')">Livrée</button>
      <button onclick="deleteOrder(${i})">Supprimer</button>
    </div>`).join("");
}
async function changeOrderStatus(i,status) {
  if (!isAdmin || !orders[i]) return;
  const {error}=await supabaseClient.from("orders").update({status}).eq("id",orders[i].id);
  if (error) return alert("Erreur changement statut.");
  await loadOrders();
}
async function deleteOrder(i) {
  if (!isAdmin || !orders[i] || !confirm("Supprimer cette commande ?")) return;
  const {error}=await supabaseClient.from("orders").delete().eq("id",orders[i].id);
  if (error) return alert("Erreur suppression commande.");
  await loadOrders();
}
function updateStats() {
  document.getElementById("productCount").textContent=products.length;
  document.getElementById("orderCount").textContent=orders.length;
}

async function initialize() {
  await loadProducts();
  const {data:{session}}=await supabaseClient.auth.getSession();
  if (session) await showAdminDashboard();
  updateCartCount();
}
initialize();

// Refresh the shared catalogue periodically so changes appear for visitors
// who already have the shop open, without requiring a manual page reload.
setInterval(() => {
  if (document.visibilityState === "visible") loadProducts();
}, 15000);
