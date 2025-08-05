import React, { useMemo, useState, useCallback } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { useAppContext } from '../../context/AppContext';
import { Play, Pause, SkipBack, SkipForward, Calendar, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import './timelineSlider.css';

const HOURS_IN_WINDOW = 24 * 30; // 30 days
const STEP = 1;
const MIN = 0;
const MAX = HOURS_IN_WINDOW - 1;
const ANIMATION_SPEED = 200; // milliseconds between steps

const TimelineSlider = () => {
  const { state, dispatch } = useAppContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playDirection, setPlayDirection] = useState<'forward' | 'backward'>('forward');
  const [animationInterval, setAnimationInterval] = useState<number | null>(null);

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

  const handleChange = useCallback((values: number[]) => {
    const [startHour, endHour] = values;
    dispatch({
      type: 'SET_TIME',
      payload: {
        start: startDate.add(startHour, 'hour').toISOString(),
        end: startDate.add(endHour, 'hour').toISOString(),
      },
    });
  }, [dispatch, startDate]);

  const startAnimation = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
    }

    const interval = setInterval(() => {
      const [currentStart, currentEnd] = values;
      const rangeSize = currentEnd - currentStart;
      
      let newStart, newEnd;
      
      if (playDirection === 'forward') {
        newStart = Math.min(MAX - rangeSize, currentStart + 1);
        newEnd = newStart + rangeSize;
        
        // If we've reached the end, stop or reverse
        if (newEnd >= MAX) {
          setIsPlaying(false);
          return;
        }
      } else {
        newStart = Math.max(0, currentStart - 1);
        newEnd = newStart + rangeSize;
        
        // If we've reached the beginning, stop or go forward
        if (newStart <= 0) {
          setIsPlaying(false);
          return;
        }
      }
      
      handleChange([newStart, newEnd]);
    }, ANIMATION_SPEED);

    setAnimationInterval(interval);
  }, [values, playDirection, handleChange, animationInterval]);

  const stopAnimation = useCallback(() => {
    if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }
    setIsPlaying(false);
  }, [animationInterval]);

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAnimation();
    } else {
      setIsPlaying(true);
      startAnimation();
    }
  };

  const jumpToStart = () => {
    stopAnimation();
    const rangeSize = values[1] - values[0];
    handleChange([0, rangeSize]);
  };

  const jumpToEnd = () => {
    stopAnimation();
    const rangeSize = values[1] - values[0];
    handleChange([MAX - rangeSize, MAX]);
  };

  const getFormattedDate = (hourOffset: number) => {
    return startDate.add(hourOffset, 'hour');
  };

  const getCurrentDateRange = () => {
    const start = getFormattedDate(values[0]);
    const end = getFormattedDate(values[1]);
    
    if (start.isSame(end, 'day')) {
      return {
        date: start.format('MMM D, YYYY'),
        time: `${start.format('HH:mm')} - ${end.format('HH:mm')}`
      };
    } else {
      return {
        date: `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`,
        time: `${start.format('HH:mm')} - ${end.format('HH:mm')}`
      };
    }
  };

  const currentRange = getCurrentDateRange();

  // Clean up animation on unmount
  React.useEffect(() => {
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [animationInterval]);

  return (
    <div className={`bg-white border-b border-gray-200 p-4 transition-all duration-300 ${
      state.animationsEnabled ? 'transform' : ''
    }`}>
      <div className="max-w-full mx-auto">
        {/* Header with date info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              <span className="font-medium text-gray-800 text-sm sm:text-base">
                {currentRange.date}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <span className="text-gray-600 text-sm">
                {currentRange.time}
              </span>
            </div>
          </div>
          
          {/* Animation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={jumpToStart}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Jump to start"
            >
              <SkipBack size={16} className="text-gray-600" />
            </button>
            
            <button
              onClick={() => {
                setPlayDirection(playDirection === 'forward' ? 'backward' : 'forward');
                if (isPlaying) {
                  stopAnimation();
                  setTimeout(() => {
                    setIsPlaying(true);
                    startAnimation();
                  }, 50);
                }
              }}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                playDirection === 'forward' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}
              title="Toggle direction"
            >
              {playDirection === 'forward' ? '→' : '←'}
            </button>
            
            <button
              onClick={togglePlayPause}
              className={`p-2 rounded-md transition-all duration-200 ${
                isPlaying
                  ? 'bg-red-100 hover:bg-red-200 text-red-600'
                  : 'bg-green-100 hover:bg-green-200 text-green-600'
              } ${state.animationsEnabled ? 'transform hover:scale-105' : ''}`}
              title={isPlaying ? 'Pause animation' : 'Start animation'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={jumpToEnd}
              className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Jump to end"
            >
              <SkipForward size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="px-2 sm:px-4">
          <Range
            values={values}
            step={STEP}
            min={MIN}
            max={MAX}
            onChange={handleChange}
            renderTrack={({ props, children }) => (
              <div
                onMouseDown={props.onMouseDown}
                onTouchStart={props.onTouchStart}
                className="timeline-track"
                style={{
                  ...props.style,
                  height: '6px',
                  width: '100%',
                  borderRadius: '3px',
                  background: getTrackBackground({
                    values,
                    colors: [
                      '#e5e7eb',
                      state.animationsEnabled ? '#3b82f6' : '#6b7280',
                      '#e5e7eb'
                    ],
                    min: MIN,
                    max: MAX,
                  }),
                  transition: state.animationsEnabled ? 'all 0.2s ease' : 'none'
                }}
              >
                {children}
              </div>
            )}
            renderThumb={({ props, index }) => (
              <div
                {...props}
                className={`timeline-thumb ${
                  state.animationsEnabled ? 'transition-transform duration-150' : ''
                }`}
                style={{
                  ...props.style,
                  height: '20px',
                  width: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '3px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'grab',
                  outline: 'none'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {getFormattedDate(values[index]).format('MMM D, HH:mm')}
                </div>
              </div>
            )}
          />
        </div>

        {/* Timeline markers */}
        <div className="mt-3 px-2 sm:px-4">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{startDate.format('MMM D')}</span>
            <span className="hidden sm:inline">{startDate.add(7, 'day').format('MMM D')}</span>
            <span className="hidden md:inline">{startDate.add(15, 'day').format('MMM D')}</span>
            <span className="hidden sm:inline">{startDate.add(23, 'day').format('MMM D')}</span>
            <span>{now.format('MMM D')}</span>
          </div>
        </div>

        {/* Mobile-friendly indicators */}
        <div className="mt-2 sm:hidden">
          <div className="flex justify-center">
            <div className="bg-gray-100 rounded-lg px-3 py-1 text-xs text-gray-600">
              Duration: {Math.round((values[1] - values[0]) / 24 * 10) / 10} days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineSlider;
