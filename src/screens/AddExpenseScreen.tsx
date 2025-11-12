import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Alert, Text, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Transaction } from '../types';
import { useExpenseStore } from '../store/useExpenseStore';

const CATEGORIES = ['UPI', 'Cash', 'Payment', 'Shopping', 'Food', 'Bills', 'Transport', 'Entertainment', 'Other'];

export default function AddExpenseScreen({ navigation, route }: any) {
  const add = useExpenseStore(s => s.add);
  const edit = useExpenseStore(s => s.edit);
  const transactions = useExpenseStore(s => s.transactions);

  // compute total balance from transactions
  const totalBalance = useMemo(() => {
    if (!transactions || transactions.length === 0) return 0;
    return transactions.reduce(
      (acc, t) => (t.type === 'debit' ? acc - (t.amount || 0) : acc + (t.amount || 0)),
      0
    );
  }, [transactions]);

  // validation schema uses totalBalance to prevent debit > available balance
  const validation = Yup.object().shape({
    amount: Yup.number()
      .typeError('Must be a number')
      .required('Required')
      .positive('Must be positive')
      .test(
        'sufficient-balance',
        'Insufficient balance for debit',
        function (value) {
          const { type } = this.parent as any;
          const amt = Number(value) || 0;
          if (type === 'debit') {
            // allow equal or less than totalBalance
            return amt <= totalBalance;
          }
          return true;
        }
      ),
    category: Yup.string().required('Required'),
    type: Yup.string().oneOf(['debit', 'credit'], 'Type must be "debit" or "credit"').required('Required'),
    date: Yup.string()
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
      .required('Required'),
    notes: Yup.string().max(500, 'Too long'),
  });

  const prefill: Partial<Transaction> | undefined = route?.params?.prefill;

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDate = (setFieldValue: any) => {
    if (tempDate) {
      const dateString = tempDate.toISOString().split('T')[0];
      setFieldValue('date', dateString);
      setShowDatePicker(false);
      setTempDate(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backButton}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>Add Expense</Text>

      <Formik
        initialValues={{
          amount: prefill?.amount ? String(prefill.amount) : '',
          category: prefill?.category || '',
          notes: prefill?.description || '',
          type: prefill?.type || 'debit',
          date: prefill?.date ? String(prefill.date).split('T')[0] : new Date().toISOString().split('T')[0],
        }}
        validationSchema={validation}
        onSubmit={async values => {
          const isoDate = new Date(values.date).toISOString();

          if (prefill && prefill.id) {
            const updated: Transaction = {
              id: prefill.id,
              amount: Number(values.amount),
              type: values.type as 'debit' | 'credit',
              date: new Date(values.date).toISOString(),
              description: values.notes,
              category: values.category,
              bank: prefill.bank,
              source: prefill.source || 'manual',
            };
            await edit(updated);
            Alert.alert('Success', 'Transaction updated');
            navigation.goBack();
            return;
          }

          const tx: Transaction = {
            id: `manual_${Date.now()}`,
            amount: Number(values.amount),
            type: values.type as 'debit' | 'credit',
            date: isoDate,
            description: values.notes,
            category: values.category,
            source: 'manual',
          };
          await add(tx);
          Alert.alert('Success', 'Expense added');
          navigation.goBack();
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
          <View style={styles.form}>
            {/* Amount Input */}
            <TextInput
              label="Amount"
              keyboardType="decimal-pad"
              value={values.amount}
              onChangeText={handleChange('amount')}
              onBlur={handleBlur('amount')}
              mode="outlined"
              style={styles.input}
              activeOutlineColor="#007AFF"
            />
            {touched.amount && errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

            {/* Category Dropdown */}
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', height: 56 }]}
              onPress={() => setShowCategoryDropdown(true)}
            >
              <Text style={{ color: values.category ? '#000' : '#999', fontSize: 16 }}>
                {values.category || 'Select Category'}
              </Text>
            </TouchableOpacity>
            {touched.category && errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}

            {/* Category Modal */}
            <Modal visible={showCategoryDropdown} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Category</Text>
                  <FlatList
                    data={CATEGORIES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={styles.categoryItem}
                        onPress={() => {
                          setFieldValue('category', item);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[styles.categoryText, item === values.category && { fontWeight: '700', color: '#007AFF' }]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  <Button mode="text" onPress={() => setShowCategoryDropdown(false)}>Close</Button>
                </View>
              </View>
            </Modal>

            {/* Type Input (dropdown) */}
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center', height: 56 }]}
              onPress={() => setShowTypeDropdown(true)}
            >
              <Text style={{ color: values.type ? '#000' : '#999', fontSize: 16 }}>
                {values.type || 'Select Type'}
              </Text>
            </TouchableOpacity>
            {touched.type && errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}

            {/* Type Modal */}
            <Modal visible={showTypeDropdown} transparent animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Type</Text>
                  <FlatList
                    data={['debit', 'credit']}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => {
                          setFieldValue('type', item);
                          setShowTypeDropdown(false);
                        }}
                      >
                        <Text style={[styles.categoryText, item === values.type && { fontWeight: '700', color: '#007AFF' }]}>
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                  <Button mode="text" onPress={() => setShowTypeDropdown(false)}>Close</Button>
                </View>
              </View>
            </Modal>

            {/* Date Picker */}
            <TouchableOpacity 
              style={[styles.input, { justifyContent: 'center', height: 56 }]}
              onPress={() => {
                setTempDate(new Date(values.date));
                setShowDatePicker(true);
              }}
            >
              <Text style={{ color: values.date ? '#000' : '#999', fontSize: 16 }}>
                {values.date || 'Select Date'}
              </Text>
            </TouchableOpacity>
            {touched.date && errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

            {showDatePicker && (
              <>
                <DateTimePicker
                  value={tempDate || new Date(values.date)}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
                <View style={styles.dateButtonContainer}>
                  <Button onPress={() => { setShowDatePicker(false); setTempDate(null); }}>Cancel</Button>
                  <Button onPress={() => confirmDate(setFieldValue)}>Confirm</Button>
                </View>
              </>
            )}

            {/* Notes Input */}
            <TextInput
              label="Notes (Optional)"
              value={values.notes}
              onChangeText={handleChange('notes')}
              onBlur={handleBlur('notes')}
              mode="outlined"
              style={styles.input}
              activeOutlineColor="#007AFF"
              multiline
              numberOfLines={4}
            />
            {touched.notes && errors.notes ? <Text style={styles.errorText}>{errors.notes}</Text> : null}

            <View style={styles.buttonContainer}>
              <Button mode="contained" onPress={() => handleSubmit()} style={styles.saveButton}>
                Save Expense
              </Button>
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    marginTop: 40,
    backgroundColor: '#f8f9fa'
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#000'
  },
  form: {
    marginBottom: 32
  },
  input: { 
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  errorText: { 
    color: '#FF3B30', 
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '80%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#000'
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  categoryText: {
    fontSize: 16,
    color: '#333'
  },
  typeItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  typeText: {
    fontSize: 16,
    color: '#333'
  },
  dateButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16
  },
  buttonContainer: {
    marginTop: 24
  },
  saveButton: {
    paddingVertical: 8
  }
});
