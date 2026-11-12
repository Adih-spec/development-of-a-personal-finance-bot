import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../styles/theme';
import MoreMenuScreen     from '../screens/Profile/MoreMenuScreen';
import ProfileScreen      from '../screens/Profile/ProfileScreen';
import ReportsScreen      from '../screens/Reports/ReportsScreen';
import AjoListScreen      from '../screens/AjoEsusu/AjoListScreen';
import AddAjoScreen       from '../screens/AjoEsusu/AddAjoScreen';

const Stack = createNativeStackNavigator();
const h = { headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: '700' } };

const MoreStack = () => (
  <Stack.Navigator screenOptions={h}>
    <Stack.Screen name="MoreMenu"  component={MoreMenuScreen}  options={{ title: 'More' }} />
    <Stack.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'My Profile' }} />
    <Stack.Screen name="Reports"   component={ReportsScreen}   options={{ title: 'Reports' }} />
    <Stack.Screen name="AjoList"   component={AjoListScreen}   options={{ title: 'Ajo & Esusu' }} />
    <Stack.Screen name="AddAjo"    component={AddAjoScreen}    options={{ title: 'Record Contribution' }} />
  </Stack.Navigator>
);

export default MoreStack;
