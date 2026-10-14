import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../axios/apiclient";
import Sidebar from "../components/sidebar/Sidebar";
import "../styles/CreateAuctionPlayer.css";

const CREATE_AUCTION_PLAYER_API_URL = import.meta.env.VITE_API_CREATE_AUCTION_PLAYER;

function CreateAuctionPlayer() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        playerCode: "",
        name: "",
        role: "batter",
        nationality: "India",
        basePrice: "",
    });
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((currentForm) => ({
            ...currentForm,
            [name]: name === "playerCode" ? value.toUpperCase() : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            if (!CREATE_AUCTION_PLAYER_API_URL) {
                throw new Error("Create auction player API URL is not configured.");
            }

            await axiosClient.post(CREATE_AUCTION_PLAYER_API_URL, {
                ...form,
                playerCode: form.playerCode.trim(),
                name: form.name.trim(),
                nationality: form.nationality.trim(),
                basePrice: Number(form.basePrice),
            });
            navigate("/home", { replace: true });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                error.message ||
                "Failed to create auction player.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-auction-player-page">
            <Sidebar />
            <main className="create-auction-player-content">
                <section className="create-auction-player-layout" aria-labelledby="create-auction-player-title">
                    <div className="create-auction-player-intro">
                        <p className="create-auction-player-eyebrow">Auction player management</p>
                        <h1 id="create-auction-player-title">Create auction player</h1>
                        <p>Add a player to the pool available when an auction begins.</p>
                    </div>

                    <form className="create-auction-player-form" onSubmit={handleSubmit}>
                        <div>
                            <h2>Player details</h2>
                            <p>All fields are required.</p>
                        </div>

                        <label htmlFor="player-code">Player code
                            <input id="player-code" name="playerCode" value={form.playerCode} onChange={handleChange} placeholder="e.g. PLAYER-001" maxLength={50} required />
                        </label>
                        <label htmlFor="player-name">Player name
                            <input id="player-name" name="name" value={form.name} onChange={handleChange} placeholder="Enter player name" minLength={2} maxLength={100} required />
                        </label>
                        <div className="create-auction-player-form-row">
                            <label htmlFor="player-role">Role
                                <select id="player-role" name="role" value={form.role} onChange={handleChange}>
                                    <option value="batter">Batter</option>
                                    <option value="bowler">Bowler</option>
                                    <option value="allrounder">All-rounder</option>
                                    <option value="wicketkeeper">Wicketkeeper</option>
                                </select>
                            </label>
                            <label htmlFor="base-price">Base price
                                <input id="base-price" name="basePrice" value={form.basePrice} onChange={handleChange} type="number" min="1" step="1" placeholder="e.g. 50" required />
                            </label>
                        </div>
                        <label htmlFor="nationality">Nationality
                            <input id="nationality" name="nationality" value={form.nationality} onChange={handleChange} placeholder="e.g. India" maxLength={50} required />
                        </label>

                        {errorMessage && <p className="create-auction-player-error" role="alert">{errorMessage}</p>}
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating…" : "Create Auction Player"}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CreateAuctionPlayer;
