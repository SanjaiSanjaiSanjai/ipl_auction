import { Router } from "express";
import {
  createAuctionPlayerController,
  listAuctionPlayersController,
} from "../controller/auction-data.controller.ts";
import { adminMiddleware } from "../middleware/admin.middleware.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";

const router = Router();


router.get("/auction-players", authMiddleware, listAuctionPlayersController);
router.post(
  "/auction-players",
  authMiddleware,
  adminMiddleware,
  createAuctionPlayerController,
);

export default router;
