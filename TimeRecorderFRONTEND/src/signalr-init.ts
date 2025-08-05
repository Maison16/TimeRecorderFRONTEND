import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { apiURL } from "./config";

declare global {
  interface Window {
    hubConnection?: import("@microsoft/signalr").HubConnection;
  }
}

export function initSignalR() {
  if (!window.hubConnection) {
    window.hubConnection = new HubConnectionBuilder()
      .withUrl(`${apiURL}/workStatusHub`, { withCredentials: true })
      .configureLogging(LogLevel.Information)
      .build();

    window.hubConnection
      .start()
      .then(() => console.log("SignalR connected"))
      .catch(err => console.error("SignalR error:", err));
  }
}