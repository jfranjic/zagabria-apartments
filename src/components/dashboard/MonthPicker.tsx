import { useState, useRef, useEffect } from 'react';

interface MonthPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (month: number) => void;
  buttonClassName?: string;
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

export default function MonthPicker({
  isOpen,
  onClose,
  onSelect,
  buttonClassName
}: MonthPickerProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={popupRef}
      className="absolute z-[9999] mt-2 p-4 bg-white rounded-xl shadow-xl ring-1 ring-black/5"
    >
      <div className="grid grid-cols-4 gap-2">
        {monthNamesHr.map((monthHr, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(index);
              onClose();
            }}
            className="text-left hover:bg-slate-100 text-slate-800 font-medium px-3 py-2 rounded-md transition-colors"
          >
            <div className="text-sm font-semibold">{`${index + 1}. ${monthHr}`}</div>
            <div className="text-xs text-slate-600">{monthNamesEn[index]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
