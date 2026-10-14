import { Navigate } from "react-router-dom";
import { getLocalStorage } from "../../service/storage/localstorage";

function PublicRoutes({ children }) {
    const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    if (!ACCESS_TOKEN_KEY || ACCESS_TOKEN_KEY === undefined) {
        console.error("ACCESS_TOKEN_KEY is undefined. Make sure VITE_ACCESS_TOKEN_KEY is set in .env file");
        return;
    }
    const accesstokenFromLocalStorage = getLocalStorage(ACCESS_TOKEN_KEY);
    if (accesstokenFromLocalStorage) {
        return <Navigate to={'/home'} />
    }
    return children;
}
export default PublicRoutes;