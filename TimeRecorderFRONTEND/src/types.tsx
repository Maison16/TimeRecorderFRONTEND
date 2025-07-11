import { DayOffStatus } from "./enums/DayOffStatus";
import { Event as RBCEvent } from 'react-big-calendar';


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
}
export interface CalendarEvent extends RBCEvent {
  id: number;
  status: DayOffStatus;
}
export interface UserDtoWithRoles {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  roles: string[]; 
}
