import { Router } from "express";
import {
    getHolidays,
    getHolidayById,
    createHoliday,
    batchCreateHolidaysController,
    updateHoliday,
    deleteHoliday
} from "../controllers/holidayController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const holidayRoutes = Router();

// All endpoints require authentication
holidayRoutes.use(authenticate);

// Read holidays (Accessible to all authenticated roles: PM & Resource)
holidayRoutes.get("/", getHolidays);
holidayRoutes.get("/:id", getHolidayById);

// Manage holidays (Controller ensures only PM can execute)
holidayRoutes.post("/batch", batchCreateHolidaysController);
holidayRoutes.post("/", createHoliday);
holidayRoutes.put("/:id", updateHoliday);
holidayRoutes.patch("/:id", updateHoliday);
holidayRoutes.delete("/:id", deleteHoliday);

export default holidayRoutes;
