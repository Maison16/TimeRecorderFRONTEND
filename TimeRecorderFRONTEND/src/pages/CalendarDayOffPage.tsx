import DayOffCalendar from "../components/DayOffCalendar";
import { UserDtoWithRolesAndAuthStatus } from "../interfaces/types";
const CalendarDayOffPage: React.FC<{ user: UserDtoWithRolesAndAuthStatus }> = ({ user }) => {
    // Nie pobieraj profilu, nie sprawdzaj autoryzacji – wszystko masz w propsach z App.tsx

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center pt-5" style={{ minHeight: '100vh' }}>
            <h2 className="text-center mb-4">Day Off Calendar</h2>
            <DayOffCalendar user={user} />
        </div>
    );
};

export default CalendarDayOffPage;