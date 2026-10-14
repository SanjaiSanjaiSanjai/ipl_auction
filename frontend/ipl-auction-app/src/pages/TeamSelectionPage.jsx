import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import socket from "../socket/socket";
import axiosClient from "../axios/apiclient";
import { getLocalStorage } from "../service/storage/localstorage";
import { jwtDecode } from "jwt-decode";
import "../styles/TeamSelection.css";

const GETALL_TEAM_API_URL = import.meta.env.VITE_API_GETALL_TEAM;
const SELECT_TEAM_API_URL = import.meta.env.VITE_API_SELECT_TEAM;
const GET_ROOM_API_URL = import.meta.env.VITE_API_GET_ROOM;
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

const getCurrentUserId = () => {
    try {
        const accessToken = getLocalStorage(ACCESS_TOKEN_KEY);
        const payload = jwtDecode(accessToken);
        return payload?.id ? String(payload.id) : null;
    } catch {
        return null;
    }
};

function TeamSelectionPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();

    const [teams, setTeams] = useState([]);
    const [claimedTeams, setClaimedTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [roomData, setRoomData] = useState(null);

    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState(false);
    const [error, setError] = useState("");

    /*
     * STEP 1
     * Fetch all available cricket teams when the page loads.
     */
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                if (!GETALL_TEAM_API_URL || GETALL_TEAM_API_URL == undefined) {
                    throw new Error("get all api url is undefined check .env variable");
                }
                setLoading(true);
                setError("");

                const response = await axiosClient.get(GETALL_TEAM_API_URL);
                console.log("all team response: ",response.data.data);
                setTeams(response.data.data);
            } catch (error) {
                console.error("Failed to fetch teams:", error);

                setError(
                    error.response?.data?.message ||
                    "Failed to load teams"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Load room ownership and player selections for the host-only auction action.
    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const response = await axiosClient.get(`${GET_ROOM_API_URL}/${roomId}`);
                setRoomData(response.data.data);
            } catch (error) {
                console.error("Failed to fetch room details:", error);
            }
        };

        if (roomId && GET_ROOM_API_URL) {
            fetchRoom();
        }
    }, [roomId]);

    /*
     * STEP 2
     * Join the Socket.IO room and listen for team selections.
     *
     * When another player selects a team, every player receives
     * ROOM_TEAM_SELECTED and that team becomes disabled.
     */
    useEffect(() => {
        if (!roomId) {
            return;
        }

        socket.emit("ROOM_JOIN", {
            roomId,
        });

        const handleTeamSelected = ({ teamCode }) => {
            setClaimedTeams((previousTeams) => {
                if (previousTeams.includes(teamCode)) {
                    return previousTeams;
                }

                return [...previousTeams, teamCode];
            });
        };

        const handleRoomUpdate = ({ state }) => {
            if (state) {
                setRoomData(state);
                setClaimedTeams(Object.keys(state.claimedTeams || {}));
            }
        };

        const handleRoomStarted = ({ roomId: startedRoomId }) => {
            if (startedRoomId === roomId) {
                navigate(`/rooms/${startedRoomId}/auction`);
            }
        };

        socket.on(
            "ROOM_TEAM_SELECTED",
            handleTeamSelected
        );
        socket.on("ROOM_UPDATED", handleRoomUpdate);
        socket.on("ROOM_STARTED", handleRoomStarted);

        return () => {
            socket.off(
                "ROOM_TEAM_SELECTED",
                handleTeamSelected
            );
            socket.off("ROOM_UPDATED", handleRoomUpdate);
            socket.off("ROOM_STARTED", handleRoomStarted);
        };
    }, [roomId, navigate]);

    /*
     * STEP 3
     * Player selects a team.
     *
     * The backend is the final authority.
     * Even if the frontend says a team is available,
     * the backend checks whether another player already claimed it.
     */
    const handleSelectTeam = async (teamCode) => {
        if (claimedTeams.includes(teamCode)) {
            return;
        }

        try {
            if (!SELECT_TEAM_API_URL || SELECT_TEAM_API_URL == undefined) {
                    throw new Error("SELECT TEAM api url is undefined check .env variable");
                }
            setSelecting(true);
            setError("");

            const url = SELECT_TEAM_API_URL.replace(':roomId',roomId);
            const response = await axiosClient.post(
                url,
                {
                    teamCode,
                }
            );

            setSelectedTeam(teamCode);

            /*
             * We don't depend only on this local update.
             * The server's Socket.IO event will synchronize
             * the selection with every player.
             */
            setClaimedTeams((previousTeams) => {
                if (previousTeams.includes(teamCode)) {
                    return previousTeams;
                }

                return [...previousTeams, teamCode];
            });

            console.log(
                "Team selected:",
                response.data
            );
        } catch (error) {
            console.error(
                "Failed to select team:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Failed to select team"
            );
        } finally {
            setSelecting(false);
        }
    };

    // Uses the same ROOM_START socket event as RoomPage's Start Team Selection button.
    const handleStartAuction = () => {
        const currentUserId = getCurrentUserId();
        if (!isHost || !allPlayersSelected || !currentUserId) {
            return;
        }

        socket.emit("ROOM_START", { roomId, userId: currentUserId });
    };

    const players = roomData?.players ?? [];
    const currentUserId = getCurrentUserId();
    const isHost =
        currentUserId !== null &&
        String(roomData?.createdBy) === currentUserId;
    const allPlayersSelected =
        players.length > 0 && players.every((player) => Boolean(player.teamCode));

    if (loading) {
        return (
            <main className="team-selection-page team-selection-page--state">
                <div className="team-selection-state" role="status">
                    <span className="team-selection-loader" aria-hidden="true" />
                    <h1>Loading teams</h1>
                    <p>Preparing the team draft for this room…</p>
                </div>
            </main>
        );
    }

    return (
        <main className="team-selection-page">
            <div className="team-selection-shell">
                <header className="team-selection-topbar">
                    <span className="team-selection-brand"><span className="team-selection-brand-mark">IPL</span>Auction room</span>
                    <span className="team-selection-room">ROOM · {roomId}</span>
                </header>
                <section className="team-selection-hero" aria-labelledby="team-selection-title">
                    <div>
                        <p className="team-selection-kicker">Step 1 of the auction</p>
                        <h1 id="team-selection-title">Choose your team</h1>
                        <p className="team-selection-subtitle">
                            {selectedTeam
                                ? `You are representing ${selectedTeam}. Your selection is locked in.`
                                : "Pick an available IPL team. Once selected, it cannot be changed for this auction."}
                        </p>
                    </div>
                    <div className="team-selection-progress">
                        <span>{selectedTeam ? "Your team" : "Teams available"}</span>
                        <strong>{selectedTeam || `${teams.length - claimedTeams.length} / ${teams.length}`}</strong>
                    </div>
                </section>

                {isHost && (
                    <section className="team-selection-auction-action" aria-label="Start auction">
                        <div>
                            <p className="team-selection-kicker">Host controls</p>
                            <h2>Start the auction</h2>
                            <p>
                                {allPlayersSelected
                                    ? "All players have selected a team. Start the live auction for everyone."
                                    : "Waiting for every player to select a team before the auction can start."}
                            </p>
                        </div>
                        <button
                            type="button"
                            className="team-selection-start-button"
                            onClick={handleStartAuction}
                            disabled={!allPlayersSelected}
                        >
                            {allPlayersSelected ? "Start Auction" : "Waiting for team selections"}
                        </button>
                    </section>
                )}

                {error && <p className="error-message team-selection-error" role="alert">{error}</p>}

                {teams.length === 0 ? (
                    <p className="team-selection-empty">No teams are available for this auction yet.</p>
                ) : (
                    <section className="team-selection-grid" aria-label="Available teams">
                        {teams.map((team) => {
                            const isClaimed =
                                claimedTeams.includes(team.code);

                            const isMyTeam =
                                selectedTeam === team.code;

                            const cardState = isMyTeam
                                ? "team-card--selected"
                                : isClaimed
                                ? "team-card--claimed"
                                : selecting
                                ? "team-card--selecting"
                                : "";

                            return (
                                <article className={`team-card ${cardState}`} key={team.code} style={{ "--team-color": team.color || "#3b82f6" }}>
                                    <div className="team-card-accent" />
                                    <div className="team-card-body">
                                        <span className="team-card-badge">{team.code}</span>
                                        <h2>{team.name}</h2>
                                        <p className="team-card-code">Team code · {team.code}</p>
                                        <div className="team-card-footer">
                                            <button
                                                className="team-select-button"
                                                disabled={isClaimed || selecting || selectedTeam !== null}
                                                onClick={() => handleSelectTeam(team.code)}
                                            >
                                                {isMyTeam
                                                    ? "Your Team"
                                                    : isClaimed
                                                    ? "Already Selected"
                                                    : selecting
                                                    ? "Selecting…"
                                                    : "Select Team"}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </main>
    );
}

export default TeamSelectionPage;
