import { db } from './firebase-init.js';
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

AOS.init({
    duration: 800,
    once: true,
});

const renderFeaturedProducts = async () => {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    
    const productsQuery = query(collection(db, 'products'), limit(3));
    const productsSnapshot = await getDocs(productsQuery);
    
    if (productsSnapshot.empty) {
        productGrid.innerHTML = '<p class="text-center">No products have been added yet.</p>';
        return;
    }

    productGrid.innerHTML = '';
    productsSnapshot.forEach(doc => {
        const product = doc.data();
        const productCol = document.createElement('div');
        productCol.className = 'col-md-6 col-lg-4 mb-4';
        productCol.setAttribute('data-aos', 'fade-up');
        productCol.innerHTML = `
            <div class="card product-card h-100">
                <img src="${product.imageUrl}" class="card-img-top" alt="${product.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.title}</h5>
                    <p class="card-text text-secondary mt-2 flex-grow-1">${product.description}</p>
                    <p class="card-text fs-4 fw-bold text-primary mt-3">$${product.price.toFixed(2)}</p>
                </div>
            </div>
        `;
        productGrid.appendChild(productCol);
    });
};

document.addEventListener('DOMContentLoaded', renderFeaturedProducts);