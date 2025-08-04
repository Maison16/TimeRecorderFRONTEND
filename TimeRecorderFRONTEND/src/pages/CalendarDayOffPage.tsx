import DayOffCalendar from "../components/DayOffCalendar";

const CalendarDayOffPage: React.FC = () => {

    return (
        <div className="container d-flex flex-column align-items-center justify-content-center pt-5" style={{ minHeight: '100vh' }}>
            <h2 className="text-center mb-4">Day Off Calendar</h2>
            <DayOffCalendar />
        </div>
    );
};

export default CalendarDayOffPage;