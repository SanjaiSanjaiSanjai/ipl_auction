import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar/Sidebar";
import axiosClient from "../axios/apiclient";
import "../styles/CreateTeam.css";

const API_CREATE_TEAMS_URL = import.meta.env.VITE_API_CREATE_TEAM;

function CreateTeam() {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [color, setColor] = useState("#3b82f6");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setIsSubmitting(true);

        try {
            if (!API_CREATE_TEAMS_URL || API_CREATE_TEAMS_URL == undefined) {
                throw new Error("create team api undefined check .env variable properly");
            }
            const new_team_response = await axiosClient.post(API_CREATE_TEAMS_URL, {
                name: name.trim(),
                code: code.trim().toUpperCase(),
                color,
            });
            console.log("Successfully create a new team: ",new_team_response.data.data)
            navigate("/home", { replace: true });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.error?.message ||
                error.response?.data?.message ||
                "Failed to create team. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="home-wrapper">
            <Sidebar />
            <main className="create-team-content">
                <section className="create-team-layout" aria-labelledby="create-team-title">
                    <div className="create-team-intro">
                        <div>
                            <span className="create-team-eyebrow">Team management</span>
                            <h1 id="create-team-title">Create a new team</h1>
                            <p>Add a team to make it available for the next IPL auction room.</p>
                        </div>
                        <div className="team-preview" aria-label="Team badge preview">
                            <span className="team-preview-mark" style={{ backgroundColor: color }}>
                                {code.trim().slice(0, 3) || "IPL"}
                            </span>
                            <div>
                                <span className="team-preview-label">Badge preview</span>
                                <strong>{name.trim() || "Your team name"}</strong>
                            </div>
                        </div>
                    </div>
                    <form className="signup-form create-team-form" onSubmit={handleSubmit}>
                        <div>
                            <h2 className="create-team-form-heading">Team details</h2>
                            <p className="create-team-form-description">Choose a name, a short code, and its team color.</p>
                        </div>
                    <div>
                        <label className="signup-label" htmlFor="team-name">Team Name</label>
                        <input id="team-name" className="signup-input" value={name}
                            onChange={(event) => setName(event.target.value)} placeholder="Enter team name"
                            minLength={2} maxLength={100} required />
                    </div>
                    <div>
                        <label className="signup-label" htmlFor="team-code">Team Code</label>
                        <input id="team-code" className="signup-input" value={code}
                            onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="e.g. CSK"
                            minLength={2} maxLength={10} required />
                    </div>
                    <div>
                        <label className="signup-label" htmlFor="team-color">Team Color</label>
                        <div className="team-color-control">
                            <input id="team-color" className="team-color-input" type="color" value={color}
                                onChange={(event) => setColor(event.target.value)} />
                            <span className="team-color-value">{color}</span>
                        </div>
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button type="submit" className="signup-button create-team-submit" disabled={isSubmitting}>
                        {isSubmitting ? "Creating…" : "Create Team"}
                    </button>
                    </form>
                </section>
            </main>
        </div>
    );
}

export default CreateTeam;
