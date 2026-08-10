/* Mr. Bins mystery box store — static front-end cart + Stripe Checkout.
 *
 * HOW TO GO LIVE (5 minutes, no backend):
 *   1. In the client's Stripe dashboard create four Payment Links
 *      (Amazon Sealed $75 / Premium $99 / Clothing $65 / Bin Store Unsold
 *      $20 + $25 shipping, enable "Let customers adjust quantity").
 *      Apple Pay & Google Pay are ON automatically — nothing to configure.
 *   2. Paste the four URLs below. Done.
 */
var STRIPE_LINKS = {
  sealed: "", // e.g. "https://buy.stripe.com/xxxxSealed"
  premium: "", // e.g. "https://buy.stripe.com/xxxxPremium"
  clothing: "", // e.g. "https://buy.stripe.com/xxxxClothing"
  unsold: "", // e.g. "https://buy.stripe.com/xxxxUnsold"
};

var PRODUCTS = {
  sealed: { name: "Amazon Sealed", price: 75, finds: "sealed, never opened", img: "mrbins-box-med-poster.jpg" },
  premium: { name: "Premium", price: 99, finds: "hand-packed flagship", img: "mrbins-box-large-poster.jpg" },
  clothing: { name: "Clothing", price: 65, finds: "15 pieces", img: "mrbins-clothes-poster.jpg" },
  unsold: { name: "Bin Store Unsold", price: 20, finds: "+ $25 shipping", img: "mrbins-box-small-poster.jpg" },
};

(function () {
  var cart = {};
  try {
    cart = JSON.parse(localStorage.getItem("mrbins-cart") || "{}") || {};
  } catch (e) {
    cart = {};
  }
  /* drop line items from retired catalogs so a stale cart can't break rendering */
  for (var key in cart) if (!PRODUCTS[key]) delete cart[key];

  function save() {
    try {
      localStorage.setItem("mrbins-cart", JSON.stringify(cart));
    } catch (e) {}
  }

  function count() {
    var n = 0;
    for (var k in cart) n += cart[k];
    return n;
  }
  function total() {
    var t = 0;
    for (var k in cart) t += cart[k] * PRODUCTS[k].price;
    return t;
  }

  /* ---- drawer UI ---- */
  var drawer = document.getElementById("cartdrawer"),
    scrim = document.getElementById("cartscrim"),
    body = document.getElementById("cartbody"),
    badge = document.getElementById("storebadge"),
    totalEl = document.getElementById("carttotal"),
    checkoutBtn = document.getElementById("checkoutbtn");

  function open() {
    drawer.classList.add("open");
    scrim.classList.add("open");
    render();
  }
  function close() {
    drawer.classList.remove("open");
    scrim.classList.remove("open");
  }
  document.getElementById("storecart").addEventListener("click", open);
  document.getElementById("cartclose").addEventListener("click", close);
  scrim.addEventListener("click", close);

  function render() {
    var n = count();
    badge.textContent = n;
    badge.style.display = n ? "flex" : "none";
    totalEl.textContent = "$" + total();
    if (!n) {
      body.innerHTML =
        '<div class="cartempty">Your cart is empty.<br />Pick a box and let’s dig.</div>';
      checkoutBtn.classList.add("disabled");
      return;
    }
    checkoutBtn.classList.remove("disabled");
    var h = "";
    for (var k in cart) {
      if (!cart[k]) continue;
      var p = PRODUCTS[k];
      h +=
        '<div class="cartrow" data-id="' + k + '">' +
        '<img src="' + p.img + '" alt="" />' +
        '<div class="crinfo"><b>' + p.name + " Box</b><span>" + p.finds + " &middot; $" + p.price + '</span></div>' +
        '<div class="crqty">' +
        '<button class="qbtn" data-d="-1" aria-label="Remove one">&minus;</button>' +
        "<span>" + cart[k] + "</span>" +
        '<button class="qbtn" data-d="1" aria-label="Add one">+</button>' +
        "</div></div>";
    }
    body.innerHTML = h;
  }

  body.addEventListener("click", function (e) {
    var b = e.target.closest(".qbtn");
    if (!b) return;
    var id = b.closest(".cartrow").getAttribute("data-id");
    cart[id] = Math.max(0, (cart[id] || 0) + parseInt(b.getAttribute("data-d"), 10));
    if (!cart[id]) delete cart[id];
    save();
    render();
  });

  /* add-to-cart buttons */
  document.querySelectorAll("[data-add]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var id = b.getAttribute("data-add");
      cart[id] = (cart[id] || 0) + 1;
      save();
      open();
    });
  });

  /* checkout: one Stripe Payment Link per line item; if the cart has several
     distinct boxes we send the shopper through the biggest line first and
     note the rest (Payment Links are single-product; carts with one product
     type — the overwhelming majority — check out in one hop with Apple Pay /
     Google Pay / cards, all handled by Stripe). */
  checkoutBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (!count()) return;
    var ids = Object.keys(cart);
    ids.sort(function (a, b2) {
      return cart[b2] * PRODUCTS[b2].price - cart[a] * PRODUCTS[a].price;
    });
    var id = ids[0];
    var link = STRIPE_LINKS[id];
    var note = document.getElementById("cartnote");
    if (!link) {
      note.textContent =
        "Online checkout is almost ready — call any store to order today, or grab a box in person.";
      note.style.display = "block";
      return;
    }
    var url = link + (link.indexOf("?") < 0 ? "?" : "&") + "quantity=" + cart[id];
    if (ids.length > 1) {
      note.textContent =
        "Heads up: boxes check out one size at a time — we’ll bring you back for the rest.";
      note.style.display = "block";
    }
    window.location.href = url;
  });

  render();
})();
