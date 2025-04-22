const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const app = express();
const port = 3000;

const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);
const dbName = "config";
const collectionName = "product"; // Tên collection trong MongoDB

// Cấu hình multer để lưu trữ ảnh trong thư mục 'public/images'
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public', 'images'));  // Đường dẫn lưu ảnh
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));  // Tạo tên ảnh duy nhất
  }
});

const upload = multer({ storage: storage });

// Middleware để phục vụ file tĩnh (HTML, CSS, Images)
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public/images")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB server");
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    console.log(`Number of documents in "${collectionName}": ${count}`);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

// API để lấy danh sách sản phẩm
app.get("/api/sanpham", async (req, res) => {
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);
    const products = await collection.find({}).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Lỗi server khi lấy dữ liệu" });
  } finally {
    await client.close();
  }
});

// Route để trả về file addProducts.html trong thư mục public/pages
app.get("/addProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "addProducts.html"));
});

// API để thêm sản phẩm và xử lý ảnh
app.post("/api/sanpham", upload.single("image"), async (req, res) => {
  const { id, name, price, brand, warranty } = req.body;
  const image = req.file ? `/images/${req.file.filename}` : '';  // Lưu đường dẫn ảnh vào MongoDB

  if (!id || !name || !price || !brand || !warranty) {
    return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ thông tin sản phẩm!" });
  }

  const newProduct = { id, name, price: parseInt(price), brand, warranty, image };

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    await collection.insertOne(newProduct);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: "Lỗi server khi thêm sản phẩm!" });
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

// API để cập nhật sản phẩm
app.put("/api/sanpham/:id", async (req, res) => {
  const productId = req.params.id;
  const { name, price, brand, warranty, image } = req.body;

  if (!name || !price || !brand || !warranty) {
    return res.status(400).json({ error: "Vui lòng cung cấp đầy đủ thông tin sản phẩm!" });
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    // Tạo đối tượng chứa thông tin cập nhật
    const updateData = {
      name,
      price: parseFloat(price),
      brand,
      warranty,
    };

    // Chỉ cập nhật hình ảnh nếu có
    if (image) {
      updateData.image = image;
    }

    const result = await collection.updateOne({ id: productId }, { $set: updateData });

    if (result.matchedCount === 0) {
      res.status(404).send({ message: "Không tìm thấy sản phẩm để cập nhật!" });
    } else {
      res.status(200).send({ message: "Sản phẩm đã được cập nhật thành công!" });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({ message: "Lỗi server khi cập nhật sản phẩm!" });
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
  res.sendFile(path.join(__dirname, "public/pages", "readProducts.html"));
});

// API để lọc sản phẩm
app.get("/api/sanpham/filter", async (req, res) => {
  const { minPrice, maxPrice, category, page = 1, limit = 10 } = req.query;
  const search = req.query.search || ""; // Nếu không có `search`, gán giá trị mặc định là chuỗi rỗng

  const query = {};

  // Lọc theo giá
  if (minPrice) query.price = { ...query.price, $gte: parseInt(minPrice) };
  if (maxPrice) query.price = { ...query.price, $lte: parseInt(maxPrice) };

  // Lọc theo loại sản phẩm dựa trên 4 ký tự đầu của id
  if (category) query.id = { $regex: `^${category}` };

  // Tìm kiếm gần đúng theo tên hoặc thương hiệu
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const skip = (parseInt(page) - 1) * parseInt(limit); // Tính số lượng bản ghi cần bỏ qua
    const products = await collection.find(query).sort({ price: -1 }).skip(skip).limit(parseInt(limit)).toArray();
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
  res.sendFile(path.join(__dirname, "public/pages", "updateProducts.html"));
});

// Route để trả về file deleteProducts.html trong thư mục public/pages
app.get("/deleteProducts", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages", "deleteProducts.html"));
});

// API để lấy chi tiết sản phẩm theo ID
app.get("/api/sanpham/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const product = await collection.findOne({ id: productId });
    if (!product) {
      res.status(404).send({ message: "Không tìm thấy sản phẩm!" });
    } else {
      res.status(200).json(product);
    }
  } catch (error) {
    console.error("Error getting product:", error);
    res.status(500).send({ message: "Lỗi server khi lấy thông tin sản phẩm!" });
  } finally {
    await client.close();
  }
});

// Các phần code khác trong script giữ nguyên ...

async function deleteProduct(productId) {
    if (confirm("Bạn có thật sự muốn xóa sản phẩm này không?")) {
        try {
            const res = await fetch(`/api/sanpham/${productId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                showCardMessage("Sản phẩm đã được xóa!", "success");
                applyFilters(); // Tải lại danh sách sản phẩm
            } else {
                showCardMessage("Không thể xóa sản phẩm.", "error");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            showCardMessage("Lỗi khi xóa sản phẩm.", "error");
        }
    }
}

// Đảm bảo các function renderCards, renderPagination và applyFilters được đóng ngoặc và kết thúc đúng
// Và kết thúc file script bằng dấu đóng </script>

// Lắng nghe server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  connectToMongoDB(); // chỉ chạy 1 lần khi khởi động server
});