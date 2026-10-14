import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { getLocalStorage } from "../../service/storage/localstorage";

function AdminRoute({ children }) {
    const accessTokenKey = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    const accessToken = accessTokenKey ? getLocalStorage(accessTokenKey) : null;

    try {
        if (jwtDecode(accessToken)?.role === "admin") {
            return children;
        }
    } catch {
        // ProtectedRoute handles users without a valid session.
    }

    return <Navigate to="/home" replace />;
}

export default AdminRoute;
