import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { getLocalStorage } from "../../service/storage/localstorage";
import { connectSocket } from "../../socket/socket";

function ProtectedRoute({ children }) {
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    const accesstokenFromLocalStorage = ACCESS_TOKEN_KEY
        ? getLocalStorage(ACCESS_TOKEN_KEY)
        : null;
    useEffect(() => {
        if (accesstokenFromLocalStorage) connectSocket();
    }, [accesstokenFromLocalStorage]);
    if (!ACCESS_TOKEN_KEY) {
        console.error("ACCESS_TOKEN_KEY is undefined. Make sure VITE_ACCESS_TOKEN_KEY is set in .env file");
        return null;
    }
    if (!accesstokenFromLocalStorage) return <Navigate to="/login" replace />;
    return children;
}
export default ProtectedRoute;
