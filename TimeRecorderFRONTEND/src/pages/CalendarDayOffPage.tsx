import { useEffect, useState } from 'react';
import DayOffCalendar from "../components/DayOffCalendar";
import { apiURL } from "../config";
import { useNavigate } from 'react-router-dom';

const CalendarDayOffPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndFetchProfile = async () => {
            try {
                const res = await fetch(`${apiURL}/api/auth/check`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!res.ok) throw new Error('Unauthorized');

                const authData = await res.json();
                if (!authData.isAuthenticated) throw new Error('Not authenticated');

                const profileRes = await fetch(`${apiURL}/api/User/profile`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!profileRes.ok) throw new Error('Unauthorized');

                setIsLoading(false);
            } catch (err) {
                console.log("Error checking auth or fetching profile:", err);
                setIsLoading(false);
                //setTimeout(() => navigate('/'), 0);
            }
        };

        checkAuthAndFetchProfile();
    }, [navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center pt-5" style={{ minHeight: '100vh' }}>
            <h2 className="text-center mb-4">Day Off Calendar</h2>
            <DayOffCalendar />
        </div>
    );
};

export default CalendarDayOffPage;