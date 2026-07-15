import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import connectDB from "./config/db.js";

// ✅ Import models (ensures they're registered with Mongoose)
import User from "./models/User.js";
import Product from "./models/Product.js";
import Order from "./models/Order.js";
import Inquiry from "./models/Inquiry.js";
import Caregiver from "./models/Caregiver.js";
import Seller from "./models/Seller.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import School from "./models/School.js";

// ✅ Import all routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js"; // ✅ Added buyer routes
import uploadRoutes from "./routes/uploadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

/**
 * ✅ Swagger / OpenAPI setup
 */
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hands and Hope API",
      version: "1.0.0",
      description:
        "API documentation for Hands and Hope (auth, products, sellers, buyers, dashboard).",
    },
    servers: [
      {
        url: "https://handsandhope-31gp.onrender.com", // Render production URL
      },
      {
        url: "http://localhost:5000", // local dev
      },
    ],
  },
  // Paths where swagger-jsdoc should look for JSDoc comments
  apis: [
    "./routes/authRoutes.js",
    "./routes/productRoutes.js",
    "./routes/sellerRoutes.js",
    "./routes/buyerRoutes.js",
    "./routes/dashboardRoutes.js",
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// ✅ Serve Swagger UI at /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * ✅ Middleware
 * CORS + body parsers
 */
const corsOptions = {
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "https://handsandhope-31gp.onrender.com", // backend (if needed)
    "https://handsandhope-git-viona-ronaldokipkirui90-gmailcoms-projects.vercel.app", // Buyers (Vercel)
    // TODO: replace with actual Sellers Vercel URL, e.g.:
    // "https://handsandhope-sellers-xxxxx.vercel.app",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Increase payload size limit for base64 images (50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/**
 * ✅ Basic health routes
 */
app.get("/", (req, res) => {
  res.json({
    message: "Hands and Hope API Server",
    status: "Running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * ✅ Route mounting
 */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/buyers", buyerRoutes); // ✅ Added this line
app.use("/api/uploads", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

/**
 * ✅ Connect to MongoDB and start server
 */
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Swagger docs available at /api-docs`);
});