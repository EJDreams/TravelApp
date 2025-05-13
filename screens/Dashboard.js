// screens/Dashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { auth, db } from '../utils/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function Dashboard({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch user's trips on component mount
  useEffect(() => {
    fetchUserTrips();
  }, []);
  
  // Fetch all trips the user is a member of
  const fetchUserTrips = async () => {
    if (!auth.currentUser) {
      navigation.replace('Auth');
      return;
    }
    
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      const tripsQuery = query(
        collection(db, "trips"),
        where("members", "array-contains", userId)
      );
      
      const querySnapshot = await getDocs(tripsQuery);
      const userTrips = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTrips(userTrips);
      
      // If user has trips, set the first one as current
      if (userTrips.length > 0) {
        setCurrentTrip(userTrips[0]);
      }
    } catch (error) {
      console.error("Error fetching trips:", error);
      Alert.alert("Error", "Failed to load your trips");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    auth.signOut()
      .then(() => navigation.replace('Auth'))
      .catch(error => {
        console.log(error.message);
        Alert.alert("Error", "Failed to sign out");
      });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentTrip ? (
        <>
          <Text style={styles.title}>Welcome to {currentTrip.name || 'your trip'}!</Text>
          <View style={styles.buttonContainer}>
            <Button 
              title="View Itinerary" 
              onPress={() => navigation.navigate('Itinerary', { tripId: currentTrip.id })} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Expenses" 
              onPress={() => navigation.navigate('Expenses', { tripId: currentTrip.id })} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Packing List" 
              onPress={() => navigation.navigate('PackingList', { tripId: currentTrip.id })} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Join Another Trip" 
              onPress={() => navigation.navigate('JoinTrip')} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Create New Trip" 
              onPress={() => navigation.navigate('CreateTrip')} 
            />
            <View style={styles.buttonSpacer} />
            <Button 
              title="Sign Out" 
              onPress={handleSignOut} 
              color="red" 
            />
          </View>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You don't have any trips yet.</Text>
          <View style={styles.buttonSpacer} />
          <Button 
            title="Create Trip" 
            onPress={() => navigation.navigate('CreateTrip')} 
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Join a Trip" 
            onPress={() => navigation.navigate('JoinTrip')} 
          />
          <View style={styles.buttonSpacer} />
          <Button 
            title="Sign Out" 
            onPress={handleSignOut} 
            color="red" 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10
  },
  title: { 
    fontSize: 22, 
    marginBottom: 20, 
    textAlign: 'center',
    fontWeight: 'bold'
  },
  buttonContainer: { 
    width: '100%' 
  },
  buttonSpacer: {
    height: 10
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center'
  }
});