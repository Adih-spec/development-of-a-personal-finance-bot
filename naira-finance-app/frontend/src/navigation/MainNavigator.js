/**
 * src/navigation/MainNavigator.js
 * Bottom tab navigator + stack screens
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { COLORS, FONTS } from '../styles/theme';

// Tab screens
import DashboardScreen  from '../screens/Dashboard/DashboardScreen';
import TransactionStack from './TransactionStack';
import BudgetStack      from './BudgetStack';
import SavingsStack     from './SavingsStack';
import MoreStack        from './MoreStack';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, focused }) => {
  const icons = {
    Dashboard:    '🏠',
    Transactions: '💳',
    Budget:       '📊',
    Savings:      '🐷',
    More:         '⋯',
  };
  return (
    <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.6 }}>
      {icons[name] || '•'}
    </Text>
  );
};

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor:  COLORS.border,
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: {
        fontSize: FONTS.sizes.xs,
        fontWeight: FONTS.weights.medium,
      },
    })}
  >
    <Tab.Screen name="Dashboard"    component={DashboardScreen} />
    <Tab.Screen name="Transactions" component={TransactionStack} />
    <Tab.Screen name="Budget"       component={BudgetStack} />
    <Tab.Screen name="Savings"      component={SavingsStack} />
    <Tab.Screen name="More"         component={MoreStack} />
  </Tab.Navigator>
);

export default MainNavigator;
