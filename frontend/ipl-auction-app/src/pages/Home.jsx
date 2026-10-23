import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import RoomCard from "../components/cards/RoomCard";
import axiosClient from "../axios/apiclient";
import "../styles/Home.css";
import socket, { connectSocket } from "../socket/socket";
import { useNavigate } from "react-router-dom";

// Public rooms API endpoint
const API_PUBLIC_ROOMS_URL = import.meta.env.VITE_API_PUBLIC_ROOMS;

// Join room API endpoint
const API_JOIN_ROOM_URL = import.meta.env.VITE_API_JOIN_ROOM;

function Home() {
  // Stores public rooms
  const [rooms, setRooms] = useState([]);

  // Public rooms loading state
  const [loading, setLoading] = useState(false);

  // User-facing error message
  const [error, setError] = useState("");

  // Navigation
  const navigate = useNavigate();

  // Tracks which room is being joined
  const [joiningRoomId, setJoiningRoomId] = useState(null);

  // ============================================================
  // JOIN ROOM
  // ============================================================
  const handleJoinRoom = async (room) => {
    try {
      setError("");
      setJoiningRoomId(room.roomId);

      if (!API_JOIN_ROOM_URL) {
        setError(
          "Error: VITE_API_JOIN_ROOM is not configured in .env"
        );

        console.error(
          "VITE_API_JOIN_ROOM is undefined. Check your .env file."
        );

        return;
      }

      console.log("Joining room:", room.roomId);

      // Request the backend to join the selected room
      const response = await axiosClient.post(API_JOIN_ROOM_URL, {
        roomId: room.roomId,
      });

      console.log("Join room response:", response.data);

      // Navigate only after a successful join request
      // RoomPage will handle joining the Socket.IO room
      navigate(`/room/${room.roomId}`);
    } catch (err) {
      if (err.response) {
        console.error(
          "Join API error:",
          err.response.status,
          err.response.data
        );

        setError(
          err.response.data?.error?.message ||
            err.response.data?.error ||
            "Failed to join room."
        );
      } else if (err.request) {
        console.error(
          "No response from join room server:",
          err.request
        );

        setError("No response from server. Check your connection.");
      } else {
        console.error("Join room unexpected error:", err.message);

        setError("An unexpected error occurred.");
      }
    } finally {
      setJoiningRoomId(null);
    }
  };

  // ============================================================
  // HOME PAGE: SOCKET CONNECTION + PUBLIC ROOMS
  // ============================================================
  useEffect(() => {
    // ----------------------------------------------------------
    // 1. CONNECT SOCKET.IO WHEN HOME MOUNTS
    // ----------------------------------------------------------
    //
    // socket.js should use autoConnect: false.
    // The socket auth callback will read the saved access token
    // when the connection is initiated.
    //
    connectSocket();

    // ----------------------------------------------------------
    // 2. FETCH PUBLIC ROOMS
    // ----------------------------------------------------------
    const fetchPublicRooms = async () => {
      if (!API_PUBLIC_ROOMS_URL) {
        setError(
          "Error: VITE_API_PUBLIC_ROOMS is not configured in .env"
        );

        console.error(
          "VITE_API_PUBLIC_ROOMS is undefined. Check your .env file."
        );

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await axiosClient.get(API_PUBLIC_ROOMS_URL);

        console.log("Public rooms fetched:", response.data);

        setRooms((currentRooms) => {
          const fetchedRoomIds = new Set(
            response.data.map((room) => room.roomId)
          );

          return [
            ...response.data,
            ...currentRooms.filter(
              (room) => !fetchedRoomIds.has(room.roomId)
            ),
          ];
        });
      } catch (err) {
        if (err.response) {
          console.error(
            "HTTP error:",
            err.response.status,
            err.response.data
          );

          setError(
            err.response.data?.error ||
              "Failed to fetch rooms. Please try again."
          );
        } else if (err.request) {
          console.error("No response from server:", err.request);

          setError("No response from server. Check your connection.");
        } else {
          console.error("Error:", err.message);

          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    // ----------------------------------------------------------
    // 3. LISTEN FOR NEWLY CREATED PUBLIC ROOMS
    // ----------------------------------------------------------
    const handleRoomCreated = (newRoom) => {
      console.log("🔥 ROOM CREATED RECEIVED");
      console.log("Room received:", newRoom);

      setRooms((prevRooms) => {
        const existingRoomIndex = prevRooms.findIndex(
          (room) => room.roomId === newRoom.roomId
        );

        if (existingRoomIndex === -1) {
          return [newRoom, ...prevRooms];
        }

        return prevRooms.map((room, index) =>
          index === existingRoomIndex ? newRoom : room
        );
      });
    };

    // Register the event listener
    socket.on("room:created", handleRoomCreated);

    // Fetch public rooms once when Home mounts
    fetchPublicRooms();

    // ----------------------------------------------------------
    // 4. CLEAN UP THE EVENT LISTENER
    // ----------------------------------------------------------
    //
    // Do not disconnect the socket here.
    // The same socket can be used by RoomPage and auction pages.
    //
    return () => {
      socket.off("room:created", handleRoomCreated);
    };
  }, []);

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="home-wrapper">
      <Sidebar />

      <main className="home-content">
        <h1 className="home-title">Public Rooms</h1>

        {loading && (
          <p className="home-loading">
            Loading public rooms…
          </p>
        )}

        {error && (
          <p className="home-error">
            {error}
          </p>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <RoomCard
                key={room.roomId}
                room={room}
                onJoin={handleJoinRoom}
                loading={joiningRoomId === room.roomId}
              />
            ))}
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <p className="home-empty">
            No public rooms available. Create one to get started!
          </p>
        )}
      </main>
    </div>
  );
}

export default Home;
