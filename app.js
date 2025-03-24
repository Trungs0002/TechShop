const express = require('express');
const path = require('path');
const sanPham = require('./5_SanPham'); // Import danh sách sản phẩm

const app = express();
const port = 3000;

// Cấu hình để phục vụ file tĩnh (HTML, CSS)
app.use(express.static(path.join(__dirname)));

// Middleware để xử lý dữ liệu từ form
app.use(express.json());

// API để lấy danh sách sản phẩm
app.get('/api/sanpham', (req, res) => {
    res.json(sanPham);
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

// Route chính để trả về file index.html trong thư mục views
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, () => console.log(`Server đang chạy tại http://localhost:${port}`));