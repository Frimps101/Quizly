import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Image, Switch, Alert, Platform, TextInput, Modal,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../hooks/useTheme";

const API_URL = "http://localhost:5002/api";
const AVATAR_KEY  = "@quizly_avatar_uri";
const NAME_KEY    = "@quizly_display_name";
const DEFAULT_AVATAR = "https://i.pravatar.cc/300";

function MenuItem({ icon, label, value, onPress, isSwitch, switchValue, onToggle, color, chevron = true, theme }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.bg }]}
      onPress={onPress}
      activeOpacity={isSwitch ? 1 : 0.7}
      disabled={isSwitch}
    >
      <View style={[styles.menuIcon, { backgroundColor: (color || "#8641f4") + "18" }]}>
        <Ionicons name={icon} size={18} color={color || "#8641f4"} />
      </View>
      <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
      <View style={styles.menuRight}>
        {value ? <Text style={[styles.menuValue, { color: theme.textTer }]}>{value}</Text> : null}
        {isSwitch
          ? <Switch value={switchValue} onValueChange={onToggle} trackColor={{ true: "transparent", false: "transparent" }} thumbColor="#8641f4" />
          : chevron
          ? <Ionicons name="chevron-forward" size={16} color={theme.textTer} />
          : null
        }
      </View>
    </TouchableOpacity>
  );
}

export default function Profile() {
  const theme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [avatarUri, setAvatarUri] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(AVATAR_KEY),
      AsyncStorage.getItem(NAME_KEY),
    ]).then(([uri, name]) => {
      if (uri)  setAvatarUri(uri);
      if (name) setDisplayName(name);
    });
  }, []);

  const openEditModal = () => {
    setDraftName(displayName);
    setEditModal(true);
  };

  const saveProfile = async () => {
    const name = draftName.trim();
    await AsyncStorage.setItem(NAME_KEY, name);
    setDisplayName(name);
    setEditModal(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photo library to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      let uri = result.assets[0].uri;
      if (Platform.OS !== "web") {
        const { FileSystem } = await import("expo-file-system");
        const dest = FileSystem.documentDirectory + "profile_avatar.jpg";
        await FileSystem.copyAsync({ from: uri, to: dest });
        uri = dest;
      }
      await AsyncStorage.setItem(AVATAR_KEY, uri);
      setAvatarUri(uri + "?t=" + Date.now());
    }
  };

  const handleClearProgress = () => {
    Alert.alert(
      "Clear Progress",
      "This will reset all your flashcard progress. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => {} },
      ]
    );
  };

  const s = makeStyles(theme);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUri || DEFAULT_AVATAR }} style={styles.avatar} />
          <TouchableOpacity style={styles.avatarBadge} onPress={pickImage} activeOpacity={0.8}>
            <Ionicons name="pencil" size={12} color="#FFF" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={openEditModal} activeOpacity={0.7}>
          <Text style={s.profileName}>{displayName || "Tap to set name"}</Text>
        </TouchableOpacity>
      </View>

      {/* Edit name modal */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModal(false)} />
        <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.handleBar }]} />
          <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Name</Text>
          <Text style={[styles.inputLabel, { color: theme.textTer }]}>Name</Text>
          <TextInput
            style={[styles.textInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border }]}
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Your name"
            placeholderTextColor={theme.textTer}
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.inputBg }]} onPress={() => setEditModal(false)}>
              <Text style={[styles.cancelBtnText, { color: theme.textSec }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={s.sectionLabel}>Study</Text>
      <View style={s.menuCard}>
        <MenuItem icon="albums-outline"    label="All Subjects"   color="#8641f4"  theme={theme} />
        <MenuItem icon="layers-outline"    label="Topics"         color="#8641f4"  theme={theme} />
        <MenuItem icon="help-circle-outline" label="Questions"    color="#8641f4"  theme={theme} />
      </View>

      <Text style={s.sectionLabel}>Preferences</Text>
      <View style={s.menuCard}>
        <MenuItem
          icon="notifications-outline"
          label="Notifications"
          color="#F59E0B"
          isSwitch
          switchValue={notifications}
          onToggle={setNotifications}
          theme={theme}
        />
        <MenuItem icon="language-outline" label="Language" color="#06B6D4" value="English" theme={theme} />
      </View>

      <Text style={s.sectionLabel}>Data</Text>
      <View style={s.menuCard}>
        <MenuItem icon="refresh-outline"      label="Reset Progress" color="#F97316" onPress={handleClearProgress} theme={theme} />
        <MenuItem icon="cloud-upload-outline" label="Export Data"    color="#10B981" theme={theme} />
      </View>

      <Text style={s.sectionLabel}>About</Text>
      <View style={s.menuCard}>
        <MenuItem icon="information-circle-outline" label="About Quizly"  color="#8B5CF6" theme={theme} />
        <MenuItem icon="star-outline"               label="Rate the App"  color="#F59E0B" theme={theme} />
        <MenuItem icon="chatbubble-outline"         label="Send Feedback" color="#06B6D4" theme={theme} />
      </View>

      <Text style={s.version}>Quizly v1.0.0</Text>
    </ScrollView>
  );
}

// Static styles that don't need theming (avatar, modal internals)
const styles = StyleSheet.create({
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#8641f4", justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#FFF",
  },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  textInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, marginBottom: 16, borderWidth: 1.5 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "600" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, backgroundColor: "#8641f4", alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuValue: { fontSize: 14 },
});

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    content: { paddingBottom: 40 },
    profileCard: {
      backgroundColor: theme.surface,
      alignItems: "center",
      paddingTop: 60, paddingBottom: 24, marginBottom: 24,
      borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.06,
      shadowRadius: 8, elevation: 3,
    },
    profileName: { fontSize: 22, fontWeight: "800", color: theme.text, marginBottom: 6 },
    sectionLabel: {
      fontSize: 12, fontWeight: "700", color: theme.textTer,
      textTransform: "uppercase", letterSpacing: 0.8,
      marginHorizontal: 20, marginBottom: 8,
    },
    menuCard: {
      backgroundColor: theme.surface, borderRadius: 18,
      marginHorizontal: 16, marginBottom: 20, overflow: "hidden",
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.04, shadowRadius: 4, elevation: 2,
    },
    version: { textAlign: "center", fontSize: 12, color: theme.textTer, marginTop: 4 },
  });
}
