import express from "express";
import dotenv from "dotenv";
dotenv.config();
import http from "http";
import { Server } from "socket.io"
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { connectDB } from "./config/database.ts";
import signuprouter from "./routes/signup.routes.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import loginRouter from "./routes/login.routes.ts";
import tokenRoutes from "./routes/token.routes.ts";
import teamRoutes from "./routes/team.routes.ts";
import roomRoutes from "./routes/room.routes.ts";
import otpVerificationRouter from "./routes/otp-verification.routes.ts";
import auctionDataRoutes from "./routes/auction-data.routes.ts";
import { RegisterRoomSocket } from "./socket/room.socket.ts";
import { connectRedis } from "./config/redis.ts";
import { mailTransporter } from "./config/mail.config.ts";
import { setSocketServerInstance } from "./socket/socket.ts";
import { startAuctionExpiryWorker } from "./service/auction.service.ts";
import { verifyToken } from "./utils/jwt.ts";
import { Types } from "mongoose";

const app = express();
app.use(express.json());

const allowedOrigins = [
  "https://ipl-auction-fawn.vercel.app",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked CORS origin:", origin);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
if (isProduction) {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

const PORT = process.env.PORT || 4000;

app.get("/", (_req, res) => {
  res.send("Hello, World!");
});

app.use("/v1/api", signuprouter);
app.use("/v1/api", loginRouter);
app.use("/v1/api", tokenRoutes);
app.use("/v1/api", roomRoutes);
app.use("/v1/api", auctionDataRoutes);
app.use("/v1/api", teamRoutes);
app.use("/v1/api", otpVerificationRouter);

app.use(errorHandler);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    credentials: true
  }
})

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (typeof token !== "string" || !token) {
      next(new Error("Authentication required"));
      return;
    }
    const payload = verifyToken(token);
    if (!Types.ObjectId.isValid(payload.id)) {
      next(new Error("Invalid user identity"));
      return;
    }
    socket.data.userId = String(payload.id);
    next();
  } catch {
    next(new Error("Invalid or expired access token"));
  }
});

// Set the Socket.IO server instance so it can be accessed in other modules.
setSocketServerInstance(io);

// When a client is conected, now RegisterRoomSocket function is executed to register the socket events for that client.
io.on("connection", (socket) => {
  // Triggered when a browser calls socket.connect(); register room listeners.
  console.info(`User connected: ${socket.id}`);

  // Register socket events for this client
  RegisterRoomSocket(io, socket);

  socket.on("disconnect", () => {
    // Triggered when the browser disconnects or the network connection closes.
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Verify the mail transporter is working fine.
mailTransporter.verify(
  (error) => {
    if (error) {
      console.log("Error in sending mail", error);
    } else {
      console.log("Email is server is ready");
    }
  }
);

const start = async () => {
  try {
    await connectDB();
    await connectRedis();
    startAuctionExpiryWorker();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void start();
