const express = require("express");
const path = require("path");
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'config';      
const collectionName = 'listProduct';

async function connectToMongoDB() {
  try {
      // Kết nối đến MongoDB
      await client.connect();
      console.log('Connected successfully to MongoDB server');

      // Truy cập cơ sở dữ liệu
      const db = client.db(dbName);

      // Truy cập collection
      const collection = db.collection(collectionName);

      // Đếm số lượng documents trong collection
      const count = await collection.countDocuments();
      console.log(` Number of documents in "${collectionName}": ${count}`);

  } catch (err) {
      console.error('Error connecting to MongoDB:', err);
  } finally {
      // Đóng kết nối
      await client.close();
      console.log('MongoDB connection closed');
  }
}


// Cấu hình để phục vụ file tĩnh (HTML, CSS)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/pages")));
app.use(express.static(path.join(__dirname, "public/images")));


// Middleware để xử lý dữ liệu từ form
app.use(express.json());

async function getProductsFromMongoDB() {
  await client.connect();
  const db = client.db(dbName);
  const collection = db.collection(collectionName);
  const data = await collection.find({}).toArray();
  return data;
}

// API để lấy danh sách sản phẩm
app.get('/api/sanpham', async (req, res) => {
  try {
    const products = await getProductsFromMongoDB();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu" });
  }
});

// Route để trả về file addProducts.html trong thư mục public/pages
app.get("/addProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/addProducts.html"));
});

app.get("/deleteProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/deleteProducts.html"));
});

// thêm vào database nẹ 
app.post('/api/sanpham', async (req, res) => {
  const { id, name, price, brand, warranty } = req.body;

  if (!id || !name || !price || !brand || !warranty) {
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin sản phẩm!' });
  }

  const newProduct = { id, name, price: parseInt(price), brand, warranty };

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi thêm sản phẩm!' });
  } finally {
    await client.close();
  }
});


// API để xóa sản phẩm
app.delete("/api/sanpham/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteOne({ id: productId });
    if (result.deletedCount === 0) {
      res.status(404).send({ message: "Không tìm thấy sản phẩm!" });
    } else {
      res.status(200).send({ message: "Sản phẩm đã được xóa thành công!" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send({ message: "Lỗi server khi xóa sản phẩm!" });
  } finally {
    await client.close();
  }
});

// Route chính để trả về file index.html trong thư mục public/pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "index.html"));
});

// Route để trả về file FProducts.html trong thư mục public/pages
app.get("/fProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/readProducts.html"));
});

// API để lọc sản phẩm
app.get('/api/sanpham/filter', async (req, res) => {
  const { minPrice, maxPrice, category, page = 1, limit = 10 } = req.query;

  const query = {};

  // Lọc theo giá
  if (minPrice) query.price = { ...query.price, $gte: parseInt(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseInt(maxPrice) };

  // Lọc theo loại sản phẩm dựa trên 4 ký tự đầu của id
  if (category) query.id = { $regex: `^${category}` };

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const skip = (parseInt(page) - 1) * parseInt(limit); // Tính số lượng bản ghi cần bỏ qua
    const products = await collection.find(query).skip(skip).limit(parseInt(limit)).toArray();
    const total = await collection.countDocuments(query);

    res.json({ products, total });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu" });
  } finally {
    await client.close();
  }
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




app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  connectToMongoDB(); // chỉ chạy 1 lần khi khởi động server
});

// test commit