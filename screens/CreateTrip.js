// screens/CreateTrip.js
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  Text,
  ActivityIndicator 
} from 'react-native';
import { db, auth } from '../utils/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export default function CreateTrip({ navigation }) {
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate a random 6-character code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!tripName.trim()) {
      Alert.alert("Error", "Please enter a trip name");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const inviteCode = generateInviteCode();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("You must be logged in to create a trip");
      }
      
      const tripData = {
        name: tripName.trim(),
        inviteCode,
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || currentUser.email || 'User',
        members: [currentUser.uid],
        createdAt: new Date()
      };
      
      // Add optional dates if provided
      if (startDate.trim()) {
        tripData.startDate = startDate.trim();
      }
      
      if (endDate.trim()) {
        tripData.endDate = endDate.trim();
      }
      
      const tripRef = await addDoc(collection(db, "trips"), tripData);
      
      Alert.alert(
        "Success", 
        `Trip created with invite code: ${inviteCode}\n\nShare this code with your travel companions!`,
        [
          { text: "OK", onPress: () => navigation.navigate('Dashboard') }
        ]
      );
    } catch (error) {
      console.error("Error creating trip:", error);
      setError("Failed to create trip. Please try again.");
      Alert.alert("Error", "Failed to create trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Trip</Text>
      
      <TextInput 
        placeholder="Trip Name" 
        value={tripName} 
        onChangeText={setTripName} 
        style={styles.input}
        accessibilityLabel="Trip name input"
      />
      
      <TextInput 
        placeholder="Start Date (optional)" 
        value={startDate} 
        onChangeText={setStartDate} 
        style={styles.input}
        accessibilityLabel="Trip start date input"
      />
      
      <TextInput 
        placeholder="End Date (optional)" 
        value={endDate} 
        onChangeText={setEndDate} 
        style={styles.input}
        accessibilityLabel="Trip end date input"
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button 
          title="Create Trip" 
          onPress={handleCreate} 
          disabled={loading} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc',
    padding: 15, 
    marginBottom: 15,
    borderRadius: 5
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center'
  },
  loader: {
    marginVertical: 20
  }
});