import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../styles/theme';

import IncomeListScreen    from '../screens/Income/IncomeListScreen';
import AddIncomeScreen     from '../screens/Income/AddIncomeScreen';
import ExpenseListScreen   from '../screens/Expenses/ExpenseListScreen';
import AddExpenseScreen    from '../screens/Expenses/AddExpenseScreen';
import TransactionHomeScreen from '../screens/Income/TransactionHomeScreen';

const Stack = createNativeStackNavigator();

const headerStyle = {
  headerStyle:         { backgroundColor: COLORS.primary },
  headerTintColor:     COLORS.white,
  headerTitleStyle:    { fontWeight: '700' },
};

const TransactionStack = () => (
  <Stack.Navigator screenOptions={headerStyle}>
    <Stack.Screen name="TransactionHome" component={TransactionHomeScreen} options={{ title: 'Transactions' }} />
    <Stack.Screen name="IncomeList"      component={IncomeListScreen}      options={{ title: 'Income' }} />
    <Stack.Screen name="AddIncome"       component={AddIncomeScreen}       options={{ title: 'Add Income' }} />
    <Stack.Screen name="ExpenseList"     component={ExpenseListScreen}     options={{ title: 'Expenses' }} />
    <Stack.Screen name="AddExpense"      component={AddExpenseScreen}      options={{ title: 'Add Expense' }} />
  </Stack.Navigator>
);

export default TransactionStack;
