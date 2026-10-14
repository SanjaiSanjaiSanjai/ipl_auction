import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import axiosClient from "../axios/apiclient";
// import "../styles/Home.css";
import "../styles/CreateRoom.css";

const API_CREATE_ROOMS_URL = import.meta.env.VITE_API_CREATE_ROOMS;

// This app is cricket-only, so gameType is always sent as "cricket".
const DEFAULT_GAME_TYPE = "cricket";

function CreateRoom() {
    // Room display name. Updated when the name input changes.
    const [name, setName] = useState("");

    // Seat cap for the lobby (2–10). Updated when the maxPlayers input changes.
    const [maxPlayers, setMaxPlayers] = useState(2);

    // Whether the room needs a password. Updated when the isPrivate checkbox is toggled.
    const [isPrivate, setIsPrivate] = useState(false);

    // Private-room password. Updated when the password input changes; cleared when isPrivate is unchecked.
    const [password, setPassword] = useState("");

    // True while POST /rooms/create is in flight. Updated at submit start and in finally.
    const [isSubmitting, setIsSubmitting] = useState(false);

    // User-facing API or validation error. Updated on failed submit; cleared on a new submit.
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handlePrivateChange = (event) => {
        const checked = event.target.checked;
        setIsPrivate(checked);
        // Password is only relevant for private rooms.
        if (!checked) {
            setPassword("");
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (!API_CREATE_ROOMS_URL) {
            setErrorMessage("Error: VITE_API_CREATE_ROOMS is not configured in .env");
            console.error("VITE_API_CREATE_ROOMS is undefined. Check your .env file.");
            return;
        }

        if (isPrivate && !password.trim()) {
            setErrorMessage("Password is required for a private room.");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            name: name.trim(),
            gameType: DEFAULT_GAME_TYPE,
            isPrivate,
            maxPlayers: Number(maxPlayers),
        };

        if (isPrivate) {
            payload.password = password;
        }

        try {
            const response = await axiosClient.post(API_CREATE_ROOMS_URL, payload);
            console.log("Room created:", response.data);
            navigate(`/room/${response.data.data.roomId}`, { replace: true });
        } catch (err) {
            if (err.response) {
                console.error("HTTP error:", err.response.status, err.response.data);
                const apiError = err.response.data?.error;
                setErrorMessage(
                    (typeof apiError === "string" ? apiError : apiError?.message) ||
                    err.response.data?.message ||
                    "Failed to create room. Please try again.",
                );
            } else if (err.request) {
                console.error("No response from server:", err.request);
                setErrorMessage("No response from server. Check your connection.");
            } else {
                console.error("Error:", err.message);
                setErrorMessage("An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="home-wrapper">
            <Sidebar />

            <main className="create-room-content">
                <h1 className="home-title">Create Room</h1>

                <form className="signup-form create-room-form" onSubmit={handleSubmit}>
                    <div>
                        <label className="signup-label" htmlFor="room-name">Room Name</label>
                        <input
                            id="room-name"
                            name="name"
                            type="text"
                            className="signup-input"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Enter room name"
                            minLength={3}
                            maxLength={50}
                            required
                        />
                    </div>

                    <div>
                        <label className="signup-label" htmlFor="max-players">Max Players</label>
                        <input
                            id="max-players"
                            name="maxPlayers"
                            type="number"
                            className="signup-input"
                            value={maxPlayers}
                            onChange={(event) => setMaxPlayers(Number(event.target.value))}
                            min={2}
                            max={10}
                            required
                        />
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label" htmlFor="is-private">
                            <input
                                id="is-private"
                                name="isPrivate"
                                type="checkbox"
                                checked={isPrivate}
                                onChange={handlePrivateChange}
                            />
                            Private Room (Password Protected)
                        </label>
                    </div>

                    {isPrivate && (
                        <div>
                            <label className="signup-label" htmlFor="room-password">Room Password</label>
                            <input
                                id="room-password"
                                name="password"
                                type="password"
                                className="signup-input"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Set room password"
                                required
                            />
                        </div>
                    )}

                    {errorMessage && <p className="error-message">{errorMessage}</p>}

                    <button type="submit" className="signup-button" disabled={isSubmitting}>
                        {isSubmitting ? "Creating…" : "Create Room"}
                    </button>
                </form>
            </main>
        </div>
    );
}

export default CreateRoom;
