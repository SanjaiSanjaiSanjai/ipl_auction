import { Router } from "express";
import { tokenController } from "../controller/token.controller.ts";
const tokenRoutes = Router();

tokenRoutes.post('/token',tokenController);

export default tokenRoutes;