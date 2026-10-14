import bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import { Team } from "../models/team.models.ts";
import { getAuctionState, placeBid } from "../service/auction.service.ts";
import { getRoomByRoomId, buildRoomPublicState } from "../service/room-state.service.ts";
import { NotFound } from "../errors/notfound.error.ts";
import { Unauthorize } from "../errors/unauthorize.error.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { io } from "../server.ts";

export const joinRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // ==================== GET AUTHENTICATED USER FROM TOKEN DECODE ===============
    const get_requestedUser_details = req.user;
    // if get_requestedUser_details variable is available any user details. we print it console.
    console.log("Requested User Details: ",get_requestedUser_details);
    // if get_requestedUser_details variable is not available any user details.we will throw authorized error.
    if (!get_requestedUser_details) {
       throw new Unauthorize("Authentication required",[{field: "get_requestedUser_details",issue:"USER_AUTHENTICATED",message: "user details is unavailable"}]);
    }
    //  VALIDATE AND NORMALIZE TO ROOMID
    // Convert room id in string if came roomid is number from frontend. we convert to that number to string and we can also convert it uppercase.
    const roomIdfromApi = String(req.body.roomId || "").trim().toUpperCase();
    // if it is came from successfully without any issues. first we will print it from console.
    console.log("ROOMID: ",roomIdfromApi);
    // if it is not available we are throw error roomid must.
    if (!roomIdfromApi) {
      throw new ValidationError("roomId is required",[{field:"roomIdfromAPI",issue:"NOT_FOUND",message:"roomId is required"}]);
    }
    const isPrivate  = req.body.password ? true : false
    // if above logics is pass then we move forward to process.
    // ===> I have a doubt ? In this function argument true is point outing to private room what if this api call public room!.
    const getRoomIdAllRoomDetails = await getRoomByRoomId(roomIdfromApi,isPrivate);
    // if getRoomIdAllRoomDetails is successfully fetch room details we print that room details console first.then we do next process.
    console.log("Room id room details : ",getRoomIdAllRoomDetails);
    // if it is not available we throw Not found error.
    if (!getRoomIdAllRoomDetails) {
      throw new NotFound("Room id room details is not found in DB",[{field: "getRoomIdAllRoomDetails",issue: "NOT_FOUND",message: "Room id room details is not found in DB"}]);
    }
    // think about what if this requested user is already should have in the room ?
    // check whether if this user is in the room.
    // 
    let playerIsExsisted = getRoomIdAllRoomDetails.players.find((candidate) => String(candidate.userId) === String(get_requestedUser_details.id));
    if (!playerIsExsisted) {
      //if this player is not available in this room. we will follow below instructions.
      // before we push this user in this particular room. we will verify for that room current status.because what if this not available in this room but this room status is change instead of waiting.This suitation this player not able fit insert this room because room is already full.
      if (getRoomIdAllRoomDetails.status !== 'waiting') {
        throw new ValidationError("This room is no longer is accepting new players",[{field: "getRoomIdAllRoomDetails",issue:"ROOM_NOT_WAITING",message:"Room is no longer accepting new payer"}])
      }
      // next we capacity check if room status is waiting but room player capacity is full then that palyer is allow in that room.in that suitation we don't allow that user in that room.
      if (getRoomIdAllRoomDetails.players.length >= getRoomIdAllRoomDetails.maxPlayers) {
        throw new ValidationError("Room is full", [{field: "players",issue: "ROOM_FULL",message: "Room is full",},]);
      }
      // after he is pass above conditions. that we check this room is private or not. if it is private we need password from this user.
      if (getRoomIdAllRoomDetails.isPrivate) {
        // it is true we get password from request body.
        const privateRoomPasswordFromReqBody = String(req.body.password || " ");
        // print password in console after we take password from req.body;
        console.log("Private room password: ",privateRoomPasswordFromReqBody);
        // validate this privateRoomPasswordFromReqBody variable because we throw error. if it is not available in password 
        // also we get and validate room id from db fetch data.
        // finally we compare this password and roomid password.
        if (!privateRoomPasswordFromReqBody || !getRoomIdAllRoomDetails.passwordHash || !(await bcrypt.compare(privateRoomPasswordFromReqBody,getRoomIdAllRoomDetails.passwordHash))) {
          throw new Unauthorize("Incorrect room password", [{field: "password",issue: "INVALID_PASSWORD",message: "Incorrect room password",}]);
        }
      }
      // so far in this place every condition is this user is pass we store this user details in this room db
      getRoomIdAllRoomDetails.players.push(
        {
        userId: get_requestedUser_details.id,
        username: get_requestedUser_details.username,
        joinedAt: new Date(),
        teamCode: null,
        connected: true,
        }
      )
      playerIsExsisted = getRoomIdAllRoomDetails.players[getRoomIdAllRoomDetails.players.length - 1];
    }
    else{
      // Print this user detais if he was available in players array.
      console.log("This is user is already have in the room: ",playerIsExsisted);
      // ===> why we don't check this user connected field is false or not before we assign playerIsExsisted.connected = true ?
      playerIsExsisted.connected = true;
    }
    // chceck now this room status and players count.
    if (getRoomIdAllRoomDetails.status === 'waiting' && getRoomIdAllRoomDetails.maxPlayers === getRoomIdAllRoomDetails.players.length) {
      // after this user join the room count current players list in this room. if it is full this room capacity.now we change this room status
      // Note: this is condition will work room status is must waiting.
      getRoomIdAllRoomDetails.status = 'team_selection';
    }
    // finally we save final data in db.
    await getRoomIdAllRoomDetails.save();
    // now we want final version of room details data.
    const getEntierRoomDetails = await buildRoomPublicState(getRoomIdAllRoomDetails);
    io.to(roomIdfromApi).emit("ROOM_UPDATED", {
      roomId: getEntierRoomDetails.roomId,
      state: getEntierRoomDetails,
    });
    res.status(200).json(getEntierRoomDetails);
  } catch (error) {
    next(error);
  }
};

export const leaveRoomController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = String(req.params.roomId).toUpperCase();
    const room = await getRoomByRoomId(roomId);
    if (!room || !req.user) throw new NotFound("Room not found");
    const player = room.players.find((candidate) => String(candidate.userId) === String(req.user?.id));
    if (player) player.connected = false;
    await room.save();

    const publicState = await buildRoomPublicState(room);
    io.to(roomId).emit("ROOM_UPDATED", { roomId: room.roomId, state: publicState });
    res.json(publicState);
  } catch (error) {
    next(error);
  }
};

export const selectTeamController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomId = String(req.params.roomId).toUpperCase();
    const room = await getRoomByRoomId(roomId);
    const teamCode = String(req.body.teamCode || "").trim().toUpperCase();
    if (!room || !req.user) throw new NotFound("Room not found");
    if (room.status !== "team_selection") {
      throw new ValidationError("Team selection is not open", [
        { field: "status", issue: "NOT_TEAM_SELECTION", message: "Team selection is not open" },
      ]);
    }
    if (!(await Team.exists({ code: teamCode, isActive: true }))) {
      throw new NotFound("Invalid team code");
    }
    const player = room.players.find((candidate) => String(candidate.userId) === String(req.user?.id));
    if (!player) throw new NotFound("You are not in this room");
    if (player.teamCode) {
      throw new ValidationError("You have already selected a team", [
        { field: "teamCode", issue: "ALREADY_SELECTED", message: "You have already selected a team" },
      ]);
    }
    if (room.players.some((candidate) => candidate.teamCode === teamCode)) {
      throw new ValidationError("Team already taken", [
        { field: "teamCode", issue: "TEAM_TAKEN", message: "Team already taken" },
      ]);
    }
    player.teamCode = teamCode;
    await room.save();
    const publicState = await buildRoomPublicState(room);
    // Real-time broadcast: notify all participants that a franchise was claimed
    io.to(roomId).emit("ROOM_UPDATED", { roomId: room.roomId, state: publicState });
    res.json(publicState);
  } catch (error) {
    next(error);
  }
};

export const getAuctionController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await getAuctionState(String(req.params.roomId));
    if (!state) throw new NotFound("Auction has not started");
    res.json(state);
  } catch (error) {
    next(error);
  }
};

export const placeBidController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Unauthorize("Unauthorized", [{ field: "Authorization", issue: "REQUIRED", message: "Unauthorized" }]);
    const roomId = String(req.params.roomId).toUpperCase();
    const room = await getRoomByRoomId(roomId);
    const player = room?.players.find((candidate) => String(candidate.userId) === String(req.user?.id));
    if (!player?.teamCode) throw new ValidationError("You have not selected a team", [{ field: "teamCode", issue: "REQUIRED", message: "You have not selected a team" }]);
    const playerId = String(req.body.playerId || "").trim();
    if (!playerId) {
      throw new ValidationError("Player ID is required to place a bid", [
        { field: "playerId", issue: "REQUIRED", message: "Player ID is required" },
      ]);
    }
    const result = await placeBid(
      roomId,
      String(req.user.id),
      player.teamCode,
      playerId,
    );
    if (!result.ok) throw new ValidationError(result.error, [{ field: "bid", issue: "BID_REJECTED", message: result.error }]);
    res.json(result.state);
  } catch (error) {
    next(error);
  }
};
