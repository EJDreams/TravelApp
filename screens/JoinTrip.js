// screens/JoinTrip.js
import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  Text, 
  StyleSheet, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { db, auth } from '../utils/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore';

export default function JoinTrip({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateCode = (code) => {
    // Basic validation - code should be alphanumeric and 6+ characters
    return code.trim().length >= 6;
  };

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter a trip code");
      return;
    }
    
    if (!validateCode(code)) {
      Alert.alert("Error", "Invalid code format. Please check and try again.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Query trips collection for the code
      const tripQuery = query(
        collection(db, "trips"), 
        where("inviteCode", "==", code.trim())
      );
      
      const querySnapshot = await getDocs(tripQuery);
      
      if (querySnapshot.empty) {
        setError("Invalid trip code. Please try again.");
        Alert.alert("Error", "Invalid trip code. Please try again.");
        setLoading(false);
        return;
      }

      // Get the first matching trip
      const tripDoc = querySnapshot.docs[0];
      const tripId = tripDoc.id;
      const tripData = tripDoc.data();
      
      // Add the current user to the trip members
      const tripRef = doc(db, "trips", tripId);
      
      // Check if user is already a member
      if (tripData.members && tripData.members.includes(auth.currentUser.uid)) {
        Alert.alert("Info", "You are already a member of this trip");
        navigation.navigate('Dashboard');
        setLoading(false);
        return;
      }
      
      // Add user to trip members
      await updateDoc(tripRef, {
        members: arrayUnion(auth.currentUser.uid)
      });
      
      // Navigate to Dashboard after successfully joining
      Alert.alert(
        "Success", 
        `You've joined the trip: ${tripData.name || 'Trip'}`
      );
      
      navigation.navigate('Dashboard');
    } catch (error) {
      console.error("Error joining trip:", error);
      setError("Failed to join trip. Please try again.");
      Alert.alert("Error", "Failed to join trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Trip</Text>
      <Text style={styles.instruction}>Enter the invite code from your trip coordinator:</Text>
      
      <TextInput 
        value={code} 
        onChangeText={setCode} 
        style={styles.input}
        placeholder="Enter trip code"
        autoCapitalize="characters"
        autoCorrect={false}
        accessibilityLabel="Trip invite code input"
      />
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button 
          title="Join Trip" 
          onPress={handleJoin} 
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
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  instruction: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  input: { 
    borderWidth: 1, 
    width: '80%', 
    padding: 15, 
    marginVertical: 15,
    fontSize: 20,
    textAlign: 'center',
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