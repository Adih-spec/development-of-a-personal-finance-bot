import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../styles/theme';
import BudgetListScreen from '../screens/Budget/BudgetListScreen';
import AddBudgetScreen  from '../screens/Budget/AddBudgetScreen';

const Stack = createNativeStackNavigator();
const h = { headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: '700' } };

const BudgetStack = () => (
  <Stack.Navigator screenOptions={h}>
    <Stack.Screen name="BudgetList" component={BudgetListScreen} options={{ title: 'Budgets' }} />
    <Stack.Screen name="AddBudget"  component={AddBudgetScreen}  options={{ title: 'Set Budget' }} />
  </Stack.Navigator>
);

export default BudgetStack;
