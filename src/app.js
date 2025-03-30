import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import bodyParser from "body-parser";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// import parts of routes

import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";

import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";






//using those routes

app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

export default app;
