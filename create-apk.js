#!/usr/bin/env node

/**
 * MindFlow APK Oluşturma Scripti
 * Bu script Expo kullanarak APK oluşturmanıza yardımcı olur
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 MindFlow APK Oluşturma Aracı');
console.log('================================\n');

// Adım 1: Expo CLI kontrolü
console.log('📦 Adım 1: Expo CLI kontrol ediliyor...');
try {
    execSync('expo --version', { stdio: 'pipe' });
    console.log('✅ Expo CLI bulundu\n');
} catch (error) {
    console.log('❌ Expo CLI bulunamadı. Kuruluyor...');
    execSync('npm install -g @expo/cli', { stdio: 'inherit' });
    console.log('✅ Expo CLI kuruldu\n');
}

// Adım 2: Yeni Expo projesi oluştur
console.log('📱 Adım 2: MindFlowAPK projesi oluşturuluyor...');
execSync('npx create-expo-app MindFlowAPK --template blank-typescript', { stdio: 'inherit' });
console.log('✅ MindFlowAPK projesi oluşturuldu\n');

// Adım 3: Kodları kopyala
console.log('📋 Adım 3: MindFlow kodları kopyalanıyor...');
execSync('xcopy src MindFlowAPK\\src /E /I /H /Y', { stdio: 'pipe' });
execSync('copy app.json MindFlowAPK\\', { stdio: 'pipe' });
console.log('✅ Kodlar kopyalandı\n');

// Adım 4: Package.json güncelle
console.log('🔧 Adım 4: Dependencies güncelleniyor...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const expoPackage = JSON.parse(fs.readFileSync('MindFlowAPK/package.json', 'utf8'));

// Uyumlu dependencies
const compatibleDeps = {
    'zustand': '^4.4.1',
    'uuid': '^9.0.0',
    'react-native-vector-icons': '^10.0.0',
    'expo-vector-icons': '^13.0.0'
};

expoPackage.dependencies = { ...expoPackage.dependencies, ...compatibleDeps };
fs.writeFileSync('MindFlowAPK/package.json', JSON.stringify(expoPackage, null, 2));
console.log('✅ Dependencies güncellendi\n');

// Adım 5: App.tsx güncelle
console.log('📱 Adım 5: Ana uygulama güncelleniyor...');
const appContent = `import React, { useEffect } from 'react';
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
}`;

fs.writeFileSync('MindFlowAPK/App.tsx', appContent);
console.log('✅ App.tsx güncellendi\n');

// Adım 6: Install ve build
console.log('📦 Adım 6: Paketler yükleniyor...');
process.chdir('MindFlowAPK');
execSync('npm install', { stdio: 'inherit' });
console.log('✅ Paketler yüklendi\n');

console.log('🎉 Hazır! APK oluşturmak için:');
console.log('1. cd MindFlowAPK');
console.log('2. npx expo login');
console.log('3. npx expo build:android --type apk');
console.log('\n📱 Sonra APK\'yı Expo\'dan indirip WhatsApp ile paylaşabilirsiniz!');