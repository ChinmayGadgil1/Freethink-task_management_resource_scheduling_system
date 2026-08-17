import express from "express";
import { initializeDatabase } from "./database/init.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// CORS middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

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