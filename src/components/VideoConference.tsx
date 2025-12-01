// src/components/VideoConference.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MeetingService, {
  MeetingParticipant,
  MeetingMessage,
  MeetingControls
} from '../services/meetingService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoConferenceProps {
  visible: boolean;
  onClose: () => void;
  mindMapId?: string;
}

const VideoConference: React.FC<VideoConferenceProps> = ({
  visible,
  onClose,
  mindMapId
}) => {
  const [room, setRoom] = useState(MeetingService.getCurrentRoom());
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [messages, setMessages] = useState<MeetingMessage[]>([]);
  const [controls, setControls] = useState<MeetingControls>(MeetingService.getControls());
  const [newMessage, setNewMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [meetingStats, setMeetingStats] = useState<any>(null);

  useEffect(() => {
    if (visible && !room) {
      createAndJoinRoom();
    }

    // Update participants and messages periodically
    const interval = setInterval(() => {
      if (visible) {
        setParticipants(MeetingService.getParticipants());
        setMessages(MeetingService.getMessages());
        setControls(MeetingService.getControls());
        setMeetingStats(MeetingService.getMeetingStats());
        setRoom(MeetingService.getCurrentRoom());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, room]);

  const createAndJoinRoom = async () => {
    try {
      setIsJoining(true);

      // Create room
      const newRoom = await MeetingService.createRoom(
        `MindFlow Meeting - ${new Date().toLocaleTimeString()}`,
        mindMapId
      );

      // Join room
      await MeetingService.joinRoom(newRoom.id, 'You');

      setRoom(newRoom);
    } catch (error) {
      Alert.alert('Error', 'Failed to create/join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveMeeting = async () => {
    Alert.alert(
      'Leave Meeting',
      'Are you sure you want to leave the meeting?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            await MeetingService.leaveRoom();
            setRoom(null);
            setParticipants([]);
            setMessages([]);
            onClose();
          }
        }
      ]
    );
  };

  const handleToggleMute = async () => {
    try {
      const isMuted = await MeetingService.toggleMute();
      setControls(prev => ({ ...prev, isMuted }));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle mute');
    }
  };

  const handleToggleVideo = async () => {
    try {
      const isVideoOn = await MeetingService.toggleVideo();
      setControls(prev => ({ ...prev, isVideoOn }));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle video');
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      const isScreenSharing = await MeetingService.toggleScreenShare();
      setControls(prev => ({ ...prev, isScreenSharing }));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle screen share');
    }
  };

  const handleToggleRecording = async () => {
    try {
      const isRecording = await MeetingService.toggleRecording();
      setControls(prev => ({ ...prev, isRecording }));
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle recording');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await MeetingService.sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleShareInvite = () => {
    const inviteLink = MeetingService.generateInviteLink();
    // In real implementation, this would share the link
    Alert.alert('Invite Link', inviteLink);
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  if (isJoining) {
    return (
      <View style={styles.overlay}>
        <View style={styles.joiningContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.joiningText}>Toplantıya bağlanılıyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Icon name="video" size={20} color="#FFF" />
            <Text style={styles.roomName}>{room?.name || 'Meeting'}</Text>
            {meetingStats && (
              <Text style={styles.duration}>
                {formatDuration(meetingStats.duration)}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowChat(!showChat)}
            >
              <Icon name="chat" size={20} color="#FFF" />
              {messages.length > 0 && (
                <View style={styles.messageBadge}>
                  <Text style={styles.messageBadgeText}>
                    {messages.length > 99 ? '99+' : messages.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleShareInvite}>
              <Icon name="share-variant" size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={handleLeaveMeeting}>
              <Icon name="phone-hangup" size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Video Area */}
          <View style={[styles.videoArea, showChat && styles.videoAreaWithChat]}>
            {/* Participants Grid */}
            <View style={styles.participantsGrid}>
              {participants.map((participant) => (
                <View key={participant.id} style={styles.participantCard}>
                  {/* Video Placeholder */}
                  <View style={styles.videoPlaceholder}>
                    {participant.isVideoOn ? (
                      <View style={styles.videoStream}>
                        <Icon name="video" size={48} color="#666" />
                        <Text style={styles.videoText}>Video Stream</Text>
                      </View>
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {participant.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    {/* Participant Info */}
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                      <View style={styles.participantStatus}>
                        {participant.isMuted && (
                          <Icon name="microphone-off" size={16} color="#F44336" />
                        )}
                        {participant.isScreenSharing && (
                          <Icon name="monitor-share" size={16} color="#4CAF50" />
                        )}
                        {participant.role === 'host' && (
                          <Icon name="crown" size={16} color="#FFD700" />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Meeting Stats */}
            {meetingStats && (
              <View style={styles.statsBar}>
                <Text style={styles.statsText}>
                  {meetingStats.activeParticipants}/{meetingStats.totalParticipants} aktif
                </Text>
                {meetingStats.isRecording && (
                  <View style={styles.recordingIndicator}>
                    <Icon name="record" size={16} color="#F44336" />
                    <Text style={styles.recordingText}>Kayıt ediliyor</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Chat Panel */}
          {showChat && (
            <View style={styles.chatPanel}>
              {/* Messages */}
              <ScrollView
                style={styles.messagesContainer}
                showsVerticalScrollIndicator={false}
              >
                {messages.map((message) => (
                  <View key={message.id} style={styles.messageItem}>
                    <Text style={styles.messageSender}>{message.senderName}</Text>
                    <Text style={styles.messageContent}>{message.content}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Message Input */}
              <View style={styles.messageInputContainer}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Mesajınızı yazın..."
                  placeholderTextColor="#999"
                  onSubmitEditing={handleSendMessage}
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                  <Icon name="send" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, controls.isMuted && styles.controlButtonActive]}
            onPress={handleToggleMute}
          >
            <Icon
              name={controls.isMuted ? "microphone-off" : "microphone"}
              size={24}
              color={controls.isMuted ? "#F44336" : "#FFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, !controls.isVideoOn && styles.controlButtonActive]}
            onPress={handleToggleVideo}
          >
            <Icon
              name={controls.isVideoOn ? "video" : "video-off"}
              size={24}
              color={!controls.isVideoOn ? "#F44336" : "#FFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, controls.isScreenSharing && styles.controlButtonActive]}
            onPress={handleToggleScreenShare}
          >
            <Icon
              name="monitor-share"
              size={24}
              color={controls.isScreenSharing ? "#4CAF50" : "#FFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, controls.isRecording && styles.controlButtonActive]}
            onPress={handleToggleRecording}
          >
            <Icon
              name="record"
              size={24}
              color={controls.isRecording ? "#F44336" : "#FFF"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleLeaveMeeting}
          >
            <Icon name="phone-hangup" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  joiningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  joiningText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roomName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  duration: {
    color: '#CCC',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 8,
    position: 'relative',
  },
  messageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  videoArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  videoAreaWithChat: {
    flex: 1,
  },
  participantsGrid: {
    flex: 1,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantCard: {
    width: 160,
    height: 120,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  videoPlaceholder: {
    flex: 1,
    position: 'relative',
  },
  videoStream: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  videoText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  avatar: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  participantInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
  },
  participantName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  participantStatus: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  statsText: {
    color: '#FFF',
    fontSize: 14,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  chatPanel: {
    width: 300,
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageItem: {
    marginBottom: 12,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallButton: {
    backgroundColor: '#F44336',
  },
});

export default VideoConference;