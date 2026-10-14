import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";
import axiosClient from "../axios/apiclient";
import { setLocalstorage } from "../service/storage/localstorage";

export default function Login() {
    // Email input state
    const [email, setEmail] = useState("");
    // Password input state
    const [password, setPassword] = useState("");
    // Submission loading state
    const [isSubmitting, setIsSubmitting] = useState(false);
    // API error feedback
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const API_LOGIN_URL = import.meta.env.VITE_API_LOGIN_URL;
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        if (!API_LOGIN_URL) {
            setErrorMessage("Error: Login API endpoint not configured.");
            setIsSubmitting(false);
            console.error("VITE_API_LOGIN_URL is undefined.");
            return;
        }

        try {
            const response = await axiosClient.post(API_LOGIN_URL, {
                email: email.trim(),
                password,
            });
            const accessToken = response.data?.accessToken ?? response.data?.access_token;
            const verificationEmail = String(
                response.data?.user?.email || email,
            ).trim();
            if (!accessToken || !verificationEmail) {
                throw new Error("Login did not return the information needed for email verification.");
            }

            if (import.meta.env.VITE_ENV === "development") {
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
                    "Login failed. Please try again.",
                );
            } else if (err.request) {
                setErrorMessage("No response from server. Check your connection.");
            } else {
                setErrorMessage(err.message || "An unexpected error occurred.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-title">IPL Auction Login</h1>
            <form className="signup-form" onSubmit={handleSubmit}>
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
                    {isSubmitting ? "Submitting…" : "Login"}
                </button>
            </form>
        </div>
    );
}
