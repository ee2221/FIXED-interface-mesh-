import { create } from 'zustand';
import * as THREE from 'three';

type EditMode = 'vertex' | 'edge' | 'face' | 'normal' | null;

interface SceneState {
  objects: Array<{
    id: string;
    object: THREE.Object3D;
    name: string;
    visible: boolean;
  }>;
  selectedObject: THREE.Object3D | null;
  transformMode: 'translate' | 'rotate' | 'scale' | null;
  editMode: EditMode;
  selectedElements: {
    vertices: number[];
    edges: number[];
    faces: number[];
  };
  draggedVertex: {
    indices: number[];
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
  } | null;
  draggedEdge: {
    indices: number[][];
    positions: THREE.Vector3[];
    initialPositions: THREE.Vector3[];
    edgeIndices: number[];
  } | null;
  addObject: (object: THREE.Object3D, name: string) => void;
  removeObject: (id: string) => void;
  setSelectedObject: (object: THREE.Object3D | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale' | null) => void;
  setEditMode: (mode: EditMode) => void;
  toggleVisibility: (id: string) => void;
  updateObjectName: (id: string, name: string) => void;
  updateObjectProperties: () => void;
  updateObjectColor: (color: string) => void;
  updateObjectOpacity: (opacity: number) => void;
  setSelectedElements: (type: 'vertices' | 'edges' | 'faces', indices: number[]) => void;
  startVertexDrag: (index: number, position: THREE.Vector3) => void;
  updateVertexDrag: (position: THREE.Vector3) => void;
  endVertexDrag: () => void;
  startEdgeDrag: (vertexIndices: number[], positions: THREE.Vector3[], edgeIndex: number) => void;
  updateEdgeDrag: (position: THREE.Vector3) => void;
  endEdgeDrag: () => void;
  updateCylinderVertices: (vertexCount: number) => void;
  updateSphereVertices: (vertexCount: number) => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedObject: null,
  transformMode: null,
  editMode: null,
  selectedElements: {
    vertices: [],
    edges: [],
    faces: [],
  },
  draggedVertex: null,
  draggedEdge: null,

  addObject: (object, name) =>
    set((state) => ({
      objects: [...state.objects, { id: crypto.randomUUID(), object, name, visible: true }],
    })),

  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObject: state.objects.find((obj) => obj.id === id)?.object === state.selectedObject
        ? null
        : state.selectedObject,
    })),

  setSelectedObject: (object) => set({ selectedObject: object }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setEditMode: (mode) => set({ editMode: mode }),

  toggleVisibility: (id) =>
    set((state) => {
      const updatedObjects = state.objects.map((obj) =>
        obj.id === id ? { ...obj, visible: !obj.visible } : obj
      );
      
      const toggledObject = updatedObjects.find((obj) => obj.id === id);
      
      const newSelectedObject = (toggledObject && !toggledObject.visible && toggledObject.object === state.selectedObject)
        ? null
        : state.selectedObject;

      return {
        objects: updatedObjects,
        selectedObject: newSelectedObject,
      };
    }),

  updateObjectName: (id, name) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, name } : obj
      ),
    })),

  updateObjectProperties: () => set((state) => ({ ...state })),

  updateObjectColor: (color) => 
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.color.setStyle(color);
        material.needsUpdate = true;
      }
      return state;
    }),

  updateObjectOpacity: (opacity) =>
    set((state) => {
      if (state.selectedObject instanceof THREE.Mesh) {
        const material = state.selectedObject.material as THREE.MeshStandardMaterial;
        material.transparent = opacity < 1;
        material.opacity = opacity;
        material.needsUpdate = true;
      }
      return state;
    }),

  setSelectedElements: (type, indices) =>
    set((state) => ({
      selectedElements: {
        ...state.selectedElements,
        [type]: indices,
      },
    })),

  startVertexDrag: (index, position) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const overlappingIndices = [];
      const selectedPos = new THREE.Vector3(
        positions.getX(index),
        positions.getY(index),
        positions.getZ(index)
      );

      for (let i = 0; i < positions.count; i++) {
        const pos = new THREE.Vector3(
          positions.getX(i),
          positions.getY(i),
          positions.getZ(i)
        );
        if (pos.distanceTo(selectedPos) < 0.0001) {
          overlappingIndices.push(i);
        }
      }

      return {
        selectedElements: {
          ...state.selectedElements,
          vertices: overlappingIndices
        },
        draggedVertex: {
          indices: overlappingIndices,
          position: position.clone(),
          initialPosition: position.clone()
        }
      };
    }),

  updateVertexDrag: (position) =>
    set((state) => {
      if (!state.draggedVertex || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      
      state.draggedVertex.indices.forEach(index => {
        positions.setXYZ(
          index,
          position.x,
          position.y,
          position.z
        );
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return {
        draggedVertex: {
          ...state.draggedVertex,
          position: position.clone()
        }
      };
    }),

  endVertexDrag: () => set({ draggedVertex: null }),

  startEdgeDrag: (vertexIndices, positions, edgeIndex) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positionAttribute = geometry.attributes.position;
      const overlappingEdges = [];
      const allPositions = [];
      const edgeIndices = [edgeIndex];

      // Find all edges that share vertices with the selected edge
      for (let i = 0; i < positionAttribute.count; i += 3) {
        for (let j = 0; j < 3; j++) {
          const v1Index = i + j;
          const v2Index = i + ((j + 1) % 3);

          const v1 = new THREE.Vector3(
            positionAttribute.getX(v1Index),
            positionAttribute.getY(v1Index),
            positionAttribute.getZ(v1Index)
          );
          const v2 = new THREE.Vector3(
            positionAttribute.getX(v2Index),
            positionAttribute.getY(v2Index),
            positionAttribute.getZ(v2Index)
          );

          if ((vertexIndices.includes(v1Index) && vertexIndices.includes(v2Index)) ||
              (v1.distanceTo(positions[0]) < 0.0001 && v2.distanceTo(positions[1]) < 0.0001) ||
              (v1.distanceTo(positions[1]) < 0.0001 && v2.distanceTo(positions[0]) < 0.0001)) {
            overlappingEdges.push([v1Index, v2Index]);
            allPositions.push(v1.clone(), v2.clone());
            edgeIndices.push(overlappingEdges.length - 1);
          }
        }
      }

      return {
        selectedElements: {
          ...state.selectedElements,
          edges: edgeIndices
        },
        draggedEdge: {
          indices: overlappingEdges,
          positions: allPositions,
          initialPositions: positions.map(p => p.clone()),
          edgeIndices
        }
      };
    }),

  updateEdgeDrag: (position) =>
    set((state) => {
      if (!state.draggedEdge || !(state.selectedObject instanceof THREE.Mesh)) return state;

      const geometry = state.selectedObject.geometry;
      const positions = geometry.attributes.position;
      const offset = position.clone().sub(state.draggedEdge.initialPositions[0]);

      state.draggedEdge.indices.forEach(([v1, v2], index) => {
        const pos1 = state.draggedEdge.positions[index * 2].clone().add(offset);
        const pos2 = state.draggedEdge.positions[index * 2 + 1].clone().add(offset);

        positions.setXYZ(v1, pos1.x, pos1.y, pos1.z);
        positions.setXYZ(v2, pos2.x, pos2.y, pos2.z);
      });

      positions.needsUpdate = true;
      geometry.computeVertexNormals();

      return state;
    }),

  endEdgeDrag: () => set({ draggedEdge: null }),

  updateCylinderVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.CylinderGeometry)) {
        return state;
      }

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.CylinderGeometry(
        oldGeometry.parameters.radiusTop,
        oldGeometry.parameters.radiusBottom,
        oldGeometry.parameters.height,
        vertexCount,
        oldGeometry.parameters.heightSegments,
        oldGeometry.parameters.openEnded,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),

  updateSphereVertices: (vertexCount) =>
    set((state) => {
      if (!(state.selectedObject instanceof THREE.Mesh) || 
          !(state.selectedObject.geometry instanceof THREE.SphereGeometry)) {
        return state;
      }

      const oldGeometry = state.selectedObject.geometry;
      const newGeometry = new THREE.SphereGeometry(
        oldGeometry.parameters.radius,
        vertexCount,
        vertexCount / 2,
        oldGeometry.parameters.phiStart,
        oldGeometry.parameters.phiLength,
        oldGeometry.parameters.thetaStart,
        oldGeometry.parameters.thetaLength
      );

      state.selectedObject.geometry.dispose();
      state.selectedObject.geometry = newGeometry;

      return {
        ...state,
        selectedElements: {
          vertices: [],
          edges: [],
          faces: []
        }
      };
    }),
}));