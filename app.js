const express = require("express");
const path = require("path");
const sanPham = require("./5_SanPham"); // Import danh sách sản phẩm

const app = express();
const port = 3000;

// Cấu hình để phục vụ file tĩnh (HTML, CSS)
app.use(express.static(path.join(__dirname, "public")));

// Middleware để xử lý dữ liệu từ form
app.use(express.json());

// API để lấy danh sách sản phẩm
app.get("/api/sanpham", (req, res) => {
  res.json(sanPham);
});

// Route để trả về file addProducts.html trong thư mục public/pages
app.get("/addProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/addProducts.html"));
});

app.get("/deleteProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/deleteProducts.html"));
});

// API để thêm sản phẩm mới
app.post('/api/sanpham', (req, res) => {
    const { id, name, price, brand, warranty } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!id || !name || !price || !brand || !warranty) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm!' });
    }

    // Tạo sản phẩm mới
    const newProduct = { id, name, price, brand, warranty };

    // Thêm sản phẩm vào danh sách (giả sử bạn lưu trong một mảng)
    sanPham.push(newProduct);

    // Trả về sản phẩm mới
    res.status(201).json(newProduct);
});

// API để xóa sản phẩm
app.delete("/api/sanpham/:id", (req, res) => {
  const productId = req.params.id;

  // Tìm và xóa sản phẩm khỏi danh sách
  const productIndex = sanPham.findIndex((product) => product.id === productId);
  if (productIndex !== -1) {
    sanPham.splice(productIndex, 1);
    res.status(200).send({ message: "Sản phẩm đã được xóa thành công!" });
  } else {
    res.status(404).send({ message: "Không tìm thấy sản phẩm!" });
  }
});

// Route chính để trả về file index.html trong thư mục public/pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "index.html"));
});

// Route để trả về file FProducts.html trong thư mục public/pages
app.get("/fProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/FProducts.html"));
});

// API để lọc sản phẩm
app.get("/api/sanpham/filter", (req, res) => {
  const { name, price, brand, warranty } = req.query;
  let filteredProducts = sanPham;

  if (name) {
    filteredProducts = filteredProducts.filter((product) => product.name.toLowerCase().includes(name.toLowerCase()));
  }
  if (price) {
    filteredProducts = filteredProducts.filter((product) => product.price <= parseInt(price));
  }
  if (brand) {
    filteredProducts = filteredProducts.filter((product) => product.brand.toLowerCase().includes(brand.toLowerCase()));
  }
  if (warranty) {
    filteredProducts = filteredProducts.filter((product) => product.warranty.toLowerCase().includes(warranty.toLowerCase()));
  }

  res.json(filteredProducts);
});

// Route để trả về updateProducts.html
app.get("/updateProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/updateProducts.html"));
});

// API để lấy thông tin một sản phẩm
app.get("/api/sanpham/:id", (req, res) => {
  // :id là một route parameter
  const productId = req.params.id; // Lấy ID
  const product = sanPham.find((item) => item.id === productId); // Tìm sản phẩm

  if (product) {
    res.json(product);
  } else {
    res.status(404).send({ message: "Không tìm thấy sản phẩm!" });
  }
});

// API để cập nhật thông tin sản phẩm
app.put("/api/sanpham/:id", (req, res) => {
  const productId = req.params.id;
  const { name, price, brand, warranty } = req.body; // Lấy thông tin sản phẩm

  // Tìm vị trí sản phẩm trong mảng
  const productIndex = sanPham.findIndex((product) => product.id === productId);

  if (productIndex !== -1) {
    // Nếu tìm thấy sản phẩm
    const updatedProduct = { ...sanPham[productIndex] };

    if (name) {
      // Nếu có tên sản phẩm mới
      updatedProduct.name = name; // Cập nhật tên sản phẩm
    } else {
      updatedProduct.name = sanPham[productIndex].name; // Giữ nguyên tên sản phẩm
    }

    if (price !== undefined) {
      updatedProduct.price = parseInt(price);
    } else {
      updatedProduct.price = sanPham[productIndex].price;
    }

    if (brand) {
      updatedProduct.brand = brand;
    } else {
      updatedProduct.brand = sanPham[productIndex].brand;
    }

    if (warranty) {
      updatedProduct.warranty = warranty;
    } else {
      updatedProduct.warranty = sanPham[productIndex].warranty;
    }

    // Cập nhật sản phẩm trong mảng
    sanPham[productIndex] = updatedProduct; // Thay thế sản phẩm cũ bằng sản phẩm mới

    console.log("Sản phẩm đã được cập nhật:", updatedProduct);

    // Trả về sản phẩm đã cập nhật
    res.json(updatedProduct);
  } else {
    res.status(404).send({ message: "Không tìm thấy sản phẩm!" });
  }
});

app.listen(port, () => console.log(`Server đang chạy tại http://localhost:${port}`));

// test commit