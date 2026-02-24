import { useStore } from '../store/useStore';
import { Zap } from 'lucide-react';
import './Shop.css'; // Reusing shop grid

export default function Inventory() {
    const { inventory, useInventoryItem } = useStore();

    return (
        <div className="inventory-page">
            <div className="shop-header">
                <h2>Sua Mochila</h2>
            </div>

            {inventory.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '40px' }}>
                    <BackpackIcon />
                    <p style={{ marginTop: '16px' }}>Sua mochila está vazia.</p>
                    <p style={{ fontSize: '0.8rem' }}>Complete tarefas e compre itens na loja.</p>
                </div>
            )}

            <div className="shop-grid">
                {inventory.map(inv => (
                    <div key={inv.id} className="shop-card" style={{ borderLeft: `3px solid var(--secondary)` }}>
                        <div className="shop-card-info">
                            <h4>{inv.item.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>x{inv.quantity}</span></h4>
                            <p>{inv.item.description}</p>
                            <span className="type-badge">Recompensa Uso Único</span>
                        </div>

                        <button
                            className="buy-btn"
                            style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}
                            onClick={() => useInventoryItem(inv.id)}
                        >
                            <Zap size={16} /> Usar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const BackpackIcon = () => (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
        <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" /><path d="M8 10h8" /><path d="M8 14h8" />
    </svg>
);
