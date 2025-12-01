// src/components/FilterModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface FilterModalProps {
  visible: boolean;
  filters: {
    status: string[];
    priority: string[];
    hasDueDate: boolean;
    hasAttachments: boolean;
    dateRange: { start: Date; end: Date } | null;
    tags: string[];
    progressRange: { min: number; max: number } | null;
    creator: string | null;
    assignee: string | null;
    searchQuery: string;
    sortBy: 'name' | 'created' | 'updated' | 'priority' | 'dueDate';
    sortOrder: 'asc' | 'desc';
  };
  onApply: (filters: FilterModalProps['filters']) => void;
  onClose: () => void;
  onClear: () => void;
  onSavePreset?: (name: string, filters: FilterModalProps['filters']) => void;
  savedPresets?: { name: string; filters: FilterModalProps['filters'] }[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  filters,
  onApply,
  onClose,
  onClear,
  onSavePreset,
  savedPresets = [],
}) => {
  const [tempFilters, setTempFilters] = useState(filters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const statusOptions = [
    { value: 'todo', label: 'Yapılacak', icon: 'clock-outline' },
    { value: 'in-progress', label: 'Devam Ediyor', icon: 'progress-clock' },
    { value: 'done', label: 'Tamamlandı', icon: 'check-circle' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Düşük', color: '#4CAF50' },
    { value: 'medium', label: 'Orta', color: '#FFC107' },
    { value: 'high', label: 'Yüksek', color: '#FF9800' },
    { value: 'critical', label: 'Kritik', color: '#F44336' },
  ];

  const toggleStatus = (status: string) => {
    setTempFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const togglePriority = (priority: string) => {
    setTempFilters(prev => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter(p => p !== priority)
        : [...prev.priority, priority],
    }));
  };

  const handleApply = () => {
    onApply(tempFilters);
  };

  const handleClear = () => {
    const clearedFilters = {
      status: [],
      priority: [],
      hasDueDate: false,
      hasAttachments: false,
      dateRange: null,
      tags: [],
      progressRange: null,
      creator: null,
      assignee: null,
      searchQuery: '',
      sortBy: 'name' as const,
      sortOrder: 'asc' as const,
    };
    setTempFilters(clearedFilters);
    onClear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filtreler</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Durum</Text>
              <View style={styles.optionsGrid}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      tempFilters.status.includes(option.value) && styles.optionButtonSelected,
                    ]}
                    onPress={() => toggleStatus(option.value)}
                  >
                    <Icon
                      name={option.icon}
                      size={20}
                      color={tempFilters.status.includes(option.value) ? '#2196F3' : '#666'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        tempFilters.status.includes(option.value) && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Öncelik</Text>
              <View style={styles.optionsGrid}>
                {priorityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.priorityButton,
                      tempFilters.priority.includes(option.value) && {
                        backgroundColor: option.color,
                        borderColor: option.color,
                      },
                    ]}
                    onPress={() => togglePriority(option.value)}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        tempFilters.priority.includes(option.value) && styles.priorityTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Filters */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hızlı Filtreler</Text>
              <View style={styles.quickFilters}>
                <TouchableOpacity
                  style={[
                    styles.quickFilterButton,
                    tempFilters.hasDueDate && styles.quickFilterButtonActive,
                  ]}
                  onPress={() => setTempFilters(prev => ({ ...prev, hasDueDate: !prev.hasDueDate }))}
                >
                  <Icon
                    name="calendar"
                    size={16}
                    color={tempFilters.hasDueDate ? '#FFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.quickFilterText,
                      tempFilters.hasDueDate && styles.quickFilterTextActive,
                    ]}
                  >
                    Bitiş Tarihi Var
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.quickFilterButton,
                    tempFilters.hasAttachments && styles.quickFilterButtonActive,
                  ]}
                  onPress={() => setTempFilters(prev => ({ ...prev, hasAttachments: !prev.hasAttachments }))}
                >
                  <Icon
                    name="attachment"
                    size={16}
                    color={tempFilters.hasAttachments ? '#FFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.quickFilterText,
                      tempFilters.hasAttachments && styles.quickFilterTextActive,
                    ]}
                  >
                    Ek Dosya Var
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Advanced Filters Toggle */}
            <TouchableOpacity
              style={styles.advancedToggle}
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              <Text style={styles.advancedToggleText}>
                Gelişmiş Filtreler {showAdvanced ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {showAdvanced && (
              <>
                {/* Search */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Arama</Text>
                  <TextInput
                    style={styles.searchInput}
                    value={tempFilters.searchQuery}
                    onChangeText={(text) => setTempFilters(prev => ({ ...prev, searchQuery: text }))}
                    placeholder="Başlık, açıklama veya etiketlerde ara..."
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Tags */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Etiketler</Text>
                  <TextInput
                    style={styles.input}
                    value={tempFilters.tags.join(', ')}
                    onChangeText={(text) => setTempFilters(prev => ({
                      ...prev,
                      tags: text.split(',').map(t => t.trim()).filter(t => t)
                    }))}
                    placeholder="etiket1, etiket2, etiket3"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* Progress Range */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>İlerleme Aralığı</Text>
                  <View style={styles.progressRange}>
                    <TextInput
                      style={styles.rangeInput}
                      value={tempFilters.progressRange?.min?.toString() || ''}
                      onChangeText={(text) => {
                        const min = parseInt(text) || 0;
                        setTempFilters(prev => ({
                          ...prev,
                          progressRange: {
                            min: Math.max(0, Math.min(100, min)),
                            max: prev.progressRange?.max || 100
                          }
                        }));
                      }}
                      placeholder="Min %"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.rangeSeparator}>-</Text>
                    <TextInput
                      style={styles.rangeInput}
                      value={tempFilters.progressRange?.max?.toString() || ''}
                      onChangeText={(text) => {
                        const max = parseInt(text) || 100;
                        setTempFilters(prev => ({
                          ...prev,
                          progressRange: {
                            min: prev.progressRange?.min || 0,
                            max: Math.max(0, Math.min(100, max))
                          }
                        }));
                      }}
                      placeholder="Max %"
                      keyboardType="numeric"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>

                {/* Sorting */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Sıralama</Text>
                  <View style={styles.sortOptions}>
                    <TouchableOpacity
                      style={[styles.sortButton, tempFilters.sortBy === 'name' && styles.sortButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortBy: 'name' }))}
                    >
                      <Text style={[styles.sortText, tempFilters.sortBy === 'name' && styles.sortTextActive]}>İsim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortButton, tempFilters.sortBy === 'created' && styles.sortButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortBy: 'created' }))}
                    >
                      <Text style={[styles.sortText, tempFilters.sortBy === 'created' && styles.sortTextActive]}>Oluşturulma</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortButton, tempFilters.sortBy === 'updated' && styles.sortButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortBy: 'updated' }))}
                    >
                      <Text style={[styles.sortText, tempFilters.sortBy === 'updated' && styles.sortTextActive]}>Güncellenme</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.sortButton, tempFilters.sortBy === 'priority' && styles.sortButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortBy: 'priority' }))}
                    >
                      <Text style={[styles.sortText, tempFilters.sortBy === 'priority' && styles.sortTextActive]}>Öncelik</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.sortOrder}>
                    <TouchableOpacity
                      style={[styles.orderButton, tempFilters.sortOrder === 'asc' && styles.orderButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                    >
                      <Icon name="sort-ascending" size={16} color={tempFilters.sortOrder === 'asc' ? '#FFF' : '#666'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.orderButton, tempFilters.sortOrder === 'desc' && styles.orderButtonActive]}
                      onPress={() => setTempFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                    >
                      <Icon name="sort-descending" size={16} color={tempFilters.sortOrder === 'desc' ? '#FFF' : '#666'} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Saved Presets */}
                {savedPresets.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kayıtlı Filtreler</Text>
                    <View style={styles.presets}>
                      {savedPresets.map((preset, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.presetButton}
                          onPress={() => setTempFilters(preset.filters)}
                        >
                          <Text style={styles.presetText}>{preset.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Save Preset */}
                <View style={styles.section}>
                  <TouchableOpacity
                    style={styles.savePresetButton}
                    onPress={() => setShowSavePreset(true)}
                  >
                    <Icon name="content-save" size={16} color="#2196F3" />
                    <Text style={styles.savePresetText}>Filtreyi Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Temizle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Uygula</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: 6,
    minWidth: 120,
  },
  optionButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionText: {
    fontSize: 12,
    color: '#666',
  },
  optionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  priorityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    minWidth: 80,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    color: '#666',
  },
  priorityTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  quickFilters: {
    gap: 8,
  },
  quickFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    gap: 8,
  },
  quickFilterButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  quickFilterText: {
    fontSize: 14,
    color: '#666',
  },
  quickFilterTextActive: {
    color: '#FFF',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  advancedToggle: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 16,
  },
  advancedToggleText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
  },
  progressRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  sortButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  sortText: {
    fontSize: 12,
    color: '#666',
  },
  sortTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  sortOrder: {
    flexDirection: 'row',
    gap: 8,
  },
  orderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  presets: {
    gap: 8,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  presetText: {
    fontSize: 14,
    color: '#333',
  },
  savePresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    backgroundColor: '#F5F5F5',
    gap: 8,
  },
  savePresetText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default FilterModal;