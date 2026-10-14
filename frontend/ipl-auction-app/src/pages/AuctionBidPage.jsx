import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../axios/apiclient";
import socket from "../socket/socket";
import { getLocalStorage } from "../service/storage/localstorage";
import "../styles/AuctionBidPage.css";

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

function AuctionBidPage() {
    const { roomId } = useParams();
    const [auctionState, setAuctionState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [placingBid, setPlacingBid] = useState(false);
    const [error, setError] = useState("");
    const [currentTime, setCurrentTime] = useState(null);
    const currentUserId = getCurrentUserId();

    useEffect(() => {
        let active = true;
        const fetchAuction = async () => {
            try {
                const response = await axiosClient.get(`/v1/api/rooms/${roomId}/auction`);
                if (active) {
                    setAuctionState(response.data);
                    setError("");
                }
            } catch (fetchError) {
                if (active) {
                    setError(fetchError.response?.data?.message || "Failed to load the auction.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchAuction();
        return () => {
            active = false;
        };
    }, [roomId]);

    useEffect(() => {
        if (!roomId) return undefined;

        const handleAuctionUpdate = ({ roomId: updatedRoomId, state }) => {
            if (updatedRoomId?.toUpperCase() === roomId.toUpperCase() && state) {
                setAuctionState(state);
            }
        };
        socket.on("AUCTION_UPDATED", handleAuctionUpdate);
        socket.emit("ROOM_JOIN", { roomId });

        return () => {
            socket.off("AUCTION_UPDATED", handleAuctionUpdate);
            socket.emit("ROOM_LEAVE", { roomId });
        };
    }, [roomId]);

    useEffect(() => {
        const updateTime = () => setCurrentTime(Date.now());
        const initialUpdate = window.setTimeout(updateTime, 0);
        const timer = window.setInterval(updateTime, 250);
        return () => {
            window.clearTimeout(initialUpdate);
            window.clearInterval(timer);
        };
    }, []);

    const team = Object.values(auctionState?.teams ?? {}).find(
        (candidate) => candidate.userId === currentUserId,
    );
    const lot = auctionState?.currentLot;

    const handlePlaceBid = async () => {
        setPlacingBid(true);
        setError("");
        try {
            const response = await axiosClient.post(
                `/v1/api/rooms/${roomId}/auction/bid`,
                { playerId: lot.playerId },
            );
            setAuctionState(response.data);
        } catch (bidError) {
            setError(bidError.response?.data?.message || "Your bid could not be placed.");
        } finally {
            setPlacingBid(false);
        }
    };

    return (
        <main className="auction-bid-page">
            <header className="auction-bid-header">
                <p className="auction-page-kicker">Room · {roomId}</p>
                <h1>Live auction</h1>
                <p>Place a bid for the current player on behalf of your team.</p>
            </header>

            {loading ? (
                <p className="auction-bid-state" role="status">Loading auction…</p>
            ) : lot ? (
                <section className="auction-lot-card" aria-labelledby="auction-lot-name">
                    <p className="auction-page-kicker">Player {auctionState.lotIndex}</p>
                    <h2 id="auction-lot-name">{lot.playerName}</h2>
                    <p className="auction-lot-meta">{lot.role} · {lot.nationality}</p>
                    <p className="auction-lot-timer" role="timer" aria-live="off">
                        {currentTime === null
                            ? "30 seconds remaining"
                            : `${Math.max(0, Math.ceil((lot.lotEndsAt - currentTime) / 1000))} seconds remaining`}
                    </p>
                    <dl className="auction-lot-details">
                        <div><dt>Base price</dt><dd>{lot.basePrice}</dd></div>
                        <div><dt>Current bid</dt><dd>{lot.currentBid}</dd></div>
                        <div><dt>Highest bidder</dt><dd>{lot.highestBidderTeamCode || "No bids yet"}</dd></div>
                    </dl>
                    {team && (
                        <p className="auction-team-summary">
                            Your team: <strong>{team.teamCode}</strong> · Purse remaining: {team.purseRemaining}
                        </p>
                    )}
                    <button
                        type="button"
                        className="auction-place-bid-button"
                        onClick={handlePlaceBid}
                        disabled={
                            !team ||
                            placingBid ||
                            auctionState.status !== "running" ||
                            (currentTime !== null && lot.lotEndsAt <= currentTime)
                        }
                    >
                        {placingBid ? "Placing bid…" : "Place bid"}
                    </button>
                </section>
            ) : (
                <p className="auction-bid-state">
                    {auctionState?.status === "complete"
                        ? "The auction is complete."
                        : "There is no active player to bid on."}
                </p>
            )}
            {error && <p className="auction-bid-error" role="alert">{error}</p>}

            <section className="auction-history" aria-label="Room auction results">
                <div className="auction-history-column">
                    <h2>Sold players ({auctionState?.sold?.length ?? 0})</h2>
                    {auctionState?.sold?.length ? (
                        <ul>
                            {auctionState.sold.map((player) => (
                                <li key={player.playerId}>
                                    <strong>{player.playerName}</strong>
                                    <span>{player.teamCode} · {player.soldPrice}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p>No players sold yet.</p>}
                </div>
                <div className="auction-history-column">
                    <h2>Unsold players ({auctionState?.unsold?.length ?? 0})</h2>
                    {auctionState?.unsold?.length ? (
                        <ul>
                            {auctionState.unsold.map((playerId) => {
                                const player = auctionState.playerPool?.find(
                                    (candidate) => candidate.playerId === playerId,
                                );
                                return (
                                    <li key={playerId}>
                                        <strong>{player?.playerName || playerId}</strong>
                                        <span>{player?.role || "Player"} · No bids</span>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : <p>No unsold players.</p>}
                </div>
            </section>
        </main>
    );
}

export default AuctionBidPage;
