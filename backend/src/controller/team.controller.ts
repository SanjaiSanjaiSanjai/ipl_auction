import { NextFunction, Request, Response } from "express";
import { Team } from "../models/team.models.ts";
import { NotFound } from "../errors/notfound.error.ts";
import { ValidationError } from "../errors/validation.error.ts";
import { listTeamsService } from "../service/team.service.ts";

export const listTeamsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const teams = await listTeamsService();
    res.status(200).json({
      success: true,
      message: "Teams fetched successfully",
      data: teams,
    });
  } catch (error) {
    next(error);
  }
};

export const createTeamController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, name, color, isActive = true } = req.body;
    // Normalize team code
    const normalizedCode = code.trim().toUpperCase();
    // Check whether team already exists
    const existingTeam = await Team.findOne({
      code: normalizedCode,
    });
    if (existingTeam) {
  throw new ValidationError(
    `Team with code ${normalizedCode} already exists`,
    [{
      field: "code",
      issue: "ALREADY_EXISTS",
      message: `Team with code ${normalizedCode} already exists`,
    }],
  );
}
    // Create new team
    const team = await Team.create({
      code: normalizedCode,
      name: name.trim(),
      color: color || "#3b82f6",
      isActive,
    });
    res.status(201).json({
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTeamController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { teamId } = req.params;

    if (!teamId) {
      throw new NotFound("teamId is required",[{field: 'teamId',issue:'TEAM_UNAVAILABLE',message: "team is required"}]);
    }

    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      throw new NotFound("Team not found",[{field:'team',issue:"NOT_FOUND",message:"Team is not found"}]);
    }

    return res.status(200).json({
      message: "Team deleted successfully",
      data: team,
    });
  } catch (error) {
    next(error);
  }
};