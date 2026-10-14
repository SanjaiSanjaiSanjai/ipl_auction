import { NextFunction, Request, Response } from "express";
import { AuctionPlayer } from "../models/auction-player.models.ts";
import { createAuctionPlayerService } from "../service/auction-player.service.ts";


export const listAuctionPlayersController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json(
      await AuctionPlayer.find({ isActive: true }).sort({ name: 1 }).lean(),
    );
  } catch (error) {
    next(error);
  }
};

export const createAuctionPlayerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const player = await createAuctionPlayerService(req.body);
    res.status(201).json({
      message: "Auction player created successfully",
      data: player,
    });
  } catch (error) {
    next(error);
  }
};
