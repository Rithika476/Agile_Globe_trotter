import React, { useState } from 'react';
import { ItineraryDay } from '../../types';
import { formatDate, formatTime, formatCurrency } from '../../utils/format';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';

interface TimelineTabProps {
  days: ItineraryDay[];
  onGoToDestinations: () => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ days, onGoToDestinations }) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  if (days.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="w-10 h-10" />}
        title="No timeline available"
        description="Add destinations to generate an interactive day-by-day timeline."
        action={
          <Button variant="primary" size="sm" onClick={onGoToDestinations}>
            Add Destinations First
          </Button>
        }
      />
    );
  }

  const activeDay = days[selectedDayIndex] || days[0];
  const destObj = activeDay.destination as any;
  const destCity = destObj?.city || 'Unassigned';
  const destCountry = destObj?.country ? ` (${destObj.country})` : '';

  const dayTotalCost =
    activeDay.activities?.reduce((acc, a) => acc + (a.estimatedCost || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900">Itinerary Timeline</h3>
        <p className="text-xs text-slate-500">
          Chronological breakdown of destination stays and scheduled events.
        </p>
      </div>

      {/* Horizontal Day Selector (Scrollable on mobile) */}
      <div className="flex items-center space-x-2 pb-2">
        <button
          onClick={() => setSelectedDayIndex((prev) => Math.max(0, prev - 1))}
          disabled={selectedDayIndex === 0}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white shrink-0 transition"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Day Pills */}
        <div className="flex-1 flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {days.map((day, idx) => {
            const isSelected = idx === selectedDayIndex;
            return (
              <button
                key={day._id}
                onClick={() => setSelectedDayIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>Day {idx + 1}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                  ({formatDate(day.date).split(' ')[0]} {formatDate(day.date).split(' ')[1]})
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSelectedDayIndex((prev) => Math.min(days.length - 1, prev + 1))}
          disabled={selectedDayIndex === days.length - 1}
          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:hover:bg-white shrink-0 transition"
          aria-label="Next Day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Day Detail Card */}
      <Card className="p-6 space-y-6">
        {/* Day Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg uppercase">
                Day {selectedDayIndex + 1} of {days.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatDate(activeDay.date)}
              </span>
            </div>
            <h4 className="text-xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span>{destCity}{destCountry}</span>
            </h4>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Day Expenses</span>
            <span className="text-lg font-black text-slate-900">
              {formatCurrency(dayTotalCost)}
            </span>
          </div>
        </div>

        {/* Vertical Timeline of Activities */}
        {!activeDay.activities || activeDay.activities.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No activities scheduled for this day yet.</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activeDay.activities.map((act) => {
              const hasTimes = act.startTime || act.endTime;
              return (
                <div key={act._id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[1.85rem] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-teal-600 shadow-xs" />

                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 hover:bg-white hover:shadow-xs transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant={act.category} className="text-[10px]">
                            {act.category}
                          </Badge>
                          {hasTimes && (
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-teal-600" />
                              {act.startTime ? formatTime(act.startTime) : ''}
                              {act.startTime && act.endTime ? ' - ' : ''}
                              {act.endTime ? formatTime(act.endTime) : ''}
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-slate-900">{act.title}</h5>
                      </div>

                      <span className="text-xs font-bold text-slate-800 shrink-0">
                        {formatCurrency(act.estimatedCost)}
                      </span>
                    </div>

                    {act.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {act.description}
                      </p>
                    )}

                    {act.location && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{act.location}</span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
