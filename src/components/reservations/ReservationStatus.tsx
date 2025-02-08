import { format, isAfter, isBefore, isToday, parseISO, startOfDay } from 'date-fns';
import { hr } from 'date-fns/locale';

interface ReservationStatusProps {
  checkIn: string;
  checkOut: string;
}

export default function ReservationStatus({ checkIn, checkOut }: ReservationStatusProps) {
  const getStatus = () => {
    const today = startOfDay(new Date());
    const checkInDate = parseISO(checkIn);
    const checkOutDate = parseISO(checkOut);

    if (isAfter(checkInDate, today)) {
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        label: `Dolazak za ${daysUntilCheckIn} ${daysUntilCheckIn === 1 ? 'dan' : 'dana'}`,
        color: 'text-blue-600 bg-blue-100'
      };
    }

    if (isBefore(checkOutDate, today)) {
      return {
        label: 'Odjavljen',
        color: 'text-gray-600 bg-gray-100'
      };
    }

    if (isToday(checkInDate)) {
      return {
        label: 'Danas prijava',
        color: 'text-yellow-600 bg-yellow-100'
      };
    }

    if (isToday(checkOutDate)) {
      return {
        label: 'Danas odjava',
        color: 'text-orange-600 bg-orange-100'
      };
    }

    return {
      label: 'U apartmanu',
      color: 'text-green-600 bg-green-100'
    };
  };

  const status = getStatus();

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${status.color}`}>
      {status.label}
    </span>
  );
}
