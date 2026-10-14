import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { adminMiddleware } from "../middleware/admin.middleware.ts";
import { createTeamController, deleteTeamController, listTeamsController } from "../controller/team.controller.ts";

const router = Router();

router.get("/teams/getall", authMiddleware, listTeamsController);
router.post("/teams/create", authMiddleware, adminMiddleware, createTeamController);
router.delete("/teams/:teamId",authMiddleware,adminMiddleware,deleteTeamController,);

export default router;