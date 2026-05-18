import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";

const API_URL = "http://localhost:5002/api";

function TopicRow({ topic, subjectColor, subjectIcon }) {
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
      style={styles.topicCard}
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
          <Text style={styles.topicName}>{topic.name}</Text>
          {total > 0 && (
            <Text style={styles.topicSub}>{mastered}/{total} mastered</Text>
          )}
        </View>
      </View>
      <View style={styles.topicRight}>
        {total > 0 && (
          <View style={styles.progressPill}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: subjectColor }]} />
          </View>
        )}
        <Ionicons name="play-circle" size={28} color={subjectColor} />
      </View>
    </TouchableOpacity>
  );
}

function SubjectSection({ subject }) {
  const resolvedColor = subject.iconColor || "#8641f4";
  const { topics, loadTopics, isLoading } = useTopics(subject.id);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) loadTopics();
  }, [expanded]);

  return (
    <View style={styles.subjectSection}>
      <TouchableOpacity
        style={[styles.subjectHeader, expanded && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={[styles.subjectIconBox, { backgroundColor: resolvedColor + "22" }]}>
          <Ionicons name={subject.icon || "school"} size={22} color={resolvedColor} />
        </View>
        <Text style={styles.subjectName}>{subject.name}</Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.topicsContainer}>
          {isLoading ? (
            <ActivityIndicator color={resolvedColor} style={{ padding: 16 }} />
          ) : topics.length === 0 ? (
            <Text style={styles.noTopics}>No topics available yet</Text>
          ) : (
            topics.map(t => (
              <TopicRow
                key={t.id}
                topic={t}
                subjectColor={resolvedColor}
                subjectIcon={subject.icon}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function Flashcards() {
  const { subjects, loadData, isLoading } = useSubjects();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flashcards</Text>
        <Text style={styles.headerSub}>Tap a subject to see topics</Text>
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
            <Ionicons name="albums-outline" size={52} color="#CCC" />
            <Text style={styles.emptyTitle}>No subjects yet</Text>
            <Text style={styles.emptySub}>Add subjects to start studying with flashcards</Text>
          </View>
        ) : (
          subjects.map(s => <SubjectSection key={s.id} subject={s} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0",
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#000" },
  headerSub: { fontSize: 14, color: "#999", marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  subjectSection: { marginBottom: 12 },
  subjectHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#FFF", borderRadius: 16, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  subjectIconBox: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  subjectName: { flex: 1, fontSize: 16, fontWeight: "600", color: "#000" },

  topicsContainer: {
    backgroundColor: "#FFF", borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16, paddingHorizontal: 14,
    paddingBottom: 10, borderTopWidth: 1, borderTopColor: "#F0F0F0",
  },
  noTopics: { fontSize: 14, color: "#BBB", padding: 16, textAlign: "center" },

  topicCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F5F5",
  },
  topicLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  topicIconBox: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  topicInfo: { flex: 1 },
  topicName: { fontSize: 14, fontWeight: "600", color: "#333" },
  topicSub: { fontSize: 12, color: "#999", marginTop: 2 },
  topicRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressPill: {
    width: 48, height: 5, backgroundColor: "#E0E0E0",
    borderRadius: 3, overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },

  empty: { alignItems: "center", paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#BBB", marginTop: 4, textAlign: "center" },
});
