import React from 'react';
import Scene from './components/Scene';
import Toolbar from './components/Toolbar';
import LayersPanel from './components/LayersPanel';
import ObjectProperties from './components/ObjectProperties';
import EditControls from './components/EditControls';

function App() {
  return (
    <div className="w-full h-screen relative">
      <Scene />
      <Toolbar />
      <LayersPanel />
      <ObjectProperties />
      <EditControls />
    </div>
  );
}

export default App;