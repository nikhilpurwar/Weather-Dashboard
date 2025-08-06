import { useMemo } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { useAppContext } from '../../context/AppContext';
import dayjs from 'dayjs';
import './timelineSlider.css';

const HOURS_IN_WINDOW = 24 * 30; // 30 days
const STEP = 1;
const MIN = 0;
const MAX = HOURS_IN_WINDOW - 1;

const TimelineSlider = () => {
  const { state, dispatch } = useAppContext();

  const now = dayjs();
  const startDate = now.subtract(15, 'day');

  const values = useMemo(() => {
    const start = state.selectedTime.start
      ? dayjs(state.selectedTime.start).diff(startDate, 'hour')
      : Math.floor(HOURS_IN_WINDOW / 2); // Default to middle
    const end = state.selectedTime.end
      ? dayjs(state.selectedTime.end).diff(startDate, 'hour')
      : Math.floor(HOURS_IN_WINDOW / 2) + 1; // Default range of 1 hour
    return [Math.max(0, start), Math.min(MAX, end)];
  }, [state.selectedTime, startDate]);

  const handleChange = (values: number[]) => {
    const [startHour, endHour] = values;
    dispatch({
      type: 'SET_TIME',
      payload: {
        start: startDate.add(startHour, 'hour').toISOString(),
        end: startDate.add(endHour, 'hour').toISOString(),
      },
    });
  };

  return (
    <div className="w-full px-4 pt-4 pb-3 bg-white shadow-sm border-b">
      <div className="mb-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
        <h2 className="text-sm font-semibold text-gray-800">⏱️ Timeline</h2>
        <div className="text-xs text-gray-600">
          {startDate.add(values[0], 'hour').format('MMM D, HH:mm')} - {startDate.add(values[1], 'hour').format('MMM D, HH:mm')}
        </div>
      </div>
      <div className="px-2">
        <Range
          values={values}
          step={STEP}
          min={MIN}
          max={MAX}
          onChange={handleChange}
          renderTrack={({ props, children }) => {
            const { key, ...trackProps } = props as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            return (
              <div
                key={key}
                {...trackProps}
                className="h-3 w-full rounded-lg"
                style={{
                  background: getTrackBackground({
                    values,
                    colors: ['#e5e7eb', '#3b82f6', '#e5e7eb'],
                    min: MIN,
                    max: MAX,
                  }),
                }}
              >
                {children}
              </div>
            );
          }}
          renderThumb={({ props, index }) => {
            const { key, ...thumbProps } = props;
            return (
              <div
                key={key}
                {...thumbProps}
                className="w-5 h-5 bg-blue-600 rounded-full shadow-lg border-2 border-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ ...thumbProps.style }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {startDate.add(values[index], 'hour').format('MMM D, HH:mm')}
                </div>
              </div>
            );
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-2">
        <span>{startDate.format('MMM D')}</span>
        <span>{startDate.add(HOURS_IN_WINDOW, 'hour').format('MMM D')}</span>
      </div>
    </div>
  );
};

export default TimelineSlider;
