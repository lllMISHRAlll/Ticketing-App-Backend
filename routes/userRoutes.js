import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import {
  getUserProfile,
  updateUserProfile,
} from "../controllers/userController.js";

const router = express.Router();

router
  .route("/profile")
  .get(verifyToken, getUserProfile)
  .put(verifyToken, updateUserProfile);

export default router;
