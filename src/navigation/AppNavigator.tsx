import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';
import BiometricSetupScreen from '../screens/BiometricSetupScreen';
import PasscodeScreen from '../screens/PasscodeScreen';


export type RootStackParamList = {
Splash: undefined;
Onboarding: undefined;
Dashboard: undefined;
AddExpense: { prefill?: Partial<any> } | undefined;
Transactions: undefined;
Biometric: undefined;
Passcode: undefined;
};


const Stack = createStackNavigator<RootStackParamList>();


const AppNavigator = () => {
return (
<NavigationContainer>
<Stack.Navigator screenOptions={{ headerShown: false }}>
<Stack.Screen name="Splash" component={SplashScreen} />
<Stack.Screen name="Onboarding" component={OnboardingScreen} />
<Stack.Screen name="Dashboard" component={DashboardScreen} />
<Stack.Screen name="AddExpense" component={AddExpenseScreen} />
<Stack.Screen name="Transactions" component={TransactionHistoryScreen} />
<Stack.Screen name="Biometric" component={BiometricSetupScreen} />
<Stack.Screen name="Passcode" component={PasscodeScreen} />
</Stack.Navigator>
</NavigationContainer>
);
};


export default AppNavigator;