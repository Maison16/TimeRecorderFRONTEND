import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { apiURL } from "../config";
import { Button, Card, Spinner } from "react-bootstrap";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { UserDtoWithRolesAndAuthStatus } from "../interfaces/types";

const POLL_INTERVAL = 100000; // 100 seconds

const WorkStatusWidget: React.FC<{ userRoles: string[]; user: UserDtoWithRolesAndAuthStatus }> = ({ userRoles, user }) => {
  if (!userRoles || userRoles.length === 0) {
    return null;
  }
  const [loading, setLoading] = useState(true);
  const [workLog, setWorkLog] = useState<any>(null);
  const [timer, setTimer] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiURL}/api/WorkLog/filter?isClose=false`, { withCredentials: true });
      const logs = res.data;
      setWorkLog(logs && logs.length > 0 ? logs[logs.length - 1] : null);
    } catch {
      setWorkLog(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${apiURL}/workStatusHub`, { withCredentials: true })
      .configureLogging(LogLevel.Information)
      .build();

    connection.start()
      .then(() => console.log("SignalR connected"))
      .catch(err => console.error("SignalR error:", err));

    connection.on("WorkStatusChanged", () => {
      fetchStatus();
    });

    return () => {
      connection.stop();
    };
  }, []);

  useEffect(() => {
    if (workLog && workLog.startTime && !workLog.endTime) {
      const start = new Date(workLog.startTime).getTime();
      timerRef.current = setInterval(() => {
        setTimer(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      setTimer(Math.floor((Date.now() - start) / 1000));
    } else {
      setTimer(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [workLog]);

  //fallback
  useEffect(() => {
     fetchStatus();
     const interval = setInterval(fetchStatus, POLL_INTERVAL);
     return () => clearInterval(interval);
   }, []);
  useEffect(() => {
    fetchStatus();
  }, []);

  const handleStartWork = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${apiURL}/api/WorkLog/start?type=Work`, {}, { withCredentials: true });
      // SignalR odświeży status
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start work.");
      setLoading(false);
    }
  };
  const handleStartBreak = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${apiURL}/api/WorkLog/start?type=Break`, {}, { withCredentials: true });
      // SignalR odświeży status
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to start break.");
      setLoading(false);
    }
  };
  const handleEndWork = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${apiURL}/api/WorkLog/end/${workLog.id}`, {}, { withCredentials: true });
      // SignalR odświeży status
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to end work.");
      setLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  let statusText = "Not working";
  if (workLog) {
    if (workLog.type === 0) statusText = "Working";
    if (workLog.type === 5) statusText = "On break";
  }

  return (
    <Card
      style={{
        position: "fixed",
        left: 20,
        bottom: 20,
        minWidth: 220,
        zIndex: 9999,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        background: "#222",
        color: "#fff",
        borderRadius: 12,
        padding: "16px",
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 8 }}>
        Work Status
      </div>
      {loading ? (
        <Spinner animation="border" size="sm" />
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <span>Status: <strong>{statusText}</strong></span>
          </div>
          {workLog && workLog.startTime && !workLog.endTime && (
            <div style={{ marginBottom: 8 }}>
              <span>
                {workLog.type === 0 ? "Work time: " : "Break time: "}
                <strong>{formatTime(timer)}</strong>
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {!workLog && (
              <Button size="sm" variant="success" onClick={handleStartWork}>Start Work</Button>
            )}
            {workLog && workLog.type === 0 && (
              <>
                <Button size="sm" variant="warning" onClick={handleStartBreak}>Start Break</Button>
                <Button size="sm" variant="danger" onClick={handleEndWork}>End Work</Button>
              </>
            )}
            {workLog && workLog.type === 5 && (
              <Button size="sm" variant="danger" onClick={handleStartWork}>End Break</Button>
            )}
          </div>
        </>
      )}
      {error && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 90,
            zIndex: 9999,
            background: "#d9534f",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            fontSize: 15,
            minWidth: 220,
            animation: "fadeInOut 5s"
          }}
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <style>
            {`
              @keyframes fadeInOut {
                0% { opacity: 0; transform: translateY(30px);}
                10% { opacity: 1; transform: translateY(0);}
                90% { opacity: 1; transform: translateY(0);}
                100% { opacity: 0; transform: translateY(30px);}
              }
            `}
          </style>
        </div>
      )}
    </Card>
  );
};

export default WorkStatusWidget;