import React, { useState, useEffect } from 'react';
import { useSceneStore } from '../store/sceneStore';
import { X } from 'lucide-react';
import * as THREE from 'three';

const ObjectProperties: React.FC = () => {
  const { selectedObject, updateObjectProperties, updateObjectColor, updateObjectOpacity } = useSceneStore();
  const [localOpacity, setLocalOpacity] = useState(1);

  const getMaterial = () => {
    if (selectedObject instanceof THREE.Mesh) {
      return selectedObject.material as THREE.MeshStandardMaterial;
    }
    return null;
  };

  const material = getMaterial();
  const currentColor = material ? '#' + material.color.getHexString() : '#44aa88';

  useEffect(() => {
    if (material) {
      setLocalOpacity(material.opacity);
    }
  }, [selectedObject, material]);

  if (!selectedObject) return null;

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    selectedObject.position[axis] = value;
    updateObjectProperties();
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    selectedObject.rotation[axis] = (value * Math.PI) / 180;
    updateObjectProperties();
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    selectedObject.scale[axis] = value;
    updateObjectProperties();
  };

  const handleOpacityChange = (value: number) => {
    setLocalOpacity(value);
    updateObjectOpacity(value);
  };

  return (
    <div className="absolute right-72 top-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-4 w-64 border border-white/5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white/90">Properties</h2>
        <button
          onClick={() => useSceneStore.getState().setSelectedObject(null)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Position</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`pos-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.position[axis]}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Rotation (degrees)</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`rot-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={(selectedObject.rotation[axis] * 180) / Math.PI}
                  onChange={(e) => handleRotationChange(axis, parseFloat(e.target.value))}
                  step="5"
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-white/70 text-sm">Scale</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={`scale-${axis}`}>
                <label className="text-xs text-white/50 uppercase block mb-1">{axis}</label>
                <input
                  type="number"
                  value={selectedObject.scale[axis]}
                  onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  className="w-full bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ))}
          </div>
        </div>

        {material && (
          <>
            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Color</h3>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => updateObjectColor(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer bg-[#2a2a2a] border border-white/10"
                />
                <input
                  type="text"
                  value={currentColor}
                  onChange={(e) => updateObjectColor(e.target.value)}
                  className="flex-1 bg-[#2a2a2a] border border-white/10 rounded px-2 py-1 text-sm text-white/90 focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 text-white/70 text-sm">Opacity</h3>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={localOpacity}
                  onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm w-12 text-right text-white/90">
                  {Math.round(localOpacity * 100)}%
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ObjectProperties;