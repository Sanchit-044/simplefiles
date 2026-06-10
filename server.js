require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const { upload, cloudinary } = require("./config/cloudinary");
const Image = require("./models/Image");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Connect to MongoDB ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// GET / ───────────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "backend running" });
});

// ── POST /api/upload ──────────────────────────────────────────────────────────
// Body: form-data → image (File), title (Text), description (Text)
app.post("/api/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }

    // Save metadata to MongoDB
    const newImage = await Image.create({
      title,
      description: description || "",
      imageName: req.file.originalname,
      imageUrl: req.file.path,         // Cloudinary URL
      cloudinaryId: req.file.filename, // Cloudinary public_id
    });

    return res.status(200).json({
      id: newImage._id,
      title: newImage.title,
      description: newImage.description,
      imageName: newImage.imageName,
      imageUrl: newImage.imageUrl,
      uploadedAt: newImage.createdAt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/images ───────────────────────────────────────────────────────────
// Returns all uploaded images from MongoDB
app.get("/api/images", async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }); // newest first

    const result = images.map((img) => ({
      id: img._id,
      title: img.title,
      description: img.description,
      imageName: img.imageName,
      imageUrl: img.imageUrl,
      uploadedAt: img.createdAt,
    }));

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/images/:id ───────────────────────────────────────────────────
// Deletes an image by ID (both from MongoDB and Cloudinary)
app.delete("/api/images/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid image id." });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: "Image not found." });
    }

    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    await Image.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Image deleted successfully.",
      id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`   POST  http://localhost:${PORT}/api/upload`);
  console.log(`   GET   http://localhost:${PORT}/api/images`);
  console.log(`   DELETE http://localhost:${PORT}/api/images/:id`);
});