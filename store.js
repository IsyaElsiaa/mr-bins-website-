/* Mr. Bins mystery box store — static front-end cart + Stripe Checkout.
 *
 * HOW TO GO LIVE (5 minutes, no backend):
 *   1. In the client's Stripe dashboard create three Payment Links
 *      (Products → Taster $25 / Classic $50 / Loaded $100, enable
 *      "Let customers adjust quantity"). Apple Pay & Google Pay are ON
 *      automatically for Payment Links — nothing else to configure.
 *   2. Paste the three URLs below. Done.
 */
var STRIPE_LINKS = {
  taster: "", // e.g. "https://buy.stripe.com/xxxxTaster"
  classic: "", // e.g. "https://buy.stripe.com/xxxxClassic"
  loaded: "", // e.g. "https://buy.stripe.com/xxxxLoaded"
};

var PRODUCTS = {
  taster: { name: "Taster", price: 25, finds: "3–4 finds", img: "mrbins-box-small-poster.jpg" },
  classic: { name: "Classic", price: 50, finds: "6–8 finds", img: "mrbins-box-med-poster.jpg" },
  loaded: { name: "Loaded", price: 100, finds: "12–15 finds", img: "mrbins-box-large-poster.jpg" },
};

(function () {
  var cart = {};
  try {
    cart = JSON.parse(localStorage.getItem("mrbins-cart") || "{}") || {};
  } catch (e) {
    cart = {};
  }

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
