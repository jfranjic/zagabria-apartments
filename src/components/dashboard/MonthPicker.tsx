import { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (month: number) => void;
  currentMonth: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const monthNamesHr = [
  'Siječanj',
  'Veljača',
  'Ožujak',
  'Travanj',
  'Svibanj',
  'Lipanj',
  'Srpanj',
  'Kolovoz',
  'Rujan',
  'Listopad',
  'Studeni',
  'Prosinac'
];

const monthNamesEn = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export default function MonthPicker({ isOpen, onClose, onSelect, currentMonth, buttonRef }: MonthPickerProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  // Izračunaj poziciju popupa relativno na gumb
  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const style = buttonRect ? {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '4px',
    zIndex: 9999,
  } : {};

  // Kreiraj array od 12 mjeseci
  const months = Array.from({ length: 12 }, (_, i) => ({
    index: i,
    number: i + 1,
    nameHr: monthNamesHr[i],
    nameEn: monthNamesEn[i]
  }));

  return (
    <div 
      ref={popupRef}
      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4"
      style={style}
    >
      <div className="grid grid-cols-3 gap-2 w-[360px]">
        {months.map((month) => (
          <button
            key={month.index}
            onClick={() => {
              onSelect(month.index);
              onClose();
            }}
            className={`flex flex-col items-center p-2 hover:bg-gray-100 rounded transition-colors ${
              currentMonth === month.index ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <span className="text-sm font-medium">{month.number}.</span>
            <span className="font-medium">{month.nameHr}</span>
            <span className="text-xs text-gray-500">{month.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
