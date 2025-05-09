import express from "express";
import {
  addTeammate,
  getTeamDetails,
  removeTeammate,
  updateTeammate,
} from "../controllers/teamController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTeamDetails);

router.post("/addtoteam", protect, addTeammate);

router.patch("/update-member/:memberId", protect, updateTeammate);

router.delete("/remove/:memberId", protect, removeTeammate);

export default router;
