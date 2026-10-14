import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../../styles/Sidebar.css";
import { getLocalStorage } from "../../service/storage/localstorage";

function Sidebar() {
    const navigate = useNavigate();
    const accessTokenKey = import.meta.env.VITE_ACCESS_TOKEN_KEY;
    const accessToken = accessTokenKey ? getLocalStorage(accessTokenKey) : null;
    let isAdmin = false;

    try {
        isAdmin = jwtDecode(accessToken)?.role === "admin";
    } catch {
        // ProtectedRoute handles users without a valid session.
    }

    const handleCreateRoom = () => {
        navigate("/create-room");
    };

    const handleCreateTeam = () => {
        navigate("/create-team");
    };

    const handleCreateAuctionPlayer = () => {
        navigate("/create-auction-player");
    };

    const handleJoinRoom = () => {
        navigate("/join-room");
    };

    return (
        <aside className="sidebar">
            <button className="create-room-button" onClick={handleCreateRoom}> + Create Room</button>
            {isAdmin && (
                <>
                    <button className="create-team-button" onClick={handleCreateTeam}>
                        + Create Team
                    </button>
                    <button className="create-auction-player-button" onClick={handleCreateAuctionPlayer}>
                        + Create Auction Player
                    </button>
                    
                </>
            )}
            <button className="join-room-button" onClick={handleJoinRoom}>
                        Join Room
            </button>
        </aside>
    );
}

export default Sidebar;
