// screens/Expenses.js
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

export default function Expenses({ route, navigation }) {
  const [expenses, setExpenses] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  
  const { tripId } = route.params || {};
  
  // Validate inputs
  const validateInputs = () => {
    if (!desc.trim()) {
      Alert.alert("Error", "Please enter a description");
      return false;
    }
    
    if (!amount.trim()) {
      Alert.alert("Error", "Please enter an amount");
      return false;
    }
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }
    
    return true;
  };

  // Load expenses when component mounts
  useEffect(() => {
    if (!tripId || !auth.currentUser) {
      navigation.navigate('Dashboard');
      return;
    }
    
    const user = auth.currentUser;
    
    const q = query(
      collection(db, "expenses"),
      where("tripId", "==", tripId),
      orderBy("createdAt", "desc")
    );
    
    setIsLoading(true);
    
    // Set up real-time listener for expenses
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setExpenses(expenseData);
        
        // Calculate total
        const expenseTotal = expenseData.reduce((sum, expense) => 
          sum + (parseFloat(expense.amount) || 0), 0);
        setTotal(expenseTotal.toFixed(2));
        
        setError(null);
      } catch (err) {
        console.error("Error processing expenses:", err);
        setError("Failed to load expenses");
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
      console.error("Error in expenses snapshot:", err);
      setError("Failed to load expenses");
      setIsLoading(false);
    });
    
    // Clean up listener on unmount
    return () => unsubscribe();
  }, [tripId]);

  const addExpense = async () => {
    if (!validateInputs()) return;
    
    try {
      await addDoc(collection(db, "expenses"), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'User',
        tripId,
        desc: desc.trim(),
        amount: parseFloat(amount),
        createdAt: new Date()
      });
      
      setDesc('');
      setAmount('');
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to save expense");
    }
  };
  
  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, "expenses", id));
      Alert.alert("Success", "Expense deleted");
    } catch (error) {
      console.error("Error deleting expense:", error);
      Alert.alert("Error", "Failed to delete expense");
    }
  };
  
  // Confirm before deleting
  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteExpense(id), style: "destructive" }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button title="Try Again" onPress={() => navigation.replace('Expenses', { tripId })} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Description" 
          value={desc} 
          onChangeText={setDesc} 
          style={styles.input}
          accessibilityLabel="Expense description input"
        />
        <TextInput 
          placeholder="Amount" 
          value={amount} 
          onChangeText={setAmount} 
          keyboardType="numeric" 
          style={styles.input}
          accessibilityLabel="Expense amount input"
        />
        <Button title="Add Expense" onPress={addExpense} />
      </View>
      
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Total: ${total}</Text>
      </View>
      
      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.expenseItem}
            onLongPress={() => confirmDelete(item.id)}
          >
            <View style={styles.expenseDetails}>
              <Text style={styles.expenseDesc}>{item.desc}</Text>
              <Text style={styles.expenseUser}>
                Added by {item.userName || 'User'}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>${parseFloat(item.amount).toFixed(2)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses added yet</Text>
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
  totalContainer: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 15
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  expenseItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  expenseDetails: {
    flex: 1
  },
  expenseDesc: {
    fontSize: 16
  },
  expenseUser: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666'
  }
});