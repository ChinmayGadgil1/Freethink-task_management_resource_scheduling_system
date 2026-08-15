import express from "express";
import { initializeDatabase } from "./database/init.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.use("/api/auth", authRoutes);

async function startServer() {
    try {
        await initializeDatabase();

        app.listen(3000, () => {
            console.log("Server running on http://localhost:3000");
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();