import {
  Text, View, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Modal, TextInput, KeyboardAvoidingView,
  Platform, Alert, ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../../hooks/useSubjects.js";
import SubjectCard from "../../components/SubjectCard";
import SearchBar from "../../components/SearchBar";

const ICON_OPTIONS = [
  "book", "calculator", "flask", "time", "laptop", "football",
  "trending-up", "musical-notes", "globe", "heart",
  "star", "code-slash", "leaf", "color-palette", "school", "rocket",
];

const COLOR_OPTIONS = [
  "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#06B6D4", "#EF4444", "#EC4899", "#F97316", "#8641f4", "#14B8A6",
];

export default function Subjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const { subjects, loadData, addSubject } = useSubjects();
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("book");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [inputFocused, setInputFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openModal = () => {
    setSubjectName(""); setSelectedIcon("book"); setSelectedColor("#3B82F6");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!subjectName.trim()) return;
    setIsSaving(true);
    try {
      await addSubject({ name: subjectName.trim(), icon: selectedIcon, iconColor: selectedColor });
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Could not add subject. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubjectPress = (subject) => {
    router.push({
      pathname: "/(subjects)/[id]",
      params: {
        id: subject._id ?? subject.id,
        name: subject.name,
        icon: subject.icon,
        iconColor: subject.iconColor,
      },
    });
  };

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Subjects</Text>
        <TouchableOpacity onPress={openModal} style={styles.addHeaderBtn}>
          <Ionicons name="add" size={26} color="#8641f4" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SearchBar
          placeholder="Search subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
          style={styles.searchContainer}
        />
        <Text style={styles.description}>
          Find below all the subjects available for the quiz
        </Text>
        <View style={styles.subjectsGrid}>
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject.name}
                icon={subject.icon}
                iconColor={subject.iconColor}
                onPress={() => handleSubjectPress(subject)}
              />
            ))
          ) : (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={48} color="#CCC" />
              <Text style={styles.noResultsText}>No subjects found</Text>
              <Text style={styles.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Add Subject Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Subject</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={[styles.textInput, inputFocused && styles.textInputFocused]}
              placeholder="e.g. Mathematics"
              placeholderTextColor="#999"
              value={subjectName}
              onChangeText={setSubjectName}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="done"
              autoFocus
            />

            <Text style={styles.inputLabel}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon} size={22} color={selectedIcon === icon ? "#8641f4" : "#666"} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color && styles.colorSwatchSelected]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            {/* Preview */}
            <View style={[styles.iconOption, {
              alignSelf: "flex-start", marginBottom: 24,
              backgroundColor: selectedColor + "26", borderColor: selectedColor,
              width: 56, height: 56, borderRadius: 14,
            }]}>
              <Ionicons name={selectedIcon} size={28} color={selectedColor} />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, !subjectName.trim() && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!subjectName.trim() || isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.saveButtonText}>Add Subject</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 20
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  addHeaderBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    width: '100%',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#8641f4', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#8641f4', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 20 },
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 13, fontSize: 16, color: '#000', marginBottom: 20,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  textInputFocused: { borderColor: '#8641f4', backgroundColor: '#FFF' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  iconOption: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  iconOptionSelected: { borderColor: '#8641f4', backgroundColor: '#8641f426' },
  colorRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  colorSwatchSelected: { borderColor: '#000' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F5F5F5', alignItems: 'center',
  },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButton: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#8641f4', alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#C4A0F8' },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});

