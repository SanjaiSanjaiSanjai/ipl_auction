import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../axios/apiclient";
import socket, { waitForSocketConnection } from "../socket/socket";
import "../styles/RoomPage.css";
import { getLocalStorage } from "../service/storage/localstorage";
import { jwtDecode } from "jwt-decode";

const API_GET_ROOM_URL = import.meta.env.VITE_API_GET_ROOM;
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

/**
 * Get the current user's ID from a JWT stored in localStorage.
 *
 * The function checks all localStorage values and looks for a valid JWT.
 * It supports common ID field names: id, userId, and sub.
 */
function getCurrentUserId() {
  let value = getLocalStorage(ACCESS_TOKEN_KEY);
  value = jwtDecode(value);
  if (!value) {
    return;
  }
  console.log("Acces token user details: ", value);
  try {
    const userId = value.id;
    if (userId) {
      return String(userId);
    }
  } catch (error) {
    console.log("get access token key: ", error.message);
  }
  return null;
}

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingTeamSelection, setStartingTeamSelection] = useState(false);
  const [startTeamSelectionError, setStartTeamSelectionError] = useState("");

  // Socket.IO connection
  // useEffect(() => {
  //   console.log("Connecting Socket.IO...");

  //   socket.connect();

  //   const handleConnect = () => {
  //     console.log("✅ Socket connected:", socket.id);
  //   };

  //   const handleDisconnect = (reason) => {
  //     console.log("❌ Socket disconnected:", reason);
  //   };

  //   socket.on("connect", handleConnect);
  //   socket.on("disconnect", handleDisconnect);

  //   return () => {
  //     socket.off("connect", handleConnect);
  //     socket.off("disconnect", handleDisconnect);

  //     socket.disconnect();
  //   };
  // }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const fetchRoomData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axiosClient.get(`${API_GET_ROOM_URL}/${roomId}`);

        setRoomData(response.data.data);
      } catch (err) {
        console.error("Failed to fetch room:", err);
        setError("Failed to load room.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    const handleRoomUpdate = (updateRoom) => {
      console.log("ROOM_UPDATED received:", updateRoom);

      // Backend sends { roomId, state }
      // Our roomData state should contain only the actual room.
      if (!updateRoom?.state) {
        console.warn("ROOM_UPDATED received without state:", updateRoom);
        return;
      }

      setRoomData(updateRoom.state);
    };

    // Register listener FIRST
    socket.on("ROOM_UPDATED", handleRoomUpdate);

    return () => {
      console.log("Removing ROOM_UPDATED listener");

      socket.off("ROOM_UPDATED", handleRoomUpdate);
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    console.log("Join socket.io room:", roomId);

    socket.emit("ROOM_JOIN", {
      roomId,
    });

    return () => {
      console.log("Leave socket.io room:", roomId);

      socket.emit("ROOM_LEAVE", {
        roomId,
      });
    };
  }, [roomId]);

  useEffect(() => {
    const handleRoomStarted = ({ roomId: startedRoomId }) => {
      if (String(startedRoomId).toUpperCase() !== String(roomId).toUpperCase()) {
        return;
      }
      console.log("can navigate to team selection page for room:", startedRoomId);
      navigate(`/rooms/${startedRoomId}/team`);
    };
    socket.on("ROOM_STARTED", handleRoomStarted);
    return () => {
      socket.off("ROOM_STARTED", handleRoomStarted);
    };
  }, [roomId, navigate]);

  if (loading) {
    return (
      <main className="room-page room-page--state">
        <div className="room-state-card" role="status">
          <span className="room-loader" aria-hidden="true" />
          <p>Setting up the auction room…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="room-page room-page--state">
        <div className="room-state-card room-state-card--error" role="alert">
          <span className="room-state-icon" aria-hidden="true">
            !
          </span>

          <h1>We couldn’t load this room</h1>

          <p>{error}</p>

          <button
            className="room-back-button"
            onClick={() => navigate("/home")}
          >
            Back to rooms
          </button>
        </div>
      </main>
    );
  }

  if (!roomData) {
    return (
      <main className="room-page room-page--state">
        <div className="room-state-card" role="status">
          <h1>Room not found</h1>

          <p>This auction room may have ended or is no longer available.</p>

          <button
            className="room-back-button"
            onClick={() => navigate("/home")}
          >
            Browse rooms
          </button>
        </div>
      </main>
    );
  }

  const players = roomData.players ?? [];

  const playersRemaining = Math.max(
    (roomData.maxPlayers ?? 0) - players.length,
    0,
  );

  const currentUserId = getCurrentUserId();

  const isHost =
    currentUserId !== null &&
    String(roomData.createdBy) === String(currentUserId);

  const isRoomFull =
    roomData.maxPlayers > 0 && players.length >= roomData.maxPlayers;

  /*
   * Start Team Selection changes:
   * Only the host sees this button. It becomes clickable when
   * the room reaches maxPlayers and navigates to the team-selection page.
   */
  const handleStartTeamSelection = async () => {
    if (!isHost || !isRoomFull || startingTeamSelection) {
      return;
    }

    if (!currentUserId) {
      setStartTeamSelectionError("Could not identify the signed-in host. Please sign in again.");
      return;
    }

    setStartingTeamSelection(true);
    setStartTeamSelectionError("");
    try {
      await waitForSocketConnection();
    } catch {
      setStartingTeamSelection(false);
      setStartTeamSelectionError(
        "Could not connect to the live auction service. Please try again.",
      );
      return;
    }

    socket.timeout(5000).emit(
      "ROOM_START",
      { roomId },
      (timeoutError, response) => {
        setStartingTeamSelection(false);

        if (timeoutError) {
          setStartTeamSelectionError(
            "The server did not respond. Check your connection and try again.",
          );
          return;
        }

        if (!response?.ok) {
          setStartTeamSelectionError(
            response?.message || "Could not start team selection.",
          );
          return;
        }

        navigate(`/rooms/${String(roomId).toUpperCase()}/team`);
      },
    );
  };

  const statusLabels = {
    waiting: "Waiting for players",
    team_selection: "Team selection",
    playing: "Auction in progress",
    finished: "Auction finished",
  };

  const status =
    statusLabels[roomData.status] ?? roomData.status ?? "Room open";

  return (
    <main className="room-page">
      <header className="room-topbar">
        <button className="room-back-link" onClick={() => navigate("/home")}>
          <span aria-hidden="true">←</span> All rooms
        </button>

        <div className="room-brand">
          <span className="room-brand-mark">A</span> IPL Auction
        </div>
      </header>

      <section className="room-hero" aria-labelledby="room-name">
        <div>
          <p className="room-eyebrow">Live auction lobby</p>

          <h1 id="room-name">{roomData.name}</h1>

          <div className="room-subline">
            <span className="room-id">ROOM · {roomData.roomId}</span>

            <span className="room-privacy">
              {roomData.isPrivate ? "Private room" : "Public room"}
            </span>
          </div>
        </div>

        <div
          className={`room-status room-status--${roomData.status ?? "waiting"}`}
        >
          <span className="room-status-dot" />
          {status}
        </div>
      </section>

      <section className="room-layout">
        <div className="room-main-column">
          <section
            className="room-panel room-panel--players"
            aria-labelledby="players-heading"
          >
            <div className="room-panel-heading">
              <div>
                <p className="room-panel-kicker">Lobby</p>

                <h2 id="players-heading">Players</h2>
              </div>

              <span className="room-player-count">
                {players.length} <span>/ {roomData.maxPlayers}</span>
              </span>
            </div>

            <div
              className="room-capacity"
              aria-label={`${players.length} of ${roomData.maxPlayers} player spaces filled`}
            >
              <span
                style={{
                  width: `${Math.min(
                    (players.length / roomData.maxPlayers) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>

            <div className="room-player-list">
              {players.map((player) => (
                <article className="room-player" key={player.userId}>
                  <span className="room-player-avatar" aria-hidden="true">
                    {player.username?.slice(0, 1).toUpperCase() ?? "P"}
                  </span>

                  <div>
                    <h3>{player.username}</h3>

                    <p>
                      {player.teamCode
                        ? `Team ${player.teamCode}`
                        : "Choosing a team"}
                    </p>
                  </div>

                  <span
                    className={`room-presence ${
                      player.connected === false ? "room-presence--away" : ""
                    }`}
                  >
                    {player.connected === false
                      ? "Away"
                      : player.userId === roomData.createdBy
                        ? "Host"
                        : "Online"}
                  </span>
                </article>
              ))}

              {Array.from({ length: playersRemaining }).map((_, index) => (
                <div
                  className="room-player room-player--empty"
                  key={`space-${index}`}
                >
                  <span className="room-player-avatar" aria-hidden="true">
                    +
                  </span>

                  <p>Waiting for player</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="room-side-column">
          <section
            className="room-panel room-panel--details"
            aria-labelledby="details-heading"
          >
            <p className="room-panel-kicker">Match setup</p>

            <h2 id="details-heading">Room details</h2>

            <dl className="room-details-list">
              <div>
                <dt>Format</dt>
                <dd>{roomData.gameType ?? "Cricket"}</dd>
              </div>

              <div>
                <dt>Access</dt>
                <dd>
                  {roomData.isPrivate
                    ? "Password protected"
                    : "Open to everyone"}
                </dd>
              </div>

              <div>
                <dt>Seats left</dt>
                <dd>{playersRemaining}</dd>
              </div>
            </dl>
          </section>

          <section className="room-next-step">
            <span className="room-next-step-icon" aria-hidden="true">
              ↗
            </span>

            <div>
              <h2>Get ready to bid</h2>

              <p>Once the lobby is full, the host will begin team selection.</p>

              {isHost && (
                <>
                  {startTeamSelectionError && (
                    <p className="room-start-error" role="alert">
                      {startTeamSelectionError}
                    </p>
                  )}
                  <button
                    type="button"
                    className="room-start-button"
                    onClick={handleStartTeamSelection}
                    disabled={!isRoomFull || startingTeamSelection}
                  >
                    {startingTeamSelection
                      ? "Starting…"
                      : isRoomFull
                        ? "Start Team Selection"
                        : `Waiting for players (${players.length}/${roomData.maxPlayers})`}
                  </button>
                </>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default RoomPage;
