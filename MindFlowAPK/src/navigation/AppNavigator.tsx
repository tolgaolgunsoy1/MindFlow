// src/navigation/AppNavigator.tsx

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import useAuthStore from '../store/authStore';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ProjectListScreen from '../screens/ProjectListScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import EditorScreen from '../screens/EditorScreen';
import NotificationScreen from '../screens/NotificationScreen';
import TimelineScreen from '../screens/TimelineScreen';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ProjectList: undefined;
  Templates: undefined;
  Editor: { mapId: string };
  Notifications: undefined;
  Timeline: { mapId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { user, initialized, actions } = useAuthStore();

  useEffect(() => {
    const unsubscribe = actions.initializeAuth();
    return unsubscribe;
  }, []);

  if (!initialized) {
    // Show loading screen while checking auth state
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "ProjectList" : "Login"}
        screenOptions={{
          headerShown: false, // We use custom headers
        }}
      >
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                title: 'Giriş Yap',
              }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{
                title: 'Kayıt Ol',
              }}
            />
          </>
        ) : (
          // Main app screens
          <>
            <Stack.Screen
              name="ProjectList"
              component={ProjectListScreen}
              options={{
                title: 'MindFlow Projeleri',
              }}
            />
            <Stack.Screen
              name="Templates"
              component={TemplatesScreen}
              options={{
                title: 'Şablonlar',
              }}
            />
            <Stack.Screen
              name="Editor"
              component={EditorScreen}
              options={{
                title: 'MindFlow Editor',
              }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationScreen}
              options={{
                title: 'Bildirimler',
              }}
            />
            <Stack.Screen
              name="Timeline"
              component={TimelineScreen}
              options={{
                title: 'Zaman Çizelgesi',
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;