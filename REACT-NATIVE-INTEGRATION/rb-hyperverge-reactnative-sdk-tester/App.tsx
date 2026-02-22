/**
 * RB-HYPERVERGE-RN-SDK-TESTER
 * React Native HyperVerge SDK Integration Tester
 * Connected to unified backend: https://unified-backend-for-all-sdks-d76nz9uok.vercel.app
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import InputScreen from './src/screens/InputScreen';
import ResultsDashboardScreen from './src/screens/ResultsDashboardScreen';

type RootStackParamList = {
  Input: undefined;
  Results: {sdkResponse: any; transactionId: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Input"
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#0f1117'},
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="Input" component={InputScreen} />
        <Stack.Screen name="Results" component={ResultsDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
