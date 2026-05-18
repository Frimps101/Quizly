import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTopics } from "../../hooks/useTopics";

export default function SubjectDetail() {
  const { id, name, icon, iconColor } = useLocalSearchParams();
  const resolvedColor = iconColor || "#8641f4";
  const resolvedIcon = icon || "school";

  const { topics, loadTopics, isLoading } = useTopics(id);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopics();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: resolvedColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.iconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Ionicons name={resolvedIcon} size={36} color="#FFF" />
          </View>
          <Text style={styles.headerTitle}>{name}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>
          Topics
          {!isLoading && (
            <Text style={styles.topicCount}> ({topics.length})</Text>
          )}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={resolvedColor} style={{ marginTop: 40 }} />
        ) : topics.length > 0 ? (
          topics.map((topic, index) => (
            <TouchableOpacity
              key={topic.id}
              style={styles.topicRow}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: "/(subjects)/topic",
                  params: { topicId: topic.id, topicName: topic.name, subjectColor: resolvedColor },
                })
              }
            >
              <View style={[styles.topicIndex, { backgroundColor: resolvedColor + "20" }]}>
                <Text style={[styles.topicIndexText, { color: resolvedColor }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.topicInfo}>
                <Text style={styles.topicName}>{topic.name}</Text>
                {topic.description ? (
                  <Text style={styles.topicDescription}>{topic.description}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCC" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={52} color="#CCC" />
            <Text style={styles.emptyTitle}>No topics yet</Text>
            <Text style={styles.emptySubtext}>Topics for this subject will appear here</Text>
          </View>
        )}
      </ScrollView>

      {/* Start Quiz Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: resolvedColor }]}
          activeOpacity={0.85}
          onPress={() => router.push("/(subjects)/create-quiz")}
        >
          <Ionicons name="rocket-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.startButtonText}>Start Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingTop: 56,
    paddingBottom: 28,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerContent: {
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  topicCount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  topicIndex: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  topicIndexText: {
    fontSize: 14,
    fontWeight: "700",
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  topicDescription: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#BBB",
    marginTop: 4,
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  startButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFF",
  },
});
