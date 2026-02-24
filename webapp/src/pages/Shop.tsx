import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ShoppingCart } from 'lucide-react';
import './Shop.css';

export default function Shop() {
    const { shopItems, stats, buyItem, createShopItem, deleteShopItem, editShopItem } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ name: '', description: '', cost: 10, type: 'consumable' as any });

    const handleAdd = () => {
        if (!newItem.name) return;
        if (editingId) {
            editShopItem(editingId, newItem);
            setEditingId(null);
        } else {
            createShopItem(newItem);
        }
        setIsAdding(false);
        setNewItem({ name: '', description: '', cost: 10, type: 'consumable' });
    };

    const handleEdit = (item: any) => {
        setNewItem({ name: item.name, description: item.description, cost: item.cost, type: item.type });
        setEditingId(item.id);
        setIsAdding(true);
    };

    return (
        <div className="shop-page">
            <div className="shop-header">
                <div>
                    <h2>Loja de Recompensas</h2>
                    <p className="credits-display">{stats.credits} Créditos Dísponiveis</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    setIsAdding(!isAdding);
                    if (isAdding) setEditingId(null); // Cancel edit
                }}>
                    {isAdding ? 'Cancelar' : '+'}
                </button>
            </div>

            {isAdding && (
                <div className="add-routine-form">
                    <input type="text" placeholder="Nome da Recompensa (ex: Skin do LoL)" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                    <input type="text" placeholder="Descrição" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} />
                    <div className="form-row">
                        <input type="number" placeholder="Custo" value={newItem.cost} onChange={e => setNewItem({ ...newItem, cost: Number(e.target.value) })} />
                        <select value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value as any })}>
                            <option value="consumable">Consumível</option>
                            <option value="permanent">Permanente (Buff)</option>
                        </select>
                    </div>
                    <button className="btn-primary full-width" onClick={handleAdd}>{editingId ? 'Salvar Edição' : 'Criar Item'}</button>
                </div>
            )}

            <div className="shop-grid">
                {shopItems.map(item => (
                    <div key={item.id} className="shop-card">
                        <div className="shop-card-info">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            <span className="type-badge">{item.type === 'consumable' ? 'Usável' : 'Passivo'}</span>
                        </div>

                        <div className="shop-card-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end', width: '100%' }}>
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleEdit(item)}>Editar</button>
                            <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem', color: 'var(--hp-color)' }} onClick={() => deleteShopItem(item.id)}>Excluir</button>
                            <button
                                className={`buy-btn ${stats.credits < item.cost ? 'disabled' : ''}`}
                                onClick={() => buyItem(item.id)}
                                disabled={stats.credits < item.cost}
                                style={{ marginLeft: 'auto' }}
                            >
                                <ShoppingCart size={16} />
                                <span>{item.cost}</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
