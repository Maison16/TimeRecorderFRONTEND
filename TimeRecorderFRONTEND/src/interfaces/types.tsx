import { DayOffStatus } from "../enums/DayOffStatus";
import { Event as RBCEvent } from 'react-big-calendar';
import { SyncDayOfWeek } from "../enums/SyncDayOfWeek";
import { SyncFrequency } from "../enums/SuncFrequency";


export interface UserDto {
  id: string;
  name: string;
  surname: string;
  email: string;
}
export interface DayOffRequestDto {
  id: number;
  dateStart: string;
  dateEnd: string;
  reason?: string;
  status: DayOffStatus;
  userId: string;
  userName?: string; 
  userSurname?: string;
}
export interface WorkLogDto {
  id: number;
  startTime: string;
  status: number; // WorkLogStatus
  endTime?: string;
  type: number;   // WorkLogType
  userId: string;
  duration?: number;
  userName?: string;
  userSurname?: string;
}

export interface CalendarEvent extends RBCEvent {
  id: number;
  status: DayOffStatus;
  userName?: string; 
  userSurname?: string;
  reason?: string; 
  userId?: string;
}
export interface UserDtoWithRoles {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  roles: string[]; 
}
export interface UserDtoWithRolesAndAuthStatus {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  roles: string[]; 
  isAuthenticated: boolean;
}
export interface Settings {
  id: number;
  maxBreakTime: number;
  maxWorkHoursDuringOneDay: number;
  latestStartMoment: number;
  syncUsersHour: number;
  syncUsersFrequency: SyncFrequency;
  syncUsersDays: SyncDayOfWeek[];    // only for Weekly
  syncUsersMonthDay: number;         // only for Monthly
}