import { Team } from "../models/team.models.ts";

export const listTeamsService = async () => {
  const teams = await Team.find({
    isActive: true,
  })
    .sort({ name: 1 })
    .lean();

  return teams;
};