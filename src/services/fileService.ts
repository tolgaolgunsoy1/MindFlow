// src/services/fileService.ts

import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Type declarations for expo modules
declare module 'expo-file-system' {
  export const documentDirectory: string | null;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'other';
  uri: string;
  size: number;
  mimeType: string;
  uploadedAt: number;
}

export class FileService {
  private static readonly ATTACHMENTS_DIR = FileSystem.documentDirectory
    ? `${FileSystem.documentDirectory}attachments/`
    : 'attachments/';

  // Initialize attachments directory
  static async initializeStorage(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.ATTACHMENTS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.ATTACHMENTS_DIR, { intermediates: true });
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  // Pick image from gallery
  static async pickImage(): Promise<FileAttachment | null> {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('Permission to access camera roll is required!');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          id: Date.now().toString(),
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: 'image',
          uri: asset.uri,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
          uploadedAt: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Image pick error:', error);
      throw error;
    }
  }

  // Pick document
  static async pickDocument(): Promise<FileAttachment | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          id: Date.now().toString(),
          name: asset.name || 'document',
          type: this.getFileType(asset.mimeType || ''),
          uri: asset.uri,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
          uploadedAt: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Document pick error:', error);
      throw error;
    }
  }

  // Take photo with camera
  static async takePhoto(): Promise<FileAttachment | null> {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        throw new Error('Camera permission is required!');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          id: Date.now().toString(),
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: 'image',
          uri: asset.uri,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || 'image/jpeg',
          uploadedAt: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  // Save file to local storage
  static async saveFileLocally(file: FileAttachment): Promise<string> {
    try {
      const fileName = `${file.id}_${file.name}`;
      const localUri = `${this.ATTACHMENTS_DIR}${fileName}`;

      if (Platform.OS === 'ios') {
        // On iOS, copy file to app directory
        await FileSystem.copyAsync({
          from: file.uri,
          to: localUri,
        });
      } else {
        // On Android, move file
        await FileSystem.moveAsync({
          from: file.uri,
          to: localUri,
        });
      }

      return localUri;
    } catch (error) {
      console.error('File save error:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(fileId: string, fileName: string): Promise<void> {
    try {
      const filePath = `${this.ATTACHMENTS_DIR}${fileId}_${fileName}`;
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      console.error('File delete error:', error);
    }
  }

  // Get file info
  static async getFileInfo(uri: string): Promise<FileSystem.FileInfo> {
    return await FileSystem.getInfoAsync(uri);
  }

  // Get file type from mime type
  private static getFileType(mimeType: string): 'image' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) {
      return 'image';
    } else if (
      mimeType.includes('pdf') ||
      mimeType.includes('document') ||
      mimeType.includes('text') ||
      mimeType.includes('spreadsheet')
    ) {
      return 'document';
    }
    return 'other';
  }

  // Format file size
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Get file icon based on type
  static getFileIcon(type: string, mimeType: string): string {
    if (type === 'image') {
      return 'image';
    } else if (mimeType.includes('pdf')) {
      return 'file-pdf-box';
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return 'file-word-box';
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return 'file-excel-box';
    } else if (mimeType.includes('text')) {
      return 'file-text-box';
    }
    return 'file';
  }
}