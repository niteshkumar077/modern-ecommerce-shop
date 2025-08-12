import { auth, db } from './firebase-init.js';
import { collection, getDocs, doc, writeBatch } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadOrderSummary();
    } else {
        window.location.replace('login.html');
    }
});

const loadOrderSummary = async () => {
    if (!currentUser) return;
    const summaryItems = document.getElementById('summary-cart-items');
    const summaryCount = document.getElementById('summary-cart-count');
    const cartItemsRef = collection(db, 'carts', currentUser.uid, 'items');
    const snapshot = await getDocs(cartItemsRef);

    if (snapshot.empty) {
        window.location.replace('dashboard.html');
        return;
    }

    let html = '';
    let total = 0;
    snapshot.forEach(doc => {
        const item = doc.data();
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <li class="list-group-item d-flex justify-content-between lh-sm">
                <div><h6 class="my-0">${item.title}</h6><small class="text-muted">Qty: ${item.quantity}</small></div>
                <span class="text-muted">$${itemTotal.toFixed(2)}</span>
            </li>
        `;
    });
    
    html += `<li class="list-group-item d-flex justify-content-between"><span>Total (USD)</span><strong>$${total.toFixed(2)}</strong></li>`;
    summaryItems.innerHTML = html;
    summaryCount.textContent = snapshot.size;
};

const checkoutForm = document.getElementById('checkout-form');
checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkoutForm.checkValidity()) {
        e.stopPropagation();
        checkoutForm.classList.add('was-validated');
        return;
    }

    const shippingDetails = {
        fullName: document.getElementById('fullName').value,
        address: document.getElementById('address').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        zip: document.getElementById('zip').value,
    };

    try {
        const batch = writeBatch(db);
        const cartItemsRef = collection(db, 'carts', currentUser.uid, 'items');
        const cartSnapshot = await getDocs(cartItemsRef);
        const orderItems = cartSnapshot.docs.map(d => ({...d.data(), id: d.id}));
        
        const newOrderRef = doc(collection(db, 'orders'));
        batch.set(newOrderRef, {
            userId: currentUser.uid,
            shippingDetails: shippingDetails,
            items: orderItems,
            createdAt: new Date(),
            status: 'placed',
            total: orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        });

        cartSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        window.location.href = 'success.html';
    } catch (error) {
        console.error("Error placing order: ", error);
        Swal.fire('Error', 'Could not place your order. Please try again.', 'error');
    }
});