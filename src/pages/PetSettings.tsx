import { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Dog, Cat, IterationCw as Cow, Search, Check } from 'lucide-react';
import { adminService } from '../services/admin.service';

const INITIAL_TYPES = [
    { id: 'Dog', name: 'Dog', icon: Dog },
    { id: 'Cat', name: 'Cat', icon: Cat },
    { id: 'Cow', name: 'Cow', icon: Cow },
];

const INITIAL_BREEDS: Record<string, string[]> = {
    Dog: ["Golden Retriever", "German Shepherd", "Labrador", "Poodle", "Bulldog", "Beagle", "Indie / Mixed"],
    Cat: ["Persian", "Siamese", "Maine Coon", "Bengal", "British Shorthair", "Indie / Mixed"],
    Cow: ["Gir", "Sahiwal", "Red Sindhi", "Tharparkar", "Holstein Friesian", "Jersey"],
};

export default function PetSettings() {
    const [selectedType, setSelectedType] = useState('Dog');
    const [breeds, setBreeds] = useState<string[]>([]);
    const [newBreed, setNewBreed] = useState('');

    useEffect(() => {
        // In a real app, fetch from backend. For now, use initial or local storage.
        const saved = localStorage.getItem(`breeds_${selectedType}`);
        if (saved) {
            setBreeds(JSON.parse(saved));
        } else {
            setBreeds(INITIAL_BREEDS[selectedType] || []);
        }
    }, [selectedType]);

    const handleAddBreed = () => {
        if (!newBreed.trim()) return;
        const updated = [...breeds, newBreed.trim()];
        setBreeds(updated);
        localStorage.setItem(`breeds_${selectedType}`, JSON.stringify(updated));
        setNewBreed('');
    };

    const handleDeleteBreed = (name: string) => {
        const updated = breeds.filter(b => b !== name);
        setBreeds(updated);
        localStorage.setItem(`breeds_${selectedType}`, JSON.stringify(updated));
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1>Pet Settings</h1>
                    <p className="subtitle">Manage pet types and their respective breeds available in the app.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16 }}>Pet Types</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {INITIAL_TYPES.map(type => (
                            <button
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`btn ${selectedType === type.id ? 'btn-primary' : 'btn-ghost'} btn-block`}
                                style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                            >
                                <type.icon size={18} style={{ marginRight: 12 }} />
                                {type.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Breeds for {selectedType}</h3>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <input 
                                type="text" 
                                className="input" 
                                placeholder="Add new breed..." 
                                value={newBreed}
                                onChange={(e) => setNewBreed(e.target.value)}
                                style={{ width: 250 }}
                            />
                            <button className="btn btn-primary" onClick={handleAddBreed}>
                                <Plus size={18} /> Add
                            </button>
                        </div>
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Breed Name</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {breeds.map(breed => (
                                    <tr key={breed}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                                <span style={{ fontWeight: 600 }}>{breed}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button 
                                                    className="btn btn-ghost btn-sm btn-icon text-danger"
                                                    onClick={() => handleDeleteBreed(breed)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
