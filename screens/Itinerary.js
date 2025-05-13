// screens/Itinerary.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  FlatList, 
  Text, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { db, auth } from '../utils/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  deleteDoc,
  orderBy 
} from 'firebase/firestore';

export default function Itinerary({ route, navigation }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { tripId } = route.params || {};
  
  // Load itinerary items when component mounts
  useEffect(() => {
    if (!tripId || !auth.currentUser) {
      navigation.navigate('Dashboard');
      return;
    }
    
    const q = query(
      collection(db, "itinerary"),
      where("tripId", "==", tripId),
      orderBy("date", "asc"),
      orderBy("createdAt", "asc")
    );
    
    setIsLoading(true);
    
    // Set up real-time listener for itinerary items
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const itineraryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setItems(itineraryData);
        setError(null);
      } catch (err) {
        console.error("Error processing itinerary:", err);
        setError("Failed to load itinerary");
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Error in itinerary snapshot:", err);
      setError("Failed to load itinerary");
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [tripId]);

  const addItem = async () => {
    if (!text.trim()) {
      Alert.alert("Error", "Please enter an activity");
      return;
    }
    
    try {
      await addDoc(collection(db, "itinerary"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        tripId,
        text: text.trim(),
        date: date.trim() || 'No date specified',
        createdAt: new Date()
      });
      
      setText('');
      setDate('');
    } catch (error) {
      console.error("Error adding itinerary item:", error);
      Alert.alert("Error", "Failed to save activity");
    }
  };
  
  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, "itinerary", id));
      Alert.alert("Success", "Activity deleted");
    } catch (error) {
      console.error("Error deleting activity:", error);
      Alert.alert("Error", "Failed to delete activity");
    }
  };
  
  // Confirm before deleting
  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Activity",
      "Are you sure you want to delete this activity?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteItem(id), style: "destructive" }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading itinerary...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => navigation.replace('Itinerary', { tripId })} />
      </View>
    );
  }

  // Group items by date
  const groupedItems = items.reduce((groups, item) => {
    const date = item.date || 'No date specified';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});
  
  // Convert to array for FlatList
  const groupedData = Object.keys(groupedItems).map(date => ({
    date,
    data: groupedItems[date],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Add activity" 
          value={text} 
          onChangeText={setText} 
          style={styles.input}
          accessibilityLabel="Activity description input"
        />
        <TextInput 
          placeholder="Date (e.g., May 10)" 
          value={date} 
          onChangeText={setDate} 
          style={styles.input}
          accessibilityLabel="Activity date input"
        />
        <Button title="Add" onPress={addItem} />
      </View>
      
      <FlatList
        data={groupedData}
        keyExtractor={item => item.date}
        renderItem={({ item }) => (
          <View style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{item.date}</Text>
            {item.data.map(activity => (
              <TouchableOpacity 
                key={activity.id}
                style={styles.activityItem}
                onLongPress={() => confirmDelete(activity.id)}
              >
                <Text>{activity.text}</Text>
                <Text style={styles.addedBy}>
                  Added by {activity.userName || 'User'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No activities added yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center'
  },
  inputContainer: {
    marginBottom: 20
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    marginBottom: 10, 
    padding: 10,
    borderRadius: 5
  },
  dateGroup: {
    marginBottom: 15
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5
  },
  activityItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  addedBy: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666'
  }
});