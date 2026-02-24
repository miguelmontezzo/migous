import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import './PomodoroTimer.css';

interface PomodoroTimerProps {
    onComplete: () => void;
    onCancel: () => void;
    initialMinutes?: number;
}

export default function PomodoroTimer({ onComplete, onCancel, initialMinutes = 25 }: PomodoroTimerProps) {
    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (isRunning && timeLeft === 0) {
            setIsRunning(false);
            onComplete(); // Timer is done! Reward the user.
        }

        return () => clearInterval(interval);
    }, [isRunning, timeLeft, onComplete]);

    const toggleTimer = () => {
        setIsRunning(!isRunning);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const progress = ((initialMinutes * 60 - timeLeft) / (initialMinutes * 60)) * 100;

    return (
        <div className="pomodoro-container">
            <div className="pomodoro-progress-bg">
                <div
                    className="pomodoro-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="pomodoro-content">
                <span className="pomodoro-time">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>

                <div className="pomodoro-controls">
                    <button className="btn-icon play" onClick={toggleTimer}>
                        {isRunning ? <Square size={16} /> : <Play size={16} fill="currentColor" />}
                    </button>
                    {!isRunning && timeLeft === initialMinutes * 60 && (
                        <button className="btn-text cancel" onClick={onCancel}>Cancelar</button>
                    )}
                </div>
            </div>
        </div>
    );
}
