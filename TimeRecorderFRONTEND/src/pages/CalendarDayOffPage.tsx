import { useEffect, useState } from 'react';
import DayOffCalendar from "../components/DayOffCalendar";
import { apiURL } from "../config";

const Dashboard: React.FC = () => {
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        fetch(`${apiURL}/api/User/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(async res => {
                if (!res.ok) {
                    throw new Error('Not authorized');
                }
                return res.json();
            })
            .then(profile => {
                console.log('User profile:', profile);
            })
            .catch(err => console.error('Fetch error:', err));
    }, []);

    return (
        <div className="container mt-4 d-flex flex-column align-items-center">
            <h2 className="text-center mb-4">Day Off Calendar</h2>
            <DayOffCalendar />
        </div>
    );
};

export default Dashboard;
