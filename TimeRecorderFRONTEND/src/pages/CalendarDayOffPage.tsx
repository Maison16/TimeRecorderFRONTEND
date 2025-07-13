import { useEffect, useState } from 'react';
import DayOffCalendar from "../components/DayOffCalendar";
import { apiURL } from "../config";
import { useNavigate } from 'react-router-dom';


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
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

                const profile = await profileRes.json();
                console.log('✅ User profile:', profile);
            } catch (err) {
                console.error('❌ Error during auth/profile:', err);
                navigate('/');
            }
        };

        checkAuthAndFetchProfile();
    }, [navigate]);


    return (
        <div className="container mt-4 d-flex flex-column align-items-center">
            <h2 className="text-center mb-4">Day Off Calendar</h2>
            <DayOffCalendar />
        </div>
    );
};

export default Dashboard;
