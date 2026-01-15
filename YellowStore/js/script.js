const params = new URLSearchParams(window.location.search);
const selectedCategory = params.get("category") || '';

fetch('producks.json')
  .then(res => res.json())
  .then(products => {

      const path = window.location.pathname;
      const isIndex = path.endsWith('index.html') || path === '/';

      function includesCategory(product, category) {
          if (!category) return true;

          const cat = product.category;
          if (!cat) return false;

          if (Array.isArray(cat)) {
              return cat.some(c =>
                  String(c).toLowerCase().includes(String(category).toLowerCase())
              );
          }

          return String(cat).toLowerCase().includes(String(category).toLowerCase());
      }

      function shuffle(arr) {
          const a = arr.slice();
          for (let i = a.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              const temp = a[i];
              a[i] = a[j];
              a[j] = temp;
          }
          return a;
      }

      function randomFive(list) {
          if (!Array.isArray(list) || list.length === 0) return [];
          if (list.length <= 5) return shuffle(list);
          return shuffle(list).slice(0, 5);
      }

      function populateGrid(gridId, category) {
          const grid = document.getElementById(gridId);
          if (!grid) return;

          let filtered = products.filter(p => includesCategory(p, category));
          if (isIndex) filtered = randomFive(filtered);

          grid.innerHTML = '';

        filtered.forEach(product => {
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

              grid.appendChild(item);
          });
      }

      populateGrid('featuredGrid', 'Featured');
      populateGrid('holidayGrid', 'Holiday');
      populateGrid('foodGrid', 'Food');
      populateGrid('productGrid', selectedCategory);

      const surpriseLink = document.getElementById("surprise-link");
      if (surpriseLink) {
          surpriseLink.addEventListener("click", function (e) {
              e.preventDefault();

              if (!products || products.length === 0) return;

              const randomProduct = products[Math.floor(Math.random() * products.length)];
              const id = encodeURIComponent(String(randomProduct.id));

              window.location.href = "product.html?id=" + id;
          });
      }
  })
  .catch(err => console.error('Error loading products:', err));
