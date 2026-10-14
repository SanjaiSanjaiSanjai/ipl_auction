import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import Login from "./pages/Login";
import CreateRoom from "./pages/CreateRoom";
import PublicRoutes from "./components/routes/PublicRoute";
import RoomPage from "./pages/RoomPage";
import TeamSelectionPage from "./pages/TeamSelectionPage";
import CreateTeam from "./pages/CreateTeam";
import AdminRoute from "./components/routes/AdminRoute";
import AuctionPage from "./pages/AuctionPage";
import AuctionBidPage from "./pages/AuctionBidPage";
import CreateAuctionPlayer from "./pages/CreateAuctionPlayer";
import JoinRoom from "./pages/JoinRoom";
import OtpVerification from "./pages/OtpVerification";

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicRoutes><Signup /></PublicRoutes>} />
        <Route path="/login" element={<PublicRoutes><Login /></PublicRoutes>} />
        <Route path="/otp-verification" element={<PublicRoutes><OtpVerification /></PublicRoutes>} />
        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/create-room" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
        <Route path="/create-team" element={<ProtectedRoute><AdminRoute><CreateTeam /></AdminRoute></ProtectedRoute>} />
        <Route path="/create-auction-player" element={<ProtectedRoute><AdminRoute><CreateAuctionPlayer /></AdminRoute></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
        <Route path="/rooms/:roomId/team" element={<ProtectedRoute><TeamSelectionPage /></ProtectedRoute>} />
        <Route path="/rooms/:roomId/auction" element={<ProtectedRoute><AuctionPage /></ProtectedRoute>} />
        <Route path="/rooms/:roomId/auction/bid" element={<ProtectedRoute><AuctionBidPage /></ProtectedRoute>} />
        <Route path="/join-room" element={<ProtectedRoute><JoinRoom/></ProtectedRoute>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App
