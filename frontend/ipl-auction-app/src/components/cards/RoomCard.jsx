import "./RoomCard.css";

/**
 * RoomCard component — displays a single public room's details as a styled card.
 *
 * Props:
 *   @param {object} room - A single room object from the public rooms API response.
 *     Fields used: roomId, name, gameType, status, isPrivate, maxPlayers, players, createdAt
 *
 *   @param {function} onJoin - Function provided by Home.jsx.
 *     This function performs the actual HTTP JOIN ROOM API request.
 *
 *   @param {boolean} loading - Tells this card whether it is currently
 *     being joined.
 */
function RoomCard({ room, onJoin, loading }) {

    // Calculate how many players have joined out of max allowed
    const joinedCount = room.players?.length ?? 0;
   


    // Format the room creation date to a human-readable string
    const formattedDate = room.createdAt
        ? new Date(room.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "N/A";


    // Map room status to a display-friendly label and badge colour class
    const statusConfig = {
        waiting: {
            label: "Waiting",
            badgeClass: "badge--waiting",
        },

        team_selection: {
            label: "Team Selection",
            badgeClass: "badge--team-selection",
        },

        playing: {
            label: "Playing",
            badgeClass: "badge--playing",
        },

        finished: {
            label: "Finished",
            badgeClass: "badge--finished",
        },
    };


    const {
        label: statusLabel,
        badgeClass,
    } = statusConfig[room.status] ?? {
        label: room.status,
        badgeClass: "badge--default",
    };
 console.log("status: ", typeof statusLabel);

    return (
        statusLabel === "Waiting" && (
            <div className="room-card">

                {/* Top row: room name and status badge */}
                <div className="room-card__header">

                    <h3 className="room-card__name">
                        {room.name}
                    </h3>

                    <span
                        className={`room-card__badge ${badgeClass}`}
                    >
                        {statusLabel}
                    </span>

                </div>


                {/* Room ID */}
                <p className="room-card__id">

                    <span className="room-card__label">
                        Room ID:
                    </span>

                    {" "}

                    {room.roomId}

                </p>


                {/* Game type e.g. T20, ODI */}
                <p className="room-card__meta">

                    <span className="room-card__label">
                        Game Type:
                    </span>

                    {" "}

                    {room.gameType ?? "—"}

                </p>


                {/* Player count vs max players */}
                <p className="room-card__meta">

                    <span className="room-card__label">
                        Players:
                    </span>

                    {" "}

                    {joinedCount} / {room.maxPlayers}

                </p>


                {/* Created date */}
                <p className="room-card__meta">

                    <span className="room-card__label">
                        Created:
                    </span>

                    {" "}

                    {formattedDate}

                </p>


                {/* Private / Public label */}
                <div className="room-card__footer">

                    <span
                        className={`room-card__privacy ${
                            room.isPrivate
                                ? "privacy--private"
                                : "privacy--public"
                        }`}
                    >
                        {room.isPrivate
                            ? "🔒 Private"
                            : "🌐 Public"}
                    </span>


                    {/* =================================================
                        JOIN ROOM BUTTON
                        =================================================

                        IMPORTANT:

                        RoomCard does NOT make the API request.

                        It calls the onJoin() function received from
                        Home.jsx.

                        Home.jsx is responsible for:

                        1. POST /rooms/join
                        2. Backend validation
                        3. Navigate to RoomPage

                        Example:

                        onJoin(room)

                        becomes:

                        Home.jsx
                            ↓
                        handleJoinRoom(room)
                            ↓
                        POST /rooms/join
                            ↓
                        navigate("/room/55CCAD")
                    */}
                    <button
                        className="room-card__join-btn"

                        // Call Home.jsx's join handler
                        onClick={() => onJoin(room)}

                        // Prevent multiple clicks while this room
                        // is currently being joined.
                        disabled={loading}
                    >

                        {/* Change button text while API request
                            is running */}
                        {loading
                            ? "Joining..."
                            : "Join Room"}

                    </button>

                </div>

            </div>
        )
    );
}

export default RoomCard;
