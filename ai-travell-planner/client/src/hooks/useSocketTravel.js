import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../services/api.js";

export function useSocketTravel() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("travel_ai_token");
    const socket = io(API_URL, {
      auth: { token },
      transports: ["websocket"]
    });
    socketRef.current = socket;
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    return () => socket.disconnect();
  }, []);

  return { socket: socketRef, connected };
}
