import { auth, db } from './firebase-init.js';
import { handleLogout } from './auth.js';
import { collection, onSnapshot, addDoc, doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

const ADMIN_EMAIL = "admin@gmail.com";
let productModal;

onAuthStateChanged(auth, (user) => {
    if (user && user.email === ADMIN_EMAIL) {
        initializeAdminPage();
    } else {
        window.location.replace('index.html');
    }
});

function initializeAdminPage() {
    const modalElement = document.getElementById('product-modal');
    if (modalElement) productModal = new bootstrap.Modal(modalElement);
    document.getElementById('add-product-btn')?.addEventListener('click', handleAddProduct);
    document.getElementById('product-form')?.addEventListener('submit', handleFormSubmit);
    handleLogout('logout-btn');
    renderProducts();
}

const renderProducts = () => {
    const productList = document.getElementById('admin-product-list');
    const productsCollection = collection(db, 'products');
    onSnapshot(productsCollection, (snapshot) => {
        if (snapshot.empty) {
            productList.innerHTML = '<p class="text-center col-12">No products found. Add one to get started!</p>';
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const id = doc.id;
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card product-card h-100">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/300x200.png?text=No+Image'}" class="card-img-top" alt="${product.title}">
                        <div class="card-body">
                            <h5 class="card-title">${product.title}</h5>
                            <p class="card-text text-secondary">${product.description}</p>
                            <p class="fs-4 fw-bold text-primary">$${product.price.toFixed(2)}</p>
                        </div>
                        <div class="card-footer bg-white d-flex justify-content-end gap-2">
                            <button class="btn btn-sm btn-outline-secondary edit-btn" data-id="${id}">Edit</button>
                            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${id}">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });
        productList.innerHTML = html;
        attachActionButtons();
    });
};

const attachActionButtons = () => {
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', handleEditProduct));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', handleDeleteProduct));
};

const handleAddProduct = () => {
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('modal-title').textContent = 'Add New Product';
    productModal.show();
};

const handleEditProduct = async (e) => {
    const id = e.target.dataset.id;
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const product = docSnap.data();
        document.getElementById('product-id').value = id;
        document.getElementById('product-title').value = product.title;
        document.getElementById('product-image-url').value = product.imageUrl;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('modal-title').textContent = 'Edit Product';
        productModal.show();
    }
};

const handleDeleteProduct = (e) => {
    const id = e.target.dataset.id;
    Swal.fire({
        title: 'Are you sure?', text: "This action cannot be undone.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteDoc(doc(db, 'products', id));
            Swal.fire('Deleted!', 'The product has been successfully deleted.', 'success');
        }
    });
};

const handleFormSubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const productData = {
        title: document.getElementById('product-title').value,
        imageUrl: document.getElementById('product-image-url').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
    };
    try {
        if (id) {
            await updateDoc(doc(db, 'products', id), productData);
            Swal.fire('Success!', 'Product updated.', 'success');
        } else {
            await addDoc(collection(db, 'products'), productData);
            Swal.fire('Success!', 'Product added.', 'success');
        }
        productModal.hide();
    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    }
};