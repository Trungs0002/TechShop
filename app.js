const express = require('express');
const path = require('path');
const sanPham = require('./5_SanPham'); // Import danh sách sản phẩm

const app = express();
const port = 3000;

// Cấu hình để phục vụ file tĩnh (HTML, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware để xử lý dữ liệu từ form
app.use(express.json());

// API để lấy danh sách sản phẩm
app.get('/api/sanpham', (req, res) => {
    res.json(sanPham);
});

// Route để trả về file addProducts.html trong thư mục public/pages
app.get('/addProducts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/addProducts.html'));
});

// API để thêm sản phẩm mới
app.post('/api/sanpham', (req, res) => {
    const { name, price, brand, warranty } = req.body;

    // Tạo ID sản phẩm mới
    const newProduct = {
        id: 'PROD' + Date.now(), // Tạo ID bằng thời gian
        name,
        price: parseInt(price),
        brand,
        warranty
    };

    // Thêm sản phẩm vào mảng sanPham
    sanPham.push(newProduct);

    console.log('Sản phẩm mới đã được thêm:', newProduct);

    // Trả về sản phẩm vừa thêm
    res.json(newProduct);
});

// Route chính để trả về file index.html trong thư mục public/pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages', 'index.html'));
});

// Route để trả về file FProducts.html trong thư mục public/pages
app.get('/fProducts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/FProducts.html'));
});

// API để lọc sản phẩm
app.get('/api/sanpham/filter', (req, res) => {
    const { name, price, brand, warranty } = req.query;
    let filteredProducts = sanPham;

    if (name) {
        filteredProducts = filteredProducts.filter(product => product.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (price) {
        filteredProducts = filteredProducts.filter(product => product.price <= parseInt(price));
    }
    if (brand) {
        filteredProducts = filteredProducts.filter(product => product.brand.toLowerCase().includes(brand.toLowerCase()));
    }
    if (warranty) {
        filteredProducts = filteredProducts.filter(product => product.warranty.toLowerCase().includes(warranty.toLowerCase()));
    }

    res.json(filteredProducts);
});

app.listen(port, () => console.log(`Server đang chạy tại http://localhost:${port}`));

