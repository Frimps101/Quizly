import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTopics } from "../../hooks/useTopics";
import { useTheme } from "../../hooks/useTheme";

export default function SubjectDetail() {
  const { id, name, icon, iconColor } = useLocalSearchParams();
  const theme = useTheme();
  const resolvedColor = iconColor || "#8641f4";
  const resolvedIcon = icon || "school";

  const { topics, loadTopics, isLoading } = useTopics(id);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadTopics(); }, [loadTopics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  };

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      {/* Colored header — unchanged regardless of theme */}
      <View style={[s.header, { backgroundColor: resolvedColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={s.headerContent}>
          <View style={[s.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name={resolvedIcon} size={36} color="#FFF" />
          </View>
          <Text style={s.headerTitle}>{name}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={s.sectionTitle}>
          Topics
          {!isLoading && <Text style={s.topicCount}> ({topics.length})</Text>}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={resolvedColor} style={{ marginTop: 40 }} />
        ) : topics.length > 0 ? (
          topics.map((topic, index) => (
            <TouchableOpacity
              key={topic.id}
              style={s.topicRow}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(subjects)/topic",
                  params: { topicId: topic.id, topicName: topic.name, subjectColor: resolvedColor },
                })
              }
            >
              <View style={[s.topicIndex, { backgroundColor: resolvedColor + "20" }]}>
                <Text style={[s.topicIndexText, { color: resolvedColor }]}>{index + 1}</Text>
              </View>
              <View style={s.topicInfo}>
                <Text style={s.topicName}>{topic.name}</Text>
                {topic.description ? <Text style={s.topicDescription}>{topic.description}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textTer} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={s.emptyState}>
            <Ionicons name="library-outline" size={52} color={theme.textTer} />
            <Text style={s.emptyTitle}>No topics yet</Text>
            <Text style={s.emptySubtext}>Topics for this subject will appear here</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.startButton, { backgroundColor: resolvedColor }]}
          activeOpacity={0.85}
          onPress={() => router.push("/(subjects)/create-quiz")}
        >
          <Ionicons name="rocket-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={s.startButtonText}>Start Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
    backButton: { width: 36, height: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
    headerContent: { alignItems: "center", gap: 12 },
    iconCircle: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 26, fontWeight: "700", color: "#FFF" },
    scrollView: { flex: 1 },
    contentContainer: { padding: 20, paddingBottom: 100 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 16 },
    topicCount: { fontSize: 16, fontWeight: "500", color: theme.textTer },
    topicRow: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    },
    topicIndex: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    topicIndexText: { fontSize: 14, fontWeight: "700" },
    topicInfo: { flex: 1 },
    topicName: { fontSize: 15, fontWeight: "600", color: theme.text },
    topicDescription: { fontSize: 13, color: theme.textSec, marginTop: 2 },
    emptyState: { alignItems: "center", paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.textTer, marginTop: 16 },
    emptySubtext: { fontSize: 14, color: theme.textTer, marginTop: 4 },
    footer: {
      padding: 20, paddingBottom: 36,
      backgroundColor: theme.bg,
      borderTopWidth: 1, borderTopColor: theme.border,
    },
    startButton: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, borderRadius: 16 },
    startButtonText: { fontSize: 17, fontWeight: "700", color: "#FFF" },
  });
}
