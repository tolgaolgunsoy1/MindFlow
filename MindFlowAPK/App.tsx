import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import useOfflineStore from './src/store/offlineStore';

export default function App() {
  const { actions: offlineActions } = useOfflineStore();

  useEffect(() => {
    offlineActions.loadOfflineData();
  }, []);

  return (
    <>
      <AppNavigator />
      <StatusBar style="auto" />
    </>
  );
}