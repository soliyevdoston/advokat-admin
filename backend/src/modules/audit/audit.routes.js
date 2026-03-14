import { Router } from "express";
import { createAuditLog, getAuditLogs } from "./audit.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = Router();

// Admin paneldan kelgan amallarni yozish
router.post("/", authMiddleware, roleMiddleware("admin"), createAuditLog);

// Audit loglarni faqat admin ko'radi
router.get("/", authMiddleware, roleMiddleware("admin"), getAuditLogs);

export default router;
