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
import { useTheme } from "../../hooks/useTheme";

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
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const { subjects, loadData, addSubject } = useSubjects();
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => { loadData(); }, [loadData]);

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

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>All Subjects</Text>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <SearchBar
          placeholder="Search subjects..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery("")}
          style={s.searchContainer}
        />
        <Text style={s.description}>Find below all the subjects available for the quiz</Text>
        <View style={s.subjectsGrid}>
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
            <View style={s.noResults}>
              <Ionicons name="search-outline" size={48} color={theme.textTer} />
              <Text style={s.noResultsText}>No subjects found</Text>
              <Text style={s.noResultsSubtext}>Try a different search term</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>New Subject</Text>

            <Text style={s.inputLabel}>Name</Text>
            <TextInput
              style={[s.textInput, inputFocused && s.textInputFocused]}
              placeholder="e.g. Mathematics"
              placeholderTextColor={theme.textTer}
              value={subjectName}
              onChangeText={setSubjectName}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              returnKeyType="done"
              autoFocus
            />

            <Text style={s.inputLabel}>Icon</Text>
            <View style={s.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[s.iconOption, selectedIcon === icon && s.iconOptionSelected]}
                  onPress={() => setSelectedIcon(icon)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon} size={22} color={selectedIcon === icon ? "#8641f4" : theme.textSec} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.inputLabel}>Color</Text>
            <View style={s.colorRow}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[s.colorSwatch, { backgroundColor: color }, selectedColor === color && s.colorSwatchSelected]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <View style={[s.iconOption, {
              alignSelf: "flex-start", marginBottom: 24,
              backgroundColor: selectedColor + "26", borderColor: selectedColor,
              width: 56, height: 56, borderRadius: 14,
            }]}>
              <Ionicons name={selectedIcon} size={28} color={selectedColor} />
            </View>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={s.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveButton, !subjectName.trim() && s.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!subjectName.trim() || isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={s.saveButtonText}>Add Subject</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      marginBottom: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: theme.text, flex: 1, textAlign: 'center' },
    scrollView: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingTop: 10 },
    description: { fontSize: 14, color: theme.textSec, marginBottom: 20 },
    searchContainer: { marginBottom: 20 },
    subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 20 },
    noResults: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, width: '100%' },
    noResultsText: { fontSize: 18, fontWeight: '600', color: theme.textSec, marginTop: 16 },
    noResultsSubtext: { fontSize: 14, color: theme.textTer, marginTop: 4 },
    fab: {
      position: 'absolute', bottom: 28, right: 24,
      width: 58, height: 58, borderRadius: 29,
      backgroundColor: '#8641f4', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#8641f4', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.handleBar, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 20 },
    inputLabel: { fontSize: 13, fontWeight: '600', color: theme.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    textInput: {
      backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14,
      paddingVertical: 13, fontSize: 16, color: theme.text, marginBottom: 20,
      borderWidth: 1.5, borderColor: 'transparent',
    },
    textInputFocused: { borderColor: '#8641f4', backgroundColor: theme.surface },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    iconOption: {
      width: 48, height: 48, borderRadius: 12, backgroundColor: theme.inputBg,
      alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent',
    },
    iconOptionSelected: { borderColor: '#8641f4', backgroundColor: '#8641f426' },
    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    colorSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
    colorSwatchSelected: { borderColor: theme.text },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.inputBg, alignItems: 'center' },
    cancelButtonText: { fontSize: 16, fontWeight: '600', color: theme.textSec },
    saveButton: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: '#8641f4', alignItems: 'center' },
    saveButtonDisabled: { backgroundColor: '#C4A0F8' },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  });
}
