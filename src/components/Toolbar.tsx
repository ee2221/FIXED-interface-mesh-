import React from 'react';
import { Cuboid, Cherry, Cylinder, Cone, Pyramid, Move, RotateCw, Maximize, Projector as Vector, Box, Link } from 'lucide-react';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

const Toolbar: React.FC = () => {
  const { 
    addObject, 
    setTransformMode, 
    transformMode, 
    setEditMode,
    editMode 
  } = useSceneStore();

  const createObject = (geometry: THREE.BufferGeometry, name: string) => {
    const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    addObject(mesh, name);
  };

  const transformTools = [
    {
      icon: Move,
      mode: 'translate',
      title: 'Move Tool',
      type: 'transform'
    },
    {
      icon: RotateCw,
      mode: 'rotate',
      title: 'Rotate Tool',
      type: 'transform'
    },
    {
      icon: Maximize,
      mode: 'scale',
      title: 'Scale Tool',
      type: 'transform'
    },
  ] as const;

  const editTools = [
    {
      icon: Vector,
      mode: 'vertex',
      title: 'Edit Vertices',
      type: 'edit'
    },
    {
      icon: Link,
      mode: 'edge',
      title: 'Edit Edges',
      type: 'edit'
    },
    {
      icon: Box,
      mode: 'face',
      title: 'Edit Faces',
      type: 'edit'
    }
  ] as const;

  return (
    <div className="absolute top-4 left-4 bg-[#1a1a1a] rounded-xl shadow-2xl shadow-black/20 p-3 border border-white/5">
      <div className="flex flex-col gap-3">
        {/* 3D Shapes */}
        <div className="space-y-1 border-b border-white/10 pb-3">
          <button
            onClick={() => createObject(new THREE.BoxGeometry(), 'Cube')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors w-full flex items-center gap-2 text-white/90"
            title="Add Cube"
          >
            <Cuboid className="w-5 h-5" />
            <span className="text-sm font-medium">Cube</span>
          </button>
          <button
            onClick={() => createObject(new THREE.SphereGeometry(0.5, 32, 32), 'Sphere')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors w-full flex items-center gap-2 text-white/90"
            title="Add Sphere"
          >
            <Cherry className="w-5 h-5" />
            <span className="text-sm font-medium">Sphere</span>
          </button>
          <button
            onClick={() => createObject(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), 'Cylinder')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors w-full flex items-center gap-2 text-white/90"
            title="Add Cylinder"
          >
            <Cylinder className="w-5 h-5" />
            <span className="text-sm font-medium">Cylinder</span>
          </button>
          <button
            onClick={() => createObject(new THREE.ConeGeometry(0.5, 1, 32), 'Cone')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors w-full flex items-center gap-2 text-white/90"
            title="Add Cone"
          >
            <Cone className="w-5 h-5" />
            <span className="text-sm font-medium">Cone</span>
          </button>
          <button
            onClick={() => createObject(new THREE.TetrahedronGeometry(0.5), 'Tetrahedron')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors w-full flex items-center gap-2 text-white/90"
            title="Add Tetrahedron"
          >
            <Pyramid className="w-5 h-5" />
            <span className="text-sm font-medium">Tetrahedron</span>
          </button>
        </div>

        {/* Transform Tools */}
        <div className="space-y-1 border-b border-white/10 pb-3">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Transform</h3>
          </div>
          {transformTools.map(({ icon: Icon, mode, title }) => (
            <button
              key={mode}
              onClick={() => {
                setTransformMode(mode);
                setEditMode(null);
              }}
              className={`p-2 rounded-lg transition-colors w-full flex items-center gap-2 ${
                transformMode === mode && !editMode 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-white/90 hover:bg-white/5'
              }`}
              title={title}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{title}</span>
            </button>
          ))}
        </div>

        {/* Edit Tools */}
        <div className="space-y-1">
          <div className="px-2 py-1">
            <h3 className="text-xs font-medium text-white/50 uppercase tracking-wider">Edit Mode</h3>
          </div>
          {editTools.map(({ icon: Icon, mode, title }) => (
            <button
              key={mode}
              onClick={() => {
                setEditMode(mode);
                setTransformMode(null);
              }}
              className={`p-2 rounded-lg transition-colors w-full flex items-center gap-2 ${
                editMode === mode 
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-white/90 hover:bg-white/5'
              }`}
              title={title}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Toolbar;