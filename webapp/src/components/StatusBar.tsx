import './StatusBar.css';

interface StatusBarProps {
    label: string;
    value: number;
    max: number;
    color: string;
    icon?: React.ReactNode;
}

export default function StatusBar({ label, value, max, color, icon }: StatusBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="status-bar-container">
            <div className="status-bar-header">
                <span className="status-label">
                    {icon && <span className="status-icon">{icon}</span>}
                    {label}
                </span>
                <span className="status-value">{Math.floor(value)} / {max}</span>
            </div>
            <div className="status-track">
                <div
                    className="status-fill"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`
                    }}
                />
            </div>
        </div>
    );
}
