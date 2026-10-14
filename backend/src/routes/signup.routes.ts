import {Router} from "express";
import { signupController } from "../controller/signup.controller.ts";
const router = Router();
router.post("/signup",signupController);
export default router;