import { auth, db } from './firebase-init.js';
import { handleLogout } from './auth.js';
import { collection, doc, onSnapshot, getDocs, getDoc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

let currentUser = null;
let allProducts = [];
let cartItems = [];

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initializeUserPage();
    } else {
        window.location.replace('login.html');
    }
});

async function initializeUserPage() {
    handleLogout('logout-btn');
    await fetchAllProducts();
    listenToCart();
}

const fetchAllProducts = async () => {
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);
    allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderProductCards();
};

const renderProductCards = () => {
    const productList = document.getElementById('user-product-list');
    if (!productList) return;

    if (allProducts.length === 0) {
        productList.innerHTML = '<p class="text-center col-12">There are no products to display.</p>';
        return;
    }

    let html = '';
    allProducts.forEach(product => {
        const isInCart = cartItems.some(item => item.id === product.id);
        html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card product-card h-100">
                    <img src="${product.imageUrl}" class="card-img-top" alt="${product.title}">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text text-secondary mt-2 flex-grow-1">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <p class="fs-4 fw-bold text-primary mb-0">$${product.price.toFixed(2)}</p>
                            <button class="btn btn-sm btn-primary add-to-cart-btn" data-id="${product.id}" ${isInCart ? 'disabled' : ''}>
                                <i class="bi ${isInCart ? 'bi-check-lg' : 'bi-cart-plus'}"></i> ${isInCart ? 'In Cart' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    productList.innerHTML = html;
    attachCartButtons();
};

const attachCartButtons = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => addToCart(e.currentTarget.dataset.id));
    });
};

const addToCart = async (productId) => {
    if (!currentUser) return;
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    const cartItemRef = doc(db, 'carts', currentUser.uid, 'items', productId);
    try {
        await setDoc(cartItemRef, {
            title: product.title, price: product.price, imageUrl: product.imageUrl, quantity: 1
        });
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', title: 'Added to cart!',
            showConfirmButton: false, timer: 1500
        });
    } catch (error) { console.error("Error adding to cart: ", error); }
};

const listenToCart = () => {
    if (!currentUser) return;
    const cartItemsRef = collection(db, 'carts', currentUser.uid, 'items');
    onSnapshot(cartItemsRef, (snapshot) => {
        cartItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        document.getElementById('cart-count').textContent = cartItems.length;
        renderProductCards();
        renderCartOffcanvas();
    });
};

const renderCartOffcanvas = () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartFooter = document.getElementById('cart-footer');
    let subtotal = 0;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted">Your cart is empty.</p>';
        cartFooter.innerHTML = '';
        return;
    }
    let html = '';
    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
        html += `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.title}">
                <div class="cart-item-details">
                    <p class="fw-bold mb-1">${item.title}</p>
                    <p class="text-secondary mb-2">$${item.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="btn btn-outline-secondary btn-sm decrease-qty-btn" data-id="${item.id}">-</button>
                        <span class="mx-2">${item.quantity}</span>
                        <button class="btn btn-outline-secondary btn-sm increase-qty-btn" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="btn btn-sm text-danger remove-from-cart-btn" data-id="${item.id}"><i class="bi bi-trash-fill"></i></button>
            </div>
        `;
    });
    cartItemsContainer.innerHTML = html;
    cartFooter.innerHTML = `
        <h4 class="d-flex justify-content-between"><span>Subtotal:</span> <span>$${subtotal.toFixed(2)}</span></h4>
        <a href="checkout.html" class="btn btn-primary w-100 mt-2">Proceed to Checkout</a>
    `;
    attachOffcanvasCartActions();
};

const attachOffcanvasCartActions = () => {
    document.querySelectorAll('.increase-qty-btn').forEach(btn => btn.addEventListener('click', (e) => updateQuantity(e.currentTarget.dataset.id, 1)));
    document.querySelectorAll('.decrease-qty-btn').forEach(btn => btn.addEventListener('click', (e) => updateQuantity(e.currentTarget.dataset.id, -1)));
    document.querySelectorAll('.remove-from-cart-btn').forEach(btn => btn.addEventListener('click', (e) => removeFromCart(e.currentTarget.dataset.id)));
};

const updateQuantity = async (productId, change) => {
    const itemInCart = cartItems.find(item => item.id === productId);
    if (!itemInCart) return;

    const cartItemRef = doc(db, 'carts', currentUser.uid, 'items', productId);
    const newQty = itemInCart.quantity + change;
    
    if (newQty > 0) {
        await updateDoc(cartItemRef, { quantity: newQty });
    } else {
        await deleteDoc(cartItemRef);
    }
};

const removeFromCart = async (productId) => {
    await deleteDoc(doc(db, 'carts', currentUser.uid, 'items', productId));
};