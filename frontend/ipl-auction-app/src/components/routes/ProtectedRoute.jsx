import { Navigate } from "react-router-dom";
import { getLocalStorage } from "../../service/storage/localstorage";

function ProtectedRoute({ children }) {
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    if (!ACCESS_TOKEN_KEY) {
        console.error("ACCESS_TOKEN_KEY is undefined. Make sure VITE_ACCESS_TOKEN_KEY is set in .env file");
        return null;
    }
    const accesstokenFromLocalStorage = getLocalStorage(ACCESS_TOKEN_KEY);
    if (!accesstokenFromLocalStorage) {
        return <Navigate to="/login" replace />;
    }
    return children;
}
export default ProtectedRoute;