import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../styles/theme';
import SavingsListScreen  from '../screens/Savings/SavingsListScreen';
import AddSavingsScreen   from '../screens/Savings/AddSavingsScreen';
import SavingsDetailScreen from '../screens/Savings/SavingsDetailScreen';

const Stack = createNativeStackNavigator();
const h = { headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: '700' } };

const SavingsStack = () => (
  <Stack.Navigator screenOptions={h}>
    <Stack.Screen name="SavingsList"   component={SavingsListScreen}   options={{ title: 'Savings Goals' }} />
    <Stack.Screen name="AddSavings"    component={AddSavingsScreen}    options={{ title: 'New Goal' }} />
    <Stack.Screen name="SavingsDetail" component={SavingsDetailScreen} options={{ title: 'Goal Details' }} />
  </Stack.Navigator>
);

export default SavingsStack;
