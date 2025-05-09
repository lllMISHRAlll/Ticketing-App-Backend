import express from "express";
import {
  getTickets,
  updateTicketStatus,
  assignTicket,
  createCompleteTicket,
} from "../controllers/ticketController.js";

import { protect, admin, teamMember } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getTickets);

router.route("/createticket").post(createCompleteTicket);

router.route("/:id/status").patch(protect, teamMember, updateTicketStatus);

router.route("/:id/assign").patch(protect, assignTicket);

export default router;
