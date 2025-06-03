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

const VertexCountSelector = () => {
  const { selectedObject, updateCylinderVertices, updateSphereVertices } = useSceneStore();

  if (!(selectedObject instanceof THREE.Mesh)) {
    return null;
  }

  const isCylinder = selectedObject.geometry instanceof THREE.CylinderGeometry;
  const isSphere = selectedObject.geometry instanceof THREE.SphereGeometry;

  if (!isCylinder && !isSphere) {
    return null;
  }

  let currentVertexCount;
  let options;
  let onChange;

  if (isCylinder) {
    currentVertexCount = selectedObject.geometry.parameters.radialSegments;
    options = [
      { value: 32, label: '32 Vertices' },
      { value: 16, label: '16 Vertices' },
      { value: 8, label: '8 Vertices' }
    ];
    onChange = updateCylinderVertices;
  } else {
    currentVertexCount = selectedObject.geometry.parameters.widthSegments;
    options = [
      { value: 64, label: '64 Vertices' },
      { value: 32, label: '32 Vertices' },
      { value: 16, label: '16 Vertices' },
      { value: 8, label: '8 Vertices' }
    ];
    onChange = updateSphereVertices;
  }

  return (
    <div className="absolute left-1/2 top-4 -translate-x-1/2 bg-black/75 text-white p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Vertex Count:</label>
        <select
          className="bg-gray-800 px-3 py-1.5 rounded text-sm"
          onChange={(e) => onChange(parseInt(e.target.value))}
          value={currentVertexCount}
        >
          {options.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
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

const EdgeLines = ({ geometry, object }) => {
  const { editMode, selectedElements, startEdgeDrag } = useSceneStore();
  const positions = geometry.attributes.position;
  const edges = [];
  const worldMatrix = object.matrixWorld;

  // Get indices from the geometry
  const index = geometry.index;
  if (!index) return null;

  // Create edges from triangles
  for (let i = 0; i < index.count; i += 3) {
    const a = index.array[i];
    const b = index.array[i + 1];
    const c = index.array[i + 2];
    
    // Add edges (avoiding duplicates)
    edges.push([a, b]);
    edges.push([b, c]);
    edges.push([c, a]);
  }

  // Remove duplicate edges
  const uniqueEdges = Array.from(new Set(edges.map(edge => 
    edge.slice().sort().join(',')
  ))).map(edge => edge.split(',').map(Number));

  return editMode === 'edge' ? (
    <group>
      {uniqueEdges.map(([start, end], i) => {
        const startPos = new THREE.Vector3(
          positions.getX(start),
          positions.getY(start),
          positions.getZ(start)
        ).applyMatrix4(worldMatrix);

        const endPos = new THREE.Vector3(
          positions.getX(end),
          positions.getY(end),
          positions.getZ(end)
        ).applyMatrix4(worldMatrix);

        const isSelected = selectedElements.edges.includes(i);

        return (
          <group key={i}>
            <line
              onClick={(e) => {
                e.stopPropagation();
                if (editMode === 'edge') {
                  startEdgeDrag([start, end], [startPos, endPos]);
                  useSceneStore.getState().setSelectedElements('edges', [i]);
                }
              }}
            >
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    startPos.x, startPos.y, startPos.z,
                    endPos.x, endPos.y, endPos.z
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color={isSelected ? 'red' : 'yellow'} linewidth={2} />
            </line>
            {isSelected && (
              <>
                <mesh position={startPos}>
                  <sphereGeometry args={[0.03]} />
                  <meshBasicMaterial color="red" />
                </mesh>
                <mesh position={endPos}>
                  <sphereGeometry args={[0.03]} />
                  <meshBasicMaterial color="red" />
                </mesh>
              </>
            )}
          </group>
        );
      })}
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
    draggedEdge,
    updateVertexDrag,
    updateEdgeDrag,
    endVertexDrag,
    endEdgeDrag
  } = useSceneStore();
  const plane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh)) return;

    const handlePointerMove = (event) => {
      if (draggedVertex || draggedEdge) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        plane.current.normal.copy(cameraDirection);
        plane.current.setFromNormalAndCoplanarPoint(
          cameraDirection,
          draggedVertex ? draggedVertex.position : draggedEdge.positions[0]
        );

        raycaster.setFromCamera(pointer, camera);
        if (raycaster.ray.intersectPlane(plane.current, intersection.current)) {
          const worldMatrix = selectedObject.matrixWorld;
          const inverseMatrix = new THREE.Matrix4().copy(worldMatrix).invert();
          const localPosition = intersection.current.clone().applyMatrix4(inverseMatrix);
          
          if (draggedVertex) {
            updateVertexDrag(localPosition);
          } else if (draggedEdge) {
            updateEdgeDrag(localPosition);
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (draggedVertex) {
        endVertexDrag();
      }
      if (draggedEdge) {
        endEdgeDrag();
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
    draggedEdge,
    updateVertexDrag,
    updateEdgeDrag,
    endVertexDrag,
    endEdgeDrag
  ]);

  if (!selectedObject || !editMode || !(selectedObject instanceof THREE.Mesh)) return null;

  return (
    <>
      <VertexPoints geometry={selectedObject.geometry} object={selectedObject} />
      <EdgeLines geometry={selectedObject.geometry} object={selectedObject} />
    </>
  );
};

const Scene: React.FC = () => {
  const { objects, selectedObject, setSelectedObject, transformMode, editMode, draggedVertex, draggedEdge, selectedElements, updateVertexDrag } = useSceneStore();
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
      {editMode === 'vertex' && selectedObject && !(selectedObject.geometry instanceof THREE.ConeGeometry) && (
        <VertexCountSelector />
      )}
    </div>
  );
};

export default Scene;