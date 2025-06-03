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
            startVertexDrag(i, vertex);
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

  for (let i = 0; i < positions.count - 1; i++) {
    const v1 = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    ).applyMatrix4(worldMatrix);

    const v2 = new THREE.Vector3(
      positions.getX(i + 1),
      positions.getY(i + 1),
      positions.getZ(i + 1)
    ).applyMatrix4(worldMatrix);

    edges.push({ vertices: [i, i + 1], position: v1.clone().add(v2).multiplyScalar(0.5) });
  }

  return editMode === 'edge' ? (
    <group>
      {edges.map(({ vertices, position }, i) => {
        const points = vertices.map(v => new THREE.Vector3(
          positions.getX(v),
          positions.getY(v),
          positions.getZ(v)
        ).applyMatrix4(worldMatrix));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        return (
          <line
            key={i}
            geometry={geometry}
            onClick={(e) => {
              e.stopPropagation();
              startEdgeDrag(i, vertices, position);
            }}
          >
            <lineBasicMaterial
              color={selectedElements.edges.includes(i) ? 'red' : 'yellow'}
              linewidth={2}
            />
          </line>
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
        
        if (draggedVertex) {
          plane.current.setFromNormalAndCoplanarPoint(
            cameraDirection,
            draggedVertex.position
          );
        } else if (draggedEdge) {
          plane.current.setFromNormalAndCoplanarPoint(
            cameraDirection,
            draggedEdge.position
          );
        }

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
  const { objects, selectedObject, setSelectedObject, transformMode, editMode, draggedVertex, draggedEdge, selectedElements, updateVertexDrag, updateEdgeDrag } = useSceneStore();
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
    } else if (editMode === 'edge' && draggedEdge) {
      setSelectedPosition(draggedEdge.position);
    } else {
      setSelectedPosition(null);
    }
  }, [editMode, selectedObject, draggedVertex, draggedEdge, selectedElements.vertices]);

  const handlePositionChange = (newPosition: THREE.Vector3) => {
    if (draggedVertex) {
      updateVertexDrag(newPosition);
    } else if (draggedEdge) {
      updateEdgeDrag(newPosition);
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
      {selectedPosition && (editMode === 'vertex' || editMode === 'edge') && (
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