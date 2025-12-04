import express from "express";
import { registerUser } from "../controllers/authController.js";
import { loginUser } from "../controllers/authController.js";


const router = express.Router();

// Register route
router.post("/register", registerUser);
//// Login route 
router.post("/login", loginUser);



export default router;
