import React from 'react';
import { useSceneStore } from '../store/sceneStore';

const EditControls: React.FC = () => {
  const { editMode, selectedObject } = useSceneStore();

  if (!selectedObject || !editMode) return null;

  const renderControls = () => {
    switch (editMode) {
      case 'extrude':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Extrude Settings</h3>
            <div>
              <label className="block text-sm">Distance</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="w-full"
                onChange={(e) => useSceneStore.getState().extrudeFace(parseFloat(e.target.value))}
              />
            </div>
          </div>
        );
      case 'bevel':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">Bevel Settings</h3>
            <div>
              <label className="block text-sm">Segments</label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                className="w-full"
                onChange={(e) => useSceneStore.getState().bevelEdge(parseInt(e.target.value), 0.1)}
              />
            </div>
          </div>
        );
      case 'nurbs':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">NURBS Surface</h3>
            <button
              onClick={() => useSceneStore.getState().createNURBSSurface()}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Surface
            </button>
            <button
              onClick={() => useSceneStore.getState().clearControlPoints()}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
            >
              Clear Points
            </button>
          </div>
        );
      case 'curve':
        return (
          <div className="space-y-2">
            <h3 className="font-medium">NURBS Curve</h3>
            <button
              onClick={() => useSceneStore.getState().createNURBSCurve()}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Curve
            </button>
            <button
              onClick={() => useSceneStore.getState().clearControlPoints()}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
            >
              Clear Points
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
      {renderControls()}
    </div>
  );
};

export default EditControls;