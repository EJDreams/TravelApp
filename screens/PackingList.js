// screens/PackingList.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Button, 
  FlatList, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { db, auth } from '../utils/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';

export default function PackingList({ route, navigation }) {
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { tripId } = route.params || {};
  
  // Load packing items when component mounts
  useEffect(() => {
    if (!tripId || !auth.currentUser) {
      navigation.navigate('Dashboard');
      return;
    }
    
    const q = query(
      collection(db, "packingList"),
      where("tripId", "==", tripId)
    );
    
    setIsLoading(true);
    
    // Set up real-time listener for packing items
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const packingData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setItems(packingData);
        setError(null);
      } catch (err) {
        console.error("Error processing packing list:", err);
        setError("Failed to load packing list");
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Error in packing list snapshot:", err);
      setError("Failed to load packing list");
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [tripId]);

  const addItem = async () => {
    if (!text.trim()) {
      Alert.alert("Error", "Please enter an item");
      return;
    }
    
    try {
      await addDoc(collection(db, "packingList"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        tripId,
        text: text.trim(),
        category: category.trim() || 'General',
        packed: false,
        createdAt: new Date()
      });
      
      setText('');
      setCategory('');
    } catch (error) {
      console.error("Error adding packing item:", error);
      Alert.alert("Error", "Failed to save item");
    }
  };
  
  const togglePacked = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, "packingList", id), {
        packed: !currentStatus
      });
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item status");
    }
  };
  
  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, "packingList", id));
      Alert.alert("Success", "Item deleted");
    } catch (error) {
      console.error("Error deleting item:", error);
      Alert.alert("Error", "Failed to delete item");
    }
  };
  
  // Confirm before deleting
  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
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
        <Text style={styles.loadingText}>Loading packing list...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => navigation.replace('PackingList', { tripId })} />
      </View>
    );
  }

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    const category = item.category || 'General';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});
  
  // Convert to array for FlatList
  const groupedData = Object.keys(groupedItems).map(category => ({
    category,
    data: groupedItems[category],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Add item" 
          value={text} 
          onChangeText={setText} 
          style={styles.input}
          accessibilityLabel="Packing item input"
        />
        <TextInput 
          placeholder="Category (optional)" 
          value={category} 
          onChangeText={setCategory} 
          style={styles.input}
          accessibilityLabel="Item category input"
        />
        <Button title="Add" onPress={addItem} />
      </View>
      
      <FlatList
        data={groupedData}
        keyExtractor={item => item.category}
        renderItem={({ item }) => (
          <View style={styles.categoryGroup}>
            <Text style={styles.categoryHeader}>{item.category}</Text>
            {item.data.map(packingItem => (
              <TouchableOpacity 
                key={packingItem.id}
                style={styles.packingItem}
                onPress={() => togglePacked(packingItem.id, packingItem.packed)}
                onLongPress={() => confirmDelete(packingItem.id)}
              >
                <Text style={[
                  styles.itemText,
                  packingItem.packed && styles.packedText
                ]}>
                  {packingItem.text}
                </Text>
                <Text style={styles.addedBy}>
                  Added by {packingItem.userName || 'User'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No items added yet</Text>
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
  categoryGroup: {
    marginBottom: 15
  },
  categoryHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5
  },
  packingItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee'
  },
  itemText: {
    fontSize: 16
  },
  packedText: {
    textDecorationLine: 'line-through',
    color: 'gray'
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