import React, { useEffect, useState } from "react";
import { Badge, Dropdown, Button } from "react-bootstrap";

type Notification = {
    message: string;
    date: string;
    read: boolean;
};

const NotificationBell: React.FC<{ bellColor?: string }> = ({ bellColor = "#fff" }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showToast, setShowToast] = useState<string | null>(null);

    useEffect(() => {
        if(!window.hubConnection) return;

        const connection = window.hubConnection;

        connection.on("WorkStatusChanged", (data: any) => {
            let msg = "";
            if (data.status === "not_started") msg = "You didn't start work today!";
            if (data.status === "unfinished") msg = "You didn't end work today!";
            if (data.status === "long_break") msg = `Your break is longer than ${data.maxBreakTime} minutes. End it as quick as you can!`;
            if (data.status === "new_thread") msg = "New daily thread has been started!";
            if (data.status === "break_ended") msg = "Your break has been automatically ended!";
            if (data.status === "auto_work_ended") msg = "Your work log requires attention (auto-marked)!";
            if( data.status === "work_ended") msg = "Your work log has been ended!";
            if (data.status === "work_started") msg = "Your work log has been started!";
            if( data.status === "break_started") msg = "Your break has been started!";
            if (data.status === "still_here") msg = "Are you still here? Your status on teams is BrB!";

            if (msg) {
                playSound();
                const now = new Date();
                setNotifications(prev => [
                    { message: msg, date: now.toLocaleString(), read: false },
                    ...prev,
                ]);
                setShowToast(msg);
                setTimeout(() => setShowToast(null), 5000);
            }
        });

        return () => {
            connection.stop();
        };
    }, []);

    const playSound = () => {
        const audio = new Audio("/notification.mp3");
        audio.play();
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markAsRead = (idx: number) => {
        setNotifications(prev =>
            prev.map((n, i) => (i === idx ? { ...n, read: true } : n))
        );
    };

    return (
        <>
            <Dropdown align="end" className="me-1">
                <Dropdown.Toggle variant="light" id="notification-bell" style={{ background: "none", border: "none", padding: 0 }}>
                    <span style={{ fontSize: 15, position: "relative", color: bellColor }}>
                        <i className="bi bi-bell"></i>
                        {unreadCount > 0 && (
                            <Badge bg="danger" pill style={{ position: "absolute", top: -5, right: -10, fontSize: 12 }}>
                                {unreadCount}
                            </Badge>
                        )}
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: 270 }}>
                    <Dropdown.Header>
                        Notifications
                        {notifications.length > 0 && (
                            <Button
                                size="sm"
                                variant="link"
                                style={{ float: "right", fontSize: 12, padding: 0 }}
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </Button>
                        )}
                    </Dropdown.Header>
                    {notifications.length === 0 ? (
                        <Dropdown.ItemText>No notifications</Dropdown.ItemText>
                    ) : (
                        notifications.map((n, idx) => (
                            <Dropdown.Item
                                key={idx}
                                style={{
                                    background: n.read ? "inherit" : "#f8d7da",
                                    cursor: !n.read ? "pointer" : "default",
                                    borderRadius: 6,
                                    marginBottom: 2,
                                    padding: "6px 8px",
                                    fontWeight: n.read ? "normal" : "bold"
                                }}
                                onClick={() => !n.read && markAsRead(idx)}
                                as="div"
                            >
                                <span>{n.message}</span>
                                <br />
                                <span style={{ fontSize: 11, color: "#888" }}>{n.date}</span>
                                {!n.read && (
                                    <Badge bg="danger" pill style={{ marginLeft: 8, fontSize: 10 }}>
                                        new
                                    </Badge>
                                )}
                            </Dropdown.Item>
                        ))
                    )}
                </Dropdown.Menu>
            </Dropdown>
            {showToast && (
                <div
                    style={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        zIndex: 9999,
                        background: "#222",
                        color: "#fff",
                        padding: "16px 24px",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        fontSize: 16,
                        minWidth: 220,
                        animation: "fadeInOut 5s"
                    }}
                >
                    <i className="bi bi-bell-fill me-2"></i>
                    {showToast}
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
        </>
    );
};

export default NotificationBell;