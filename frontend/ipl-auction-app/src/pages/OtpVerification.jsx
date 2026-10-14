import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../axios/apiclient";
import { setLocalstorage } from "../service/storage/localstorage";
import "../styles/Signup.css";
import "../styles/OtpVerification.css";

const OTP_API_URL = import.meta.env.VITE_API_OTP_VERIFICATION_URL;
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

const getErrorMessage = (error) => {
    const responseData = error.response?.data;
    const apiError = responseData?.error;
    return (
        (typeof apiError === "string" ? apiError : apiError?.message) ||
        responseData?.message ||
        error.message ||
        "OTP verification failed. Please try again."
    );
};

const OtpVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const email = String(location.state?.email || "").trim();
    const accessToken = location.state?.accessToken;

    const [otp, setOtp] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    if (!email) {
        return <Navigate to="/login" replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!OTP_API_URL) {
            setErrorMessage("OTP verification is not configured. Please contact support.");
            return;
        }
        if (!ACCESS_TOKEN_KEY) {
            setErrorMessage("The sign-in session is not configured. Please contact support.");
            return;
        }
        if (!/^\d{6}$/.test(otp)) {
            setErrorMessage("Enter the 6-digit code sent to your email.");
            return;
        }
        if (!accessToken) {
            setErrorMessage("Your verification session has expired. Please sign in again.");
            return;
        }

        setIsVerifying(true);
        try {
          const otpString = String(otp)
            await axiosClient.post(OTP_API_URL, { otp: otpString, email });
            const stored = setLocalstorage(
                ACCESS_TOKEN_KEY,
                accessToken,
            );
            if (!stored) {
                throw new Error("Could not save your verified sign-in session. Please try again.");
            }

            setSuccessMessage("Email verified. Taking you to your account…");
            navigate("/home", { replace: true });
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <main className="otp-page">
            <div className="otp-card">
                <div className="otp-brand" aria-label="IPL Auction">
                    <span className="otp-brand-mark">IPL</span>
                    <span>Auction</span>
                </div>

                <div className="otp-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                        <rect x="4" y="7" width="16" height="12" rx="2" />
                        <path d="m5 8 7 5 7-5M8 4h8" />
                    </svg>
                </div>

                <p className="otp-kicker">SECURE ACCOUNT ACCESS</p>
                <h1>Verify your email</h1>
                <p className="otp-description">
                    We sent a one-time code to{" "}
                    <strong className="otp-email">{email}</strong>. Enter it below
                    to finish signing in.
                </p>

                <form className="otp-form" onSubmit={handleSubmit}>
                    <label htmlFor="verification-otp">6-digit verification code</label>
                    <input
                        id="verification-otp"
                        className="otp-input"
                        name="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={otp}
                        onChange={(event) => {
                            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                            setErrorMessage("");
                        }}
                        placeholder="000000"
                        aria-describedby={errorMessage ? "otp-error" : "otp-help"}
                        required
                    />
                    <span className="otp-help" id="otp-help">
                        The code expires after one minute.
                    </span>

                    {errorMessage && (
                        <p className="otp-error" id="otp-error" role="alert">
                            {errorMessage}
                        </p>
                    )}
                    {successMessage && (
                        <p className="otp-success" role="status">{successMessage}</p>
                    )}

                    <button
                        className="otp-submit"
                        type="submit"
                        disabled={isVerifying || otp.length !== 6}
                    >
                        {isVerifying ? "Verifying…" : "Verify email"}
                        {!isVerifying && <span aria-hidden="true">→</span>}
                    </button>
                </form>

                <p className="otp-back-link">
                    Wrong email? <Link to="/login">Back to login</Link>
                </p>
            </div>
            <p className="otp-footer">IPL AUCTION · PLAY FAIR. BID SMART.</p>
        </main>
    );
};

export default OtpVerification;
