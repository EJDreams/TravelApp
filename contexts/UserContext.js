// contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../utils/firebaseConfig';
import { doc, getDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

// Create the context
const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [userTrips, setUserTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [tripsLoading, setTripsLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    
    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Fetch user's trips when user changes
  useEffect(() => {
    let unsubscribe = () => {};
    
    if (currentUser) {
      setTripsLoading(true);
      
      const tripsQuery = query(
        collection(db, "trips"),
        where("members", "array-contains", currentUser.uid)
      );
      
      unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
        const trips = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUserTrips(trips);
        
        // If we have trips but no current trip selected, select the first one
        if (trips.length > 0 && !currentTrip) {
          setCurrentTrip(trips[0]);
        }
        
        setTripsLoading(false);
      }, (error) => {
        console.error("Error fetching trips:", error);
        setTripsLoading(false);
      });
    } else {
      // Reset trips when user logs out
      setUserTrips([]);
      setCurrentTrip(null);
      setTripsLoading(false);
    }
    
    // Clean up subscription
    return () => unsubscribe();
  }, [currentUser]);

  // Update overall loading state
  useEffect(() => {
    setLoading(authLoading || tripsLoading);
  }, [authLoading, tripsLoading]);

  // Function to select a trip
  const selectTrip = (trip) => {
    setCurrentTrip(trip);
  };

  // Values to be provided by the context
  const value = {
    currentUser,
    currentTrip,
    userTrips,
    loading,
    selectTrip,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};