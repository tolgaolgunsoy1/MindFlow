// src/services/meetingService.ts

export interface MeetingParticipant {
  id: string;
  name: string;
  avatar?: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  joinedAt: number;
  role: 'host' | 'participant';
}

export interface MeetingRoom {
  id: string;
  name: string;
  hostId: string;
  participants: MeetingParticipant[];
  isActive: boolean;
  startedAt: number;
  mindMapId?: string;
  settings: {
    allowScreenShare: boolean;
    allowChat: boolean;
    maxParticipants: number;
    isRecording: boolean;
  };
}

export interface MeetingMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: 'text' | 'system' | 'file';
  fileUrl?: string;
}

export interface MeetingControls {
  isMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  volume: number;
}

export class MeetingService {
  private static instance: MeetingService;
  private currentRoom: MeetingRoom | null = null;
  private localStream: any = null; // Would be MediaStream in real implementation
  private participants: Map<string, MeetingParticipant> = new Map();
  private messages: MeetingMessage[] = [];
  private controls: MeetingControls = {
    isMuted: false,
    isVideoOn: true,
    isScreenSharing: false,
    isRecording: false,
    volume: 0.8,
  };

  static getInstance(): MeetingService {
    if (!MeetingService.instance) {
      MeetingService.instance = new MeetingService();
    }
    return MeetingService.instance;
  }

  /**
   * Toplantı odası oluştur
   */
  async createRoom(
    name: string,
    mindMapId?: string,
    settings?: Partial<MeetingRoom['settings']>
  ): Promise<MeetingRoom> {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const room: MeetingRoom = {
      id: roomId,
      name,
      hostId: 'current_user', // Would be actual user ID
      participants: [],
      isActive: false,
      startedAt: Date.now(),
      mindMapId,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        maxParticipants: 10,
        isRecording: false,
        ...settings,
      },
    };

    this.currentRoom = room;
    return room;
  }

  /**
   * Toplantıya katıl
   */
  async joinRoom(roomId: string, userName: string): Promise<MeetingParticipant> {
    if (!this.currentRoom || this.currentRoom.id !== roomId) {
      throw new Error('Room not found');
    }

    // Simulate joining
    await new Promise(resolve => setTimeout(resolve, 1000));

    const participant: MeetingParticipant = {
      id: `user_${Date.now()}`,
      name: userName,
      isMuted: false,
      isVideoOn: true,
      isScreenSharing: false,
      joinedAt: Date.now(),
      role: this.currentRoom.participants.length === 0 ? 'host' : 'participant',
    };

    this.participants.set(participant.id, participant);
    this.currentRoom.participants.push(participant);

    // Start room if it's the first participant
    if (this.currentRoom.participants.length === 1) {
      this.currentRoom.isActive = true;
    }

    return participant;
  }

  /**
   * Toplantıdan ayrıl
   */
  async leaveRoom(): Promise<void> {
    if (this.localStream) {
      // Stop all tracks
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }

    this.participants.clear();
    this.messages = [];

    if (this.currentRoom) {
      this.currentRoom.isActive = false;
      this.currentRoom = null;
    }
  }

  /**
   * Mikrofonu aç/kapat
   */
  async toggleMute(): Promise<boolean> {
    this.controls.isMuted = !this.controls.isMuted;

    // In real implementation, this would control audio tracks
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !this.controls.isMuted;
      });
    }

    return this.controls.isMuted;
  }

  /**
   * Kamerayı aç/kapat
   */
  async toggleVideo(): Promise<boolean> {
    this.controls.isVideoOn = !this.controls.isVideoOn;

    // In real implementation, this would control video tracks
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track: any) => {
        track.enabled = this.controls.isVideoOn;
      });
    }

    return this.controls.isVideoOn;
  }

  /**
   * Ekran paylaşımını başlat/durdur
   */
  async toggleScreenShare(): Promise<boolean> {
    if (!this.currentRoom?.settings.allowScreenShare) {
      throw new Error('Screen sharing not allowed in this room');
    }

    this.controls.isScreenSharing = !this.controls.isScreenSharing;

    // In real implementation, this would use getDisplayMedia()
    if (this.controls.isScreenSharing) {
      try {
        // Simulate screen share stream
        console.log('Screen sharing started');
      } catch (error) {
        this.controls.isScreenSharing = false;
        throw error;
      }
    } else {
      console.log('Screen sharing stopped');
    }

    return this.controls.isScreenSharing;
  }

  /**
   * Kayıt başlat/durdur
   */
  async toggleRecording(): Promise<boolean> {
    this.controls.isRecording = !this.controls.isRecording;

    if (this.controls.isRecording) {
      console.log('Recording started');
      // In real implementation, this would start recording all streams
    } else {
      console.log('Recording stopped');
      // In real implementation, this would stop recording and save file
    }

    return this.controls.isRecording;
  }

  /**
   * Ses seviyesini ayarla
   */
  setVolume(volume: number): void {
    this.controls.volume = Math.max(0, Math.min(1, volume));
    // In real implementation, this would adjust audio output volume
  }

  /**
   * Mesaj gönder
   */
  async sendMessage(content: string, type: MeetingMessage['type'] = 'text'): Promise<MeetingMessage> {
    if (!this.currentRoom?.settings.allowChat) {
      throw new Error('Chat not allowed in this room');
    }

    const message: MeetingMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'current_user',
      senderName: 'You',
      content,
      timestamp: Date.now(),
      type,
    };

    this.messages.push(message);

    // In real implementation, this would broadcast to all participants
    console.log('Message sent:', message);

    return message;
  }

  /**
   * Dosya paylaş
   */
  async shareFile(fileUri: string, fileName: string): Promise<MeetingMessage> {
    // In real implementation, this would upload file and share URL
    return this.sendMessage(`${fileName} shared`, 'file');
  }

  /**
   * Katılımcıyı sustur (sadece host için)
   */
  async muteParticipant(participantId: string): Promise<void> {
    const participant = this.participants.get(participantId);
    if (!participant) throw new Error('Participant not found');

    // Check if current user is host
    const currentUser = Array.from(this.participants.values()).find(p => p.id === 'current_user');
    if (currentUser?.role !== 'host') {
      throw new Error('Only host can mute participants');
    }

    participant.isMuted = true;
    // In real implementation, this would send mute command to participant
  }

  /**
   * Katılımcıyı toplantıdan çıkar (sadece host için)
   */
  async removeParticipant(participantId: string): Promise<void> {
    const participant = this.participants.get(participantId);
    if (!participant) throw new Error('Participant not found');

    // Check if current user is host
    const currentUser = Array.from(this.participants.values()).find(p => p.id === 'current_user');
    if (currentUser?.role !== 'host') {
      throw new Error('Only host can remove participants');
    }

    this.participants.delete(participantId);
    this.currentRoom!.participants = this.currentRoom!.participants.filter(p => p.id !== participantId);

    // Add system message
    this.sendMessage(`${participant.name} was removed from the meeting`, 'system');
  }

  /**
   * Mevcut toplantı bilgilerini al
   */
  getCurrentRoom(): MeetingRoom | null {
    return this.currentRoom;
  }

  /**
   * Katılımcıları al
   */
  getParticipants(): MeetingParticipant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Mesajları al
   */
  getMessages(): MeetingMessage[] {
    return [...this.messages];
  }

  /**
   * Kontrolleri al
   */
  getControls(): MeetingControls {
    return { ...this.controls };
  }

  /**
   * Toplantı istatistikleri
   */
  getMeetingStats() {
    if (!this.currentRoom) return null;

    const duration = Date.now() - this.currentRoom.startedAt;
    const activeParticipants = this.currentRoom.participants.filter(p => {
      // In real implementation, check if participant is actually active
      return true;
    }).length;

    return {
      duration,
      totalParticipants: this.currentRoom.participants.length,
      activeParticipants,
      messagesSent: this.messages.length,
      isRecording: this.controls.isRecording,
    };
  }

  /**
   * Toplantı ayarlarını güncelle (sadece host için)
   */
  updateRoomSettings(settings: Partial<MeetingRoom['settings']>): void {
    if (!this.currentRoom) throw new Error('No active room');

    // Check if current user is host
    const currentUser = Array.from(this.participants.values()).find(p => p.id === 'current_user');
    if (currentUser?.role !== 'host') {
      throw new Error('Only host can update settings');
    }

    this.currentRoom.settings = { ...this.currentRoom.settings, ...settings };
  }

  /**
   * Toplantı linki oluştur
   */
  generateInviteLink(): string {
    if (!this.currentRoom) throw new Error('No active room');

    // In real implementation, this would generate a shareable link
    return `mindflow://meeting/${this.currentRoom.id}`;
  }

  /**
   * Ağ kalitesi kontrolü
   */
  getNetworkQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    // In real implementation, this would measure connection quality
    return 'good';
  }

  /**
   * Mikrofon/görüntü izinlerini kontrol et
   */
  async checkPermissions(): Promise<{
    microphone: boolean;
    camera: boolean;
    screenShare: boolean;
  }> {
    // In real implementation, this would check actual permissions
    return {
      microphone: true,
      camera: true,
      screenShare: true,
    };
  }

  /**
   * Ses seviyesini izle
   */
  getAudioLevels(): Map<string, number> {
    const levels = new Map<string, number>();

    // In real implementation, this would measure audio levels for each participant
    this.participants.forEach(participant => {
      levels.set(participant.id, Math.random()); // Mock audio level
    });

    return levels;
  }
}

export default MeetingService.getInstance();