import { Text, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

export default function CreateQuiz() {
  const theme = useTheme();

  const handleOptionPress = (option) => {
    if (option === "manual") router.push("/(subjects)/create-manual");
  };

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Create Quiz</Text>
        <View style={s.placeholder} />
      </View>

      <ScrollView style={s.scrollView} contentContainerStyle={s.contentContainer}>
        <Text style={s.description}>Choose how you want to create your quiz</Text>

        {[
          { key: "manual",   icon: "create",        title: "Manual Creation",  desc: "Create quiz questions manually one by one" },
          { key: "ai",       icon: "sparkles",       title: "AI Generated",     desc: "Generate quiz questions using AI" },
          { key: "import",   icon: "cloud-upload",   title: "Import from File", desc: "Upload a file with quiz questions" },
          { key: "template", icon: "document-text",  title: "Use Template",     desc: "Start from a pre-made quiz template" },
        ].map(opt => (
          <TouchableOpacity key={opt.key} style={s.optionCard} onPress={() => handleOptionPress(opt.key)}>
            <View style={s.optionIcon}>
              <Ionicons name={opt.icon} size={32} color="#8641f4" />
            </View>
            <View style={s.optionContent}>
              <Text style={s.optionTitle}>{opt.title}</Text>
              <Text style={s.optionDescription}>{opt.desc}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={theme.textTer} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '600', color: theme.text },
    placeholder: { width: 40 },
    scrollView: { flex: 1 },
    contentContainer: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
    description: { fontSize: 14, color: theme.textSec, marginBottom: 20 },
    optionCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.surface, borderRadius: 16, padding: 16, marginBottom: 12,
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0.3 : 0.08, shadowRadius: 4, elevation: 3,
    },
    optionIcon: {
      width: 56, height: 56, backgroundColor: theme.accentLight,
      borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16,
    },
    optionContent: { flex: 1 },
    optionTitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 },
    optionDescription: { fontSize: 14, color: theme.textSec },
  });
}
