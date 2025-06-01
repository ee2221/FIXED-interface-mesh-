import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid } from '@react-three/drei';
import { useSceneStore } from '../store/sceneStore';
import * as THREE from 'three';

const VertexCoordinates = ({ position, onPositionChange }) => {
  if (!position) return null;

  const handleChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const newPosition = position.clone();
    newPosition[axis] = parseFloat(value) || 0;
    onPositionChange(newPosition);
  };

  return (
    <div className="absolute right-4 bottom-4 bg-black/75 text-white p-4 rounded-lg font-mono">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="w-8">X:</label>
          <input
            type="number"
            value={position.x.toFixed(3)}
            onChange={(e) => handleChange('x', e.target.value)}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8">Y:</label>
          <input
            type="number"
            value={position.y.toFixed(3)}
            onChange={(e) => handleChange('y', e.target.value)}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right"
            step="0.1"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="w-8">Z:</label>
          <input
            type="number"
            value={position.z.toFixed(3)}
            onChange={(e) => handleChange('z', e.target.value)}
            className="bg-gray-800 px-2 py-1 rounded w-24 text-right"
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
};

const VertexPoints = ({ geometry, object }) => {
  const { editMode, selectedElements, startVertexDrag } = useSceneStore();
  const positions = geometry.attributes.position;
  const vertices = [];
  const worldMatrix = object.matrixWorld;
  
  for (let i = 0; i < positions.count; i++) {
    const vertex = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    ).applyMatrix4(worldMatrix);
    vertices.push(vertex);
  }

  return editMode === 'vertex' ? (
    <group>
      {vertices.map((vertex, i) => (
        <mesh
          key={i}
          position={vertex}
          onClick={(e) => {
            e.stopPropagation();
            if (editMode === 'vertex') {
              startVertexDrag(i, vertex);
            }
          }}
        >
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial
            color={selectedElements.vertices.includes(i) ? 'red' : 'yellow'}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  ) : null;
};

const EditModeOverlay = () => {
  const { scene, camera, raycaster, pointer } = useThree();
  const { 
    selectedObject, 
    editMode,
    setSelectedElements,
    draggedVertex,
    updateVertexDrag,
    endVertexDrag
  } = useSceneStore();
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh)) return;

    const handlePointerMove = (event) => {
      if (draggedVertex) {
        // Update plane normal to face camera
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        plane.current.normal.copy(cameraDirection);
        plane.current.setFromNormalAndCoplanarPoint(
          cameraDirection,
          draggedVertex.position
        );

        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
          // Transform the intersection point to object space
          const worldMatrix = selectedObject.matrixWorld;
          const inverseMatrix = new THREE.Matrix4().copy(worldMatrix).invert();
          const localPosition = intersection.current.clone().applyMatrix4(inverseMatrix);
          updateVertexDrag(localPosition);
        }
      }
    };

    const handlePointerUp = () => {
      if (draggedVertex) {
        endVertexDrag();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [
    selectedObject,
    editMode,
    camera,
    raycaster,
    pointer,
    setSelectedElements,
    draggedVertex,
    updateVertexDrag,
    endVertexDrag
  ]);

  if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh)) return null;

  return <VertexPoints geometry={selectedObject.geometry} object={selectedObject} />;
};

const Scene: React.FC = () => {
  const { objects, selectedObject, setSelectedObject, transformMode, editMode, draggedVertex, selectedElements, updateVertexDrag } = useSceneStore();
  const [selectedPosition, setSelectedPosition] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (editMode === 'vertex' && selectedObject instanceof THREE.Mesh) {
      if (draggedVertex) {
        setSelectedPosition(draggedVertex.position);
      } else if (selectedElements.vertices.length > 0) {
        const geometry = selectedObject.geometry;
        const positions = geometry.attributes.position;
        const vertexIndex = selectedElements.vertices[0];
        const position = new THREE.Vector3(
          positions.getX(vertexIndex),
          positions.getY(vertexIndex),
          positions.getZ(vertexIndex)
        );
        position.applyMatrix4(selectedObject.matrixWorld);
        setSelectedPosition(position);
      } else {
        setSelectedPosition(null);
      }
    } else {
      setSelectedPosition(null);
    }
  }, [editMode, selectedObject, draggedVertex, selectedElements.vertices]);

  const handlePositionChange = (newPosition: THREE.Vector3) => {
    if (selectedObject instanceof THREE.Mesh) {
      updateVertexDrag(newPosition);
    }
  };

  return (
    <div className="relative w-full h-full">
      <Canvas
        camera={{ position: [5, 5, 5], fov: 75 }}
        className="w-full h-full bg-gray-900"
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Grid
          infiniteGrid
          cellSize={1}
          sectionSize={3}
          fadeDistance={30}
          fadeStrength={1}
        />

        {objects.map(({ object, visible, id }) => (
          visible && (
            <primitive
              key={id}
              object={object}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedObject(object);
              }}
            />
          )
        ))}

        {selectedObject && transformMode && (
          <TransformControls
            object={selectedObject}
            mode={transformMode}
          />
        )}

        <EditModeOverlay />
        <OrbitControls makeDefault />
      </Canvas>
      {editMode === 'vertex' && selectedPosition && (
        <VertexCoordinates 
          position={selectedPosition}
          onPositionChange={handlePositionChange}
        />
      )}
    </div>
  );
};

export default Scene;