import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useTheme } from "../../hooks/useTheme";

const API_URL = "http://localhost:5002/api";

function TopicRow({ topic, subjectColor, subjectIcon }) {
  const theme = useTheme();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/progress/topic/${topic.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setProgress(d))
      .catch(() => {});
  }, [topic.id]);

  const total = parseInt(progress?.total || 0);
  const mastered = parseInt(progress?.mastered || 0);
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <TouchableOpacity
      style={[styles.topicCard, { borderBottomColor: theme.bg }]}
      activeOpacity={0.75}
      onPress={() =>
        router.push({
          pathname: "/(subjects)/flashcard-session",
          params: { topicId: topic.id, topicName: topic.name, subjectColor, subjectIcon },
        })
      }
    >
      <View style={styles.topicLeft}>
        <View style={[styles.topicIconBox, { backgroundColor: subjectColor + "22" }]}>
          <Ionicons name={subjectIcon || "school"} size={20} color={subjectColor} />
        </View>
        <View style={styles.topicInfo}>
          <Text style={[styles.topicName, { color: theme.text }]}>{topic.name}</Text>
          {total > 0 && <Text style={[styles.topicSub, { color: theme.textTer }]}>{mastered}/{total} mastered</Text>}
        </View>
      </View>
      <View style={styles.topicRight}>
        {total > 0 && (
          <View style={[styles.progressPill, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: subjectColor }]} />
          </View>
        )}
        <Ionicons name="play-circle" size={28} color={subjectColor} />
      </View>
    </TouchableOpacity>
  );
}

function SubjectSection({ subject }) {
  const theme = useTheme();
  const resolvedColor = subject.iconColor || "#8641f4";
  const { topics, loadTopics, isLoading } = useTopics(subject.id);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) loadTopics();
  }, [expanded]);

  return (
    <View style={styles.subjectSection}>
      <TouchableOpacity
        style={[styles.subjectHeader, { backgroundColor: theme.surface },
          expanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={[styles.subjectIconBox, { backgroundColor: resolvedColor + "22" }]}>
          <Ionicons name={subject.icon || "school"} size={22} color={resolvedColor} />
        </View>
        <Text style={[styles.subjectName, { color: theme.text }]}>{subject.name}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={theme.textTer} />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.topicsContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {isLoading ? (
            <ActivityIndicator color={resolvedColor} style={{ padding: 16 }} />
          ) : topics.length === 0 ? (
            <Text style={[styles.noTopics, { color: theme.textTer }]}>No topics available yet</Text>
          ) : (
            topics.map(t => (
              <TopicRow key={t.id} topic={t} subjectColor={resolvedColor} subjectIcon={subject.icon} />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function Flashcards() {
  const theme = useTheme();
  const { subjects, loadData, isLoading } = useSubjects();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Flashcards</Text>
        <Text style={[styles.headerSub, { color: theme.textTer }]}>Tap a subject to see topics</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <ActivityIndicator color="#8641f4" style={{ marginTop: 40 }} />
        ) : subjects.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={52} color={theme.textTer} />
            <Text style={[styles.emptyTitle, { color: theme.textTer }]}>No subjects yet</Text>
            <Text style={[styles.emptySub, { color: theme.textTer }]}>Add subjects to start studying with flashcards</Text>
          </View>
        ) : (
          subjects.map(s => <SubjectSection key={s.id} subject={s} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: "700" },
  headerSub: { fontSize: 14, marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  subjectSection: { marginBottom: 12 },
  subjectHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  subjectIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  subjectName: { flex: 1, fontSize: 16, fontWeight: "600" },
  topicsContainer: {
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    paddingHorizontal: 14, paddingBottom: 10, borderTopWidth: 1,
  },
  noTopics: { fontSize: 14, padding: 16, textAlign: "center" },
  topicCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1,
  },
  topicLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  topicIconBox: { width: 34, height: 34, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 14, fontWeight: "600" },
  topicSub: { fontSize: 12, marginTop: 2 },
  topicRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressPill: { width: 48, height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 4, textAlign: "center" },
});
