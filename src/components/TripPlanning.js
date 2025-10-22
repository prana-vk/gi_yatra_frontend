import React, { useState } from 'react';
import TripsList from './TripsList';
import TripPlanner from './TripPlannerNew';
import '../styles/TripPlanning.css';

function TripPlanning() {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [editingTrip, setEditingTrip] = useState(null);
  const [refreshList, setRefreshList] = useState(0);

  const handleCreateNew = () => {
    setEditingTrip(null);
    setCurrentView('create');
  };

  const handleEditTrip = (trip) => {
    setEditingTrip(trip);
    setCurrentView('edit');
  };

  const handleTripSaved = () => {
    setRefreshList(prev => prev + 1);
    setCurrentView('list');
    setEditingTrip(null);
  };

  const handleCancel = () => {
    setCurrentView('list');
    setEditingTrip(null);
  };

  return (
    <div className="trip-planning-main">
      {currentView === 'list' && (
        <TripsList 
          key={refreshList}
          onCreateNew={handleCreateNew}
          onEditTrip={handleEditTrip}
        />
      )}
      
      {(currentView === 'create' || currentView === 'edit') && (
        <TripPlanner 
          editingTrip={editingTrip}
          onTripSaved={handleTripSaved}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

export default TripPlanning;