import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Edit2 } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';

const LayersPanel: React.FC = () => {
  const { objects, removeObject, toggleVisibility, updateObjectName } = useSceneStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = () => {
    if (editingId && editingName.trim()) {
      updateObjectName(editingId, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="absolute right-4 top-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-64 border border-white/5">
      <h2 className="text-lg font-semibold mb-4 text-white/90">Layers</h2>
      <div className="space-y-1">
        {objects.map(({ id, name, visible }) => (
          <div key={id} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors text-white/90">
            {editingId === id ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={saveEdit}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                className="bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 w-32 text-sm focus:outline-none focus:border-blue-500/50"
                autoFocus
              />
            ) : (
              <span className="flex-1 text-sm">{name}</span>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => editingId !== id && startEditing(id, name)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleVisibility(id)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                title={visible ? 'Hide' : 'Show'}
              >
                {visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => removeObject(id)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-red-400 hover:text-red-300"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayersPanel;