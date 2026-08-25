export type Service = {
  id: string;
  name: string;
  priceCents: number;
  emoji: string;
  imageUrl: string | null;
  position: number;
  active: boolean;
};

export type Barber = {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  active: boolean;
};

export type UserRecord = {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AppointmentRecord = {
  id: string;
  userId: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  status: "confirmed" | "cancelled";
  cancelToken: string;
  createdAt: string;
  cancelledAt: string | null;
};

export type AppointmentWithDetails = AppointmentRecord & {
  userName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  serviceName: string;
  serviceEmoji: string;
  serviceImageUrl: string;
  priceCents: number;
  barberName: string;
  barberPhone: string;
  barberPhotoUrl: string;
};

export type Slot = {
  time: string;
  booked: boolean;
};

export type BarberSchedule = {
  id: string;
  barberId: string;
  date: string;
  available: boolean;
  startTime: string | null;
  endTime: string | null;
};
