import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";
import axiosClient from "../axios/apiclient";
import { setLocalstorage } from "../service/storage/localstorage";

export default function Signup() {
    // User's full name
    const [username, setUserName] = useState("");
    // User's email address
    const [email, setEmail] = useState("");
    // User's password
    const [password, setPassword] = useState("");
    // Loading state during submission
    const [isSubmitting, setIsSubmitting] = useState(false);
    // API error feedback
    const [errorMessage, setErrorMessage] = useState("");

    // Navigate to the next page
    const navigate = useNavigate();

    // API URL from environment variables
    const API_SIGNUP_URL = import.meta.env.VITE_API_SIGNUP_URL;
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");
        try {
            if (!API_SIGNUP_URL) {
                throw new Error("Signup API endpoint is not configured.");
            }
            const response = await axiosClient.post(API_SIGNUP_URL, {
                username,
                email: email.trim().toLowerCase(),
                password,
            });
            const accessToken = response.data?.accessToken;
            const verificationEmail = String(
                response.data?.user?.email || email,
            ).trim();
            if (!accessToken || !verificationEmail) {
                throw new Error("Signup did not return the information needed for email verification.");
            }

            if (import.meta.env.VITE_ENV) {
                if (!ACCESS_TOKEN_KEY || !setLocalstorage(ACCESS_TOKEN_KEY, accessToken)) {
                    throw new Error("Could not save the sign-in session.");
                }
                navigate("/home", { replace: true });
                return;
            }

            navigate("/otp-verification", {
                replace: true,
                state: { email: verificationEmail, accessToken },
            });
        } catch (err) {
            if (err.response) {
                const apiError = err.response.data?.error;
                setErrorMessage(
                    (typeof apiError === "string" ? apiError : apiError?.message) ||
                    err.response.data?.message ||
                    "Signup failed. Please try again.",
                );
            }
            else if (err.request) {
                setErrorMessage("No response received from server. Please check your connection and try again.");
            }
            else {
                setErrorMessage(err.message || "An error occurred. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-title">IPL Auction Signup</h1>
            <form className="signup-form" onSubmit={handleSubmit}>
                <label className="signup-label" htmlFor="username">Full Name</label>
                <input
                    id="name"
                    type="text"
                    className="signup-input"
                    value={username}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    required
                />
                <label className="signup-label" htmlFor="email">Email Address</label>
                <input
                    id="email"
                    type="email"
                    className="signup-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                />
                <label className="signup-label" htmlFor="password">Password</label>
                <input
                    id="password"
                    type="password"
                    className="signup-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                />
                {errorMessage && <p className="error-message">{errorMessage}</p>}
                <button type="submit" className="signup-button" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting…" : "Sign Up"}
                </button>
            </form>
        </div>
    );
}
