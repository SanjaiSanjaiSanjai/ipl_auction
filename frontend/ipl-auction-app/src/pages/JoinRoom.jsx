import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import axiosClient from "../axios/apiclient";
import "../styles/JoinRoom.css";

const JOIN_ROOM_API_URL = import.meta.env.VITE_API_JOIN_ROOM;

const getErrorMessage = (error) => {
    if (error.response) {
        const apiError = error.response.data?.error;
        return (
            (typeof apiError === "string" ? apiError : apiError?.message) ||
            error.response.data?.message ||
            "Could not join this room. Check the room ID and password."
        );
    }
    if (error.request) {
        return "No response from the server. Check your connection and try again.";
    }
    return error.message || "An unexpected error occurred.";
};

const JoinRoom = () => {
    const navigate = useNavigate();
    const [joinRoomData, setJoinRoomData] = useState({ roomId: "", password: "" });
    const [isJoining, setIsJoining] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (!JOIN_ROOM_API_URL) {
            setErrorMessage("Room joining is not configured. Please contact the administrator.");
            return;
        }

        const roomId = joinRoomData.roomId.trim().toUpperCase();
        if (roomId.length !== 6) {
            setErrorMessage("Enter the 6-character room code shared by the host.");
            return;
        }

        setIsJoining(true);
        try {
            await axiosClient.post(JOIN_ROOM_API_URL, {
                roomId,
                ...(joinRoomData.password ? { password: joinRoomData.password } : {}),
            });
            navigate(`/room/${roomId}`);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsJoining(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setJoinRoomData((previous) => ({
            ...previous,
            [name]: name === "roomId" ? value.toUpperCase().replace(/\s/g, "") : value,
        }));
        if (errorMessage) setErrorMessage("");
    };

    return (
        <div className="home-wrapper join-room-layout">
            <Sidebar />
            <main className="join-room-content">
                <div className="join-room-shell">
                    <header className="join-room-heading">
                        <span className="join-room-kicker">
                            <span className="join-room-kicker-mark" aria-hidden="true">+</span>
                            ROOM ACCESS
                        </span>
                        <h1>Join the auction</h1>
                        <p>Enter the room code from your host and get ready to build your squad.</p>
                    </header>

                    <div className="join-room-grid">
                        <form className="join-room-card" onSubmit={handleSubmit}>
                            <div className="join-room-card-heading">
                                <span className="join-room-step">01</span>
                                <div>
                                    <h2>Room details</h2>
                                    <p>Your host can share these with you.</p>
                                </div>
                            </div>

                            <div className="join-room-field">
                                <label htmlFor="join-room-id">Room code</label>
                                <input
                                    id="join-room-id"
                                    autoComplete="off"
                                    autoCapitalize="characters"
                                    className="join-room-code-input"
                                    name="roomId"
                                    type="text"
                                    value={joinRoomData.roomId}
                                    onChange={handleChange}
                                    placeholder="e.g. A1B2C3"
                                    maxLength={6}
                                    minLength={6}
                                    pattern="[A-Fa-f0-9]{6}"
                                    title="Enter the 6-character room code"
                                    aria-describedby="join-room-code-help"
                                    required
                                />
                                <span id="join-room-code-help">
                                    The 6-character code is shown in the room lobby.
                                </span>
                            </div>

                            <div className="join-room-field">
                                <label htmlFor="join-room-password">
                                    Password <span>(private rooms only)</span>
                                </label>
                                <input
                                    id="join-room-password"
                                    autoComplete="current-password"
                                    name="password"
                                    type="password"
                                    value={joinRoomData.password}
                                    onChange={handleChange}
                                    placeholder="Enter the room password"
                                />
                            </div>

                            {errorMessage && (
                                <p className="join-room-error" role="alert">{errorMessage}</p>
                            )}

                            <button
                                className="join-room-submit"
                                type="submit"
                                disabled={isJoining}
                            >
                                {isJoining ? "Joining room…" : "Join room"}
                                {!isJoining && <span aria-hidden="true">→</span>}
                            </button>
                            <p className="join-room-secure-note">
                                You’ll only enter after the room details are verified.
                            </p>
                        </form>

                        <aside className="join-room-aside">
                            <div className="join-room-aside-mark" aria-hidden="true">IPL</div>
                            <p className="join-room-aside-label">YOUR NEXT INNINGS</p>
                            <h2>One room.<br />One winning squad.</h2>
                            <p className="join-room-aside-copy">
                                Join your friends, pick a franchise, and compete for the best auction haul.
                            </p>
                            <div className="join-room-aside-rule" />
                            <div className="join-room-aside-footer">
                                <span className="join-room-live-dot" />
                                <span>Ready when your room is</span>
                            </div>
                            <span className="join-room-decor-ball" aria-hidden="true" />
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JoinRoom;
