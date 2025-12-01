import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import FirebaseService from './src/services/firebase';
import useOfflineStore from './src/store/offlineStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const App = () => {
  const { actions: offlineActions } = useOfflineStore();

  useEffect(() => {
    // Load offline data on app start
    offlineActions.loadOfflineData();
  }, []);

  // Initialize Firebase, etc.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

export default App;
