(async function(){
  // Conexión a Supabase
  const SUPABASE_URL = "https://ayelftqcowykroiwclfs.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Vi4XSoGzkn5Y3pgOkLWpCA_q-vzZ9Uo";
  
  let supabaseClient = null;
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  let productos = [];

  // Intentamos cargar desde Supabase; si falla, recurrimos a productos.json de respaldo
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.from('productos').select('*').eq('activo', true).order('nombre');
      if (!error && data) {
        productos = data.map(p => ({
          id: p.id,
          name: p.nombre,
          category: (p.categoria || 'varios').toLowerCase().trim(),
          brand: p.marca || '',
          price: p.precio || 0,
          image: p.imagen_url || 'assets/logomeier.jpg',
          stock: p.stock || 0
        }));
      }
    } catch (err) {
      console.error("Error cargando de Supabase, usando respaldo local", err);
    }
  }

  if (productos.length === 0) {
    try {
      const response = await fetch("productos.json");
      productos = await response.json();
    } catch(e) {
      productos = [];
    }
  }

  const D = window.MEIER_DATA;
  D.products = productos;
  const fmt = n => "$" + Number(n).toLocaleString("es-AR");
  const $ = s => document.querySelector(s);   const $$ = s => document.querySelectorAll(s);

  // Year
  $("#year").textContent = new Date().getFullYear();

  // Mobile nav
  const nav = $("#nav");
  $("#navToggle").addEventListener("click", () => nav.classList.toggle("open"));
  nav.addEventListener("click", e => { if (e.target.tagName === "A") nav.classList.remove("open"); });

  // Benefits
  const icons = {
    user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    grid:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M1 7h13v10H1zM14 10h5l3 3v4h-8z"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>',
    star:'<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="m12 2 3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>',
    shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M3 9 4 4h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 22V12h6v10"/></svg>',
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12Z"/></svg>'
  };
  $("#benefits").innerHTML = D.benefits.map(b => `
    <article class="benefit">
      <div class="benefit__icon">${icons[b.icon] || icons.star}</div>
      <h3>${b.title}</h3><p>${b.desc}</p>
    </article>`).join("");

  // Brands
  $("#brands").innerHTML = D.brands.map(b => `<div class="brand">${b}</div>`).join("");

  // Filters
  const filtersEl = $("#filters");
  let activeCat = "all";
  let activeBrand = "";
  filtersEl.innerHTML = D.categories.map(c => `<button class="chip${c.id==="all"?" active":""}" data-cat="${c.id}">${c.label}</button>`).join("");
  filtersEl.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    activeCat = b.dataset.cat;
    $$(".chip").forEach(c => c.classList.toggle("active", c === b));
    render();
  });

  // Brand filter
  const brandFilter = $("#brandFilter");
  if (brandFilter) {
    const marcas = [...new Set(
      D.products
        .map(p => p.brand || "")
        .filter(m => m.trim() !== "")
    )].sort();

    brandFilter.innerHTML += marcas
      .map(m => `<option value="${m}">${m}</option>`)
      .join("");

    brandFilter.addEventListener("change", e => {
      activeBrand = e.target.value;
      render();
    });
  }

  // Search
  let query = "";
  $("#search").addEventListener("input", e => { query = e.target.value.toLowerCase().trim(); render(); });

  // Products
  const productsEl = $("#products");
  const emptyEl = $("#empty");
  function render(){
    const list = D.products.filter(p =>
      (activeCat === "all" || p.category === activeCat) &&
      (!activeBrand || p.brand === activeBrand) &&
      (
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.brand || "").toLowerCase().includes(query)
      )
    );
    emptyEl.classList.toggle("hidden", list.length > 0);
    productsEl.innerHTML = list.map(p => `
      <article class="card">
        <div class="card__img"><img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='assets/logomeier.jpg'"/></div>
        <div class="card__body">
          <span class="card__brand">${p.category}</span>
          <h3 class="card__name">${p.name}</h3>
          <div class="card__foot">
            <span class="card__price">${p.price ? fmt(p.price) : "Consultar"}</span>
            <button class="card__add" data-add="${p.id}" aria-label="Agregar al carrito">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="18" height="18"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </article>`).join("");
  }
  render();

  productsEl.addEventListener("click", e => {
    const b = e.target.closest("[data-add]"); if (!b) return;
    const rawId = b.dataset.add;
    const prodId = !isNaN(rawId) ? parseInt(rawId, 10) : rawId;
    addToCart(prodId);
    openCart();
  });

  // Cart
  const cart = new Map();
  const cartEl = $("#cart"), overlay = $("#overlay");
  function openCart(){ cartEl.classList.add("open"); overlay.classList.add("show"); }
  function closeCart(){ cartEl.classList.remove("open"); overlay.classList.remove("show"); }
  $("#cartOpen").addEventListener("click", openCart);
  $("#cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);

  function addToCart(id, qty=1){
    const p = D.products.find(x => x.id == id); if (!p) return;
    const cur = cart.get(id);
    cart.set(id, { product:p, qty:(cur?cur.qty:0)+qty });
    drawCart();
  }
  function setQty(id, qty){
    if (qty <= 0) cart.delete(id);
    else { const c = cart.get(id); if (c) c.qty = qty; }
    drawCart();
  }
  $("#clearCart").addEventListener("click", () => { cart.clear(); drawCart(); });

  function totals(){
    let count = 0;
    let subtotal = 0;
    cart.forEach(({product:p, qty}) => {
      count += qty;
      subtotal += (p.price || 0) * qty;
    });
    return { count, subtotal };
  }

  function drawCart(){
    const body = $("#cartBody");
    if (cart.size === 0){
      body.innerHTML = '<div class="cart-empty">Tu carrito está vacío.<br/>Agregá productos del catálogo.</div>';
    } else {
      body.innerHTML = [...cart.values()].map(({product:p, qty}) => `
        <div class="cart-item">
          <img src="${p.image}" alt="${p.name}" onerror="this.src='assets/logomeier.jpg'"/>
          <div>
            <div class="cart-item__name">${p.name}</div>
            <div class="cart-item__brand">${p.category}</div>
            <div class="qty">
              <button data-dec="${p.id}">−</button><span>${qty}</span><button data-inc="${p.id}">+</button>
            </div>
          </div>
          <div style="text-align:right">
            <div class="cart-item__price">${p.price ? fmt(p.price * qty) : qty + " un."}</div>
            <button class="cart-item__remove" data-rm="${p.id}">Quitar</button>
          </div>
        </div>`).join("");
    }
    const { count, subtotal } = totals();

    $("#subtotal").textContent = fmt(subtotal);
    $("#total").textContent = fmt(subtotal);
    $("#cartCount").textContent = count;
  }

  $("#cartBody").addEventListener("click", e => {
    const t = e.target;
    if (t.dataset.inc) addToCart(isNaN(t.dataset.inc) ? t.dataset.inc : +t.dataset.inc);
    else if (t.dataset.dec){ 
      const id = isNaN(t.dataset.dec) ? t.dataset.dec : +t.dataset.dec;
      const c = cart.get(id); 
      if (c) setQty(id, c.qty-1); 
    }
    else if (t.dataset.rm) {
      const id = isNaN(t.dataset.rm) ? t.dataset.rm : +t.dataset.rm;
      setQty(id, 0);
    }
  });
  drawCart();

  // Checkout modal
  const modal = $("#checkout");
  $("#goCheckout").addEventListener("click", () => {
    if (cart.size === 0){ alert("Tu carrito está vacío."); return; }
    renderSummary(); modal.classList.add("open"); closeCart();
  });
  $("#checkoutClose").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });

  function renderSummary(){
    const { count, subtotal } = totals();

    $("#summaryList").innerHTML = [...cart.values()]
      .map(({product:p,qty}) =>
        `<li><span>${qty} × ${p.name}</span><span>${p.price ? fmt(p.price * qty) : '-'}</span></li>`
      ).join("");

    $("#summaryTotal").textContent = fmt(subtotal);
  }

  $("#checkoutForm").addEventListener("submit", async e => {
    e.preventDefault();
    const f = e.target;
    if (!f.checkValidity()){ f.reportValidity(); return; }
    const data = Object.fromEntries(new FormData(f).entries());
    const { count, subtotal } = totals();

    let numeroPedido = null;

    // Guardar en Supabase para el panel admin
    if (supabaseClient) {
      try {
        // Dejamos que Supabase autogenere la columna 'numero' mediante su secuencia (nextval)
        const { data: pedidoIns, error: errPed } = await supabaseClient
          .from('pedidos')
          .insert([{
            cliente_nombre: data.nombre || '',
            cliente_apellido: data.apellido || '',
            cliente_telefono: data.telefono || '',
            cliente_direccion: data.direccion || '',
            cliente_email: data.email || '',
            total: subtotal,
            estado: 'nuevo'
          }])
          .select()
          .single();

        if (errPed) {
          console.error("Error insertando pedido en Supabase:", errPed);
        } else if (pedidoIns) {
          numeroPedido = pedidoIns.numero; // Número oficial asignado por Supabase
          
          const itemsConPedidoId = [...cart.values()].map(({product:p, qty}) => ({
            pedido_id: pedidoIns.id,
            producto_id: typeof p.id === 'string' && p.id.length > 10 ? p.id : null,
            nombre_producto: p.name,
            cantidad: qty,
            precio_unitario: p.price || 0,
            subtotal: (p.price || 0) * qty
          }));

          const { error: errItems } = await supabaseClient.from('pedido_items').insert(itemsConPedidoId);
          if (errItems) console.error("Error insertando items:", errItems);
        }
      } catch (errSupabase) {
        console.error("No se pudo registrar en la base de datos", errSupabase);
      }
    }

    const numMostrar = numeroPedido ? `#${numeroPedido}` : '';

    const lines = [...cart.values()].map(({product:p,qty}) =>
      `• ${qty} × ${p.name}`
    ).join("\n");

    const msg =
`Hola Meier Distribuciones! 👋
Quiero hacer un pedido ${numMostrar}:

${lines}

*Total estimado: ${fmt(subtotal)}*
*Cantidad total de productos: ${count}*

Datos:
Nombre: ${data.nombre} ${data.apellido}
Dirección: ${data.direccion}
Teléfono: ${data.telefono}${data.email?`\nEmail: ${data.email}`:""}`;

    window.open(`https://wa.me/${D.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    modal.classList.remove("open");
    cart.clear();
    drawCart();
  });

  // Header scroll effect
  const header = $("#header");
  window.addEventListener("scroll", () => {
    header.style.boxShadow = window.scrollY > 8 ? "0 6px 18px -10px rgba(15,23,42,.18)" : "none";
  });
})();
