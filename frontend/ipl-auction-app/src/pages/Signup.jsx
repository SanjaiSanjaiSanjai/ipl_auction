import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    const [showPassword, setShowPassword] = useState(false);

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
        <main className="auth-page">
            <aside className="auth-brand-panel">
                <div className="auth-brand"><span className="auth-brand-mark">IPL</span> Auction Room</div>
                <div className="auth-brand-copy"><p>Live fantasy auction</p><h2>Set up your next auction in minutes.</h2></div>
                <p className="auth-brand-footer">A focused space for every room, team, and winning bid.</p>
            </aside>
            <section className="auth-content" aria-labelledby="signup-title">
                <div className="auth-card">
                    <h1 className="auth-heading" id="signup-title">Create your account</h1>
                    <p className="auth-subheading">Get started with your IPL auction workspace.</p>
                    <form className="signup-form" onSubmit={handleSubmit}>
                        <div className="auth-field"><label className="signup-label" htmlFor="name">Full name</label><input id="name" type="text" className="signup-input" value={username} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" autoComplete="name" required /></div>
                        <div className="auth-field"><label className="signup-label" htmlFor="email">Email address</label><input id="email" type="email" className="signup-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
                        <div className="auth-field"><label className="signup-label" htmlFor="password">Password</label><div className="password-control"><input id="password" type={showPassword ? "text" : "password"} className="signup-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" required /><button className="password-toggle" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "Hide" : "Show"}</button></div></div>
                        {errorMessage && <p className="error-message" role="alert">{errorMessage}</p>}
                        <button type="submit" className="signup-button" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</button>
                    </form>
                    <p className="auth-footer">Already have an account? <Link className="auth-link" to="/login">Sign in</Link></p>
                </div>
            </section>
        </main>
    );
}
