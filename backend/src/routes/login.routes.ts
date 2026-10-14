import { Router } from "express";
import { loginController } from "../controller/login.controller.ts";
const loginRouter = Router();

loginRouter.post("/login",loginController)

export default loginRouter;