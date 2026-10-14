import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../axios/apiclient";
import socket from "../socket/socket";
import { getLocalStorage } from "../service/storage/localstorage";
import AuctionPlayersSidebar from "../components/auction/AuctionPlayersSidebar";
import "../styles/AuctionPage.css";

const GET_ROOM_API_URL = import.meta.env.VITE_API_GET_ROOM;
const GET_AUCTION_PLAYERS_API_URL =
    import.meta.env.VITE_API_GET_AUCTION_PLAYERS || "/v1/api/auction-players";
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

function AuctionPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [roomData, setRoomData] = useState(null);
    const [auctionPlayers, setAuctionPlayers] = useState([]);
    const [loadingRoom, setLoadingRoom] = useState(Boolean(GET_ROOM_API_URL));
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");
    const [playersError, setPlayersError] = useState("");

    useEffect(() => {
        if (!roomId || !GET_ROOM_API_URL) {
            return undefined;
        }

        let active = true;
        const fetchRoom = async () => {
            try {
                const response = await axiosClient.get(`${GET_ROOM_API_URL}/${roomId}`);
                if (active) setRoomData(response.data.data);
            } catch (fetchError) {
                if (active) {
                    setError(fetchError.response?.data?.message || "Failed to load room details.");
                }
            } finally {
                if (active) setLoadingRoom(false);
            }
        };

        fetchRoom();
        return () => {
            active = false;
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return undefined;

        const handleRoomUpdate = ({ roomId: updatedRoomId, state }) => {
            if (updatedRoomId?.toUpperCase() === roomId.toUpperCase() && state) {
                setRoomData(state);
            }
        };
        const handleAuctionStarted = ({ roomId: startedRoomId }) => {
            if (startedRoomId?.toUpperCase() === roomId.toUpperCase()) {
                navigate(`/rooms/${startedRoomId}/auction/bid`);
            }
        };
        const handleStartRejected = ({ message }) => {
            setError(message || "The auction could not be started.");
            setStarting(false);
        };

        socket.on("ROOM_UPDATED", handleRoomUpdate);
        socket.on("AUCTION_PLAYING_STARTED", handleAuctionStarted);
        socket.on("AUCTION_START_REJECTED", handleStartRejected);
        socket.emit("ROOM_JOIN", { roomId });

        return () => {
            socket.off("ROOM_UPDATED", handleRoomUpdate);
            socket.off("AUCTION_PLAYING_STARTED", handleAuctionStarted);
            socket.off("AUCTION_START_REJECTED", handleStartRejected);
            socket.emit("ROOM_LEAVE", { roomId });
        };
    }, [roomId, navigate]);

    const handleLoadAuctionPlayers = async () => {
        setLoadingPlayers(true);
        setPlayersError("");
        try {
            const response = await axiosClient.get(GET_AUCTION_PLAYERS_API_URL);
            if (!Array.isArray(response.data)) {
                throw new Error("The auction players response was not a list.");
            }
            setAuctionPlayers(response.data);
        } catch (fetchError) {
            setPlayersError(
                fetchError.response?.data?.message ||
                fetchError.message ||
                "Failed to load auction players.",
            );
        } finally {
            setLoadingPlayers(false);
        }
    };

    const currentUserId = getCurrentUserId();
    const isHost =
        currentUserId !== null &&
        String(roomData?.createdBy) === currentUserId;
    const players = roomData?.players ?? [];
    const allPlayersPresent =
        players.length > 0 &&
        players.length === roomData?.maxPlayers &&
        players.every((player) => player.connected !== false);
    const allTeamsSelected =
        players.length > 0 && players.every((player) => Boolean(player.teamCode));
    const canStartPlaying = allPlayersPresent && allTeamsSelected;

    const handleStartPlaying = () => {
        if (!isHost || !canStartPlaying || starting) return;
        setError("");
        setStarting(true);
        socket.emit("AUCTION_START_PLAYING", { roomId, userId: currentUserId });
    };

    if (loadingRoom && GET_ROOM_API_URL) {
        return (
            <main className="auction-page auction-page--state">
                <p role="status">Loading room…</p>
            </main>
        );
    }

    if (!roomData) {
        return (
            <main className="auction-page auction-page--state">
                <p role="alert">{error || "Room details are not available."}</p>
            </main>
        );
    }

    return (
        <main className="auction-page">
            <div className="auction-page-layout">
                <AuctionPlayersSidebar
                    auctionPlayers={auctionPlayers}
                    loadingPlayers={loadingPlayers}
                    playersError={playersError}
                    onLoadAuctionPlayers={handleLoadAuctionPlayers}
                />

                <section className="auction-page-card" aria-labelledby="auction-page-title">
                    <p className="auction-page-kicker">Room · {roomId}</p>
                    <h1 id="auction-page-title">Auction is ready</h1>
                    <p>
                        {!allPlayersPresent
                            ? `Waiting for all members to be present (${players.length}/${roomData.maxPlayers}).`
                            : !allTeamsSelected
                                ? "Waiting for every member to select a team."
                                : "All members are present and have selected teams. The host can start playing."}
                    </p>
                    {error && <p className="auction-page-error" role="alert">{error}</p>}
                    {isHost && (
                        <button
                            type="button"
                            className="auction-start-playing-button"
                            onClick={handleStartPlaying}
                            disabled={!canStartPlaying || starting}
                        >
                            {starting ? "Starting…" : "Start Playing"}
                        </button>
                    )}
                </section>

            </div>
        </main>
    );
}

export default AuctionPage;
