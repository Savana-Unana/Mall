const productParams = new URLSearchParams(window.location.search);
const id = productParams.get("id");

fetch("producks.json")
  .then(res => res.json())
  .then(products => {
    const product = products.find(p => String(p.id) === String(id));
    if (!product) {
      document.getElementById("product-name").textContent = "Product Not Found";
      return;
    }
    const mainImg = document.getElementById("product-img");
    const thumbs = document.getElementById("image-thumbs");
    const images =
    Array.isArray(product.altImages) && product.altImages.length
        ? product.altImages
        : [product.iconimage];
    mainImg.src = images[0];
    thumbs.innerHTML = "";
    images.forEach((src, index) => {
    const img = document.createElement("img");
    img.src = src;
    if (index === 0) img.classList.add("active");
    img.addEventListener("mouseenter", () => {
        mainImg.src = src;
        document
        .querySelectorAll(".versions img")
        .forEach(i => i.classList.remove("active"));
        img.classList.add("active");
    });
    thumbs.appendChild(img);
    });
    document.getElementById("product-name").textContent = product.name;
    document.getElementById("product-price").textContent = product.price;
    document.getElementById("product-age").textContent = product.age;
    document.getElementById("product-details").textContent = product.details;
    document.getElementById("product-owner").textContent = product.owner;
    document.getElementById("product-exist").textContent = product.exist;
    showAd(product);
    showRelatedProducts(product, products);
    showReviews(product);
    const addBtn = document.querySelector(".add-to-cart");
    addBtn.dataset.name = product.name;
    addBtn.dataset.price = product.price;
    addBtn.dataset.image = product.iconimage;
  });

function showReviews(product) {
    const list = document.getElementById("reviews-list");
    const avgEl = document.getElementById("avg-rating");

    if (!list || !avgEl) return;

    list.innerHTML = "";

    if (!Array.isArray(product.reviews) || product.reviews.length === 0) {
        avgEl.textContent = "(No reviews yet)";
        list.innerHTML = "<p>No reviews yet.</p>";
        return;
    }

    const avg = averageRating(product.reviews);
    avgEl.innerHTML = renderStars(avg) + ` (${avg.toFixed(1)}/5.0)`;

    product.reviews.forEach(r => {
        const div = document.createElement("div");
        div.className = "review";

        div.innerHTML = `
            <h4>${r.title}</h4>
            <div class="stars">${renderStars(r.rating)}</div>
            <div class="name">by ${r.name}</div>
            <div class="details">${r.details}</div>
        `;

        list.appendChild(div);
    });
}

function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = "";

    for (let i = 0; i < full; i++) stars += "★";
    if (half) stars += "☆";
    while (stars.length < 5) stars += "☆";

    return `<span class="avg-stars">${stars}</span>`;
}

function averageRating(reviews) {
    const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    return total / reviews.length;
}

function createProductCard(product) {
    const item = document.createElement('div');
    item.classList.add('itemcontainer');

    const imgSrc = product.iconimage || '';
    const name = product.name || '';
    const desc = product.description || '';
    const price = Number(product.price) || 0;
    const id = String(product.id || '');

    item.innerHTML =
        '<div class="pic">' +
            '<img src="' + imgSrc + '" alt="' + name + '" style="width:100%; height:100%; object-fit: cover;">' +
        '</div>' +
        '<div class="producname">' + name + '</div>' +
        '<div class="description">' + desc + '</div>' +
        '<div class="price">$' + price.toFixed(2) + '</div>';

    item.addEventListener('click', function () {
        window.location.href = 'product.html?id=' + encodeURIComponent(id);
    });

    return item;
}

function showRelatedProducts(product, allProducts) {
    const container = document.getElementById("related-list");
    if (!container) return;

    container.innerHTML = "";

    if (!Array.isArray(product.associate) || product.associate.length === 0) {
        container.innerHTML = "<p>No related items.</p>";
        return;
    }

    const related = allProducts.filter(p =>
        p.id !== product.id &&
        product.associate.includes(p.id)
    );

    if (related.length === 0) {
        container.innerHTML = "<p>No related items.</p>";
        return;
    }

    related.forEach(item => {
        container.appendChild(createProductCard(item));
    });
}

function showAd(product){
    if(!product.adType || product.adType === "None") return;
    if(!product.adVisual || !product.adVisual.type) return;

    const visual = product.adVisual;

    if(product.adType === "Start"){
        let element = "";
        if(visual.type === "image" || visual.type === "gif"){
            element = `<img src="${visual.src}" style="max-width:90%; max-height:80%;">`;
        } else if(visual.type === "video"){
            element = `<video src="${visual.src}" style="max-width:90%; max-height:80%;" controls autoplay></video>`;
        }
        runStartAd(element);
    }

    if(product.adType === "Side"){
        runSideAd(visual);
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const surpriseLink = document.getElementById("surprise-link");
  if (!surpriseLink) return;
  fetch("producks.json")
    .then(res => res.json())
    .then(products => {
      surpriseLink.addEventListener("click", function(e) {
        e.preventDefault();
        if (!products || products.length === 0) return;
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const id = encodeURIComponent(String(randomProduct.id));
        window.location.href = "product.html?id=" + id;
      });
    })
    .catch(err => console.error("Error loading products for Surprise Me:", err));
});

function runStartAd(element){
    const adBox = document.getElementById("ad-fullscreen");
    const adContent = document.getElementById("ad-content");
    const skipBtn = document.getElementById("ad-skip");

    if(!adBox || !adContent || !skipBtn) return;

    adContent.innerHTML = element;
    adBox.style.display = "flex";

    let timeLeft = 5;
    skipBtn.textContent = `Skip in ${timeLeft}`;
    skipBtn.style.cursor = "default";

    let canSkip = false;

    const timer = setInterval(() => {
        timeLeft--;
        if(timeLeft > 0){
            skipBtn.textContent = `Skip in ${timeLeft}`;
        } else {
            skipBtn.textContent = "✕";
            skipBtn.style.cursor = "pointer";
            canSkip = true;
            clearInterval(timer);
        }
    }, 1000);

    skipBtn.onclick = () => {
        if (!canSkip) return;
        adBox.style.display = "none";
    };
}

function isExternalLink(url) {
    try {
        const link = new URL(url, window.location.origin);
        return link.origin !== window.location.origin;
    } catch {
        return false; // invalid URL treated as internal
    }
}



function runSideAd(visual) {
    const side = document.getElementById("ad-side");
    const sideContent = document.getElementById("ad-side-content");
    const closeBtn = document.getElementById("ad-close");

    if (!side || !sideContent || !closeBtn) return;

    let element = "";
    if (visual.type === "image" || visual.type === "gif") {
        element = `<a href="${visual.link || '#'}" target="_blank">
                        <img src="${visual.src}" style="width:100%; height:auto; object-fit:contain;">
                   </a>`;
    } else if (visual.type === "video") {
        element = `<a href="${visual.link || '#'}" target="_blank">
                        <video src="${visual.src}" style="width:100%; height:auto;" controls autoplay></video>
                   </a>`;
    }

    sideContent.innerHTML = element;

    setTimeout(() => side.classList.add("show"), 10);

    document.body.classList.add("side-ad-open");

    closeBtn.onclick = () => {
        side.classList.remove("show");
        document.body.classList.remove("side-ad-open");
    };
}
