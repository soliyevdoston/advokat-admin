import { pool } from "../../config/db.js";

const toNum = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const createAuditLog = async (req, res) => {
  try {
    const { action, target = "-", detail = "-", metadata = null } = req.body || {};

    if (!action || !String(action).trim()) {
      return res.status(400).json({ success: false, message: "action majburiy" });
    }

    const actor = req.user?.email || req.user?.id || "unknown";

    const { rows } = await pool.query(
      `INSERT INTO audit_logs (action, actor, target, detail, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, action, actor, target, detail, metadata, created_at`,
      [String(action).trim(), String(actor), String(target), String(detail), metadata]
    );

    return res.status(201).json({ success: true, log: rows[0] });
  } catch (err) {
    console.error("createAuditLog error:", err);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, toNum(req.query.limit, 50)));
    const offset = Math.max(0, toNum(req.query.offset, 0));

    const { rows } = await pool.query(
      `SELECT id, action, actor, target, detail, metadata, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return res.status(200).json({ success: true, logs: rows });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return res.status(500).json({ success: false, message: "Server xatosi" });
  }
};
