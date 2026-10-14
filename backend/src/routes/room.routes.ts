import { Router } from "express";
import {
  getRoomController,
  listRoomsController,
  roomController,
} from "../controller/room.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import {
  getAuctionController,
  joinRoomController,
  leaveRoomController,
  placeBidController,
  selectTeamController,
} from "../controller/room-action.controller.ts";

const router = Router();

router.post("/rooms/create", authMiddleware, roomController);
router.get("/rooms/public-rooms", authMiddleware, listRoomsController);
router.get("/rooms/get/:roomId", authMiddleware, getRoomController);
router.post("/rooms/join", authMiddleware, joinRoomController);
router.post("/rooms/:roomId/leave", authMiddleware, leaveRoomController);
router.post("/rooms/:roomId/team", authMiddleware, selectTeamController);
router.get("/rooms/:roomId/auction", authMiddleware, getAuctionController);
router.post("/rooms/:roomId/auction/bid", authMiddleware, placeBidController);

export default router;
