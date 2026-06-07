import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

const API_URL = "http://localhost:5002/api";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const STATUS_COLOR = { mastered: "#10B981", learning: "#F59E0B", new: "#CCC" };
const STATUS_ICON  = { mastered: "checkmark-circle", learning: "time", new: "ellipse-outline" };

export default function Progress() {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/progress/summary`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      // keep previous data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const overall = data?.overall || {};
  const total    = parseInt(overall.total_questions || 0);
  const mastered = parseInt(overall.total_mastered  || 0);
  const reviewed = parseInt(overall.total_reviewed  || 0);
  const subjects = parseInt(overall.total_subjects  || 0);
  const topics   = parseInt(overall.total_topics    || 0);
  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Progress</Text>
        <Text style={s.headerSub}>Track your learning journey</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#8641f4" style={{ marginTop: 60 }} size="large" />
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.statsRow}>
            <View style={[s.statCard, { backgroundColor: "#8641f4" }]}>
              <Text style={s.statNum}>{masteryPct}%</Text>
              <Text style={s.statLabel}>Mastery</Text>
            </View>
            <View style={s.statCardGroup}>
              <View style={[s.statCardSm, { backgroundColor: "#10B981" }]}>
                <Text style={s.statNumSm}>{mastered}</Text>
                <Text style={s.statLabelSm}>Mastered</Text>
              </View>
              <View style={[s.statCardSm, { backgroundColor: "#F59E0B" }]}>
                <Text style={s.statNumSm}>{total}</Text>
                <Text style={s.statLabelSm}>Questions</Text>
              </View>
            </View>
          </View>

          <View style={s.quickRow}>
            {[
              { icon: "albums-outline",  label: "Subjects", value: subjects },
              { icon: "layers-outline",  label: "Topics",   value: topics   },
              { icon: "eye-outline",     label: "Reviewed", value: reviewed  },
            ].map(stat => (
              <View key={stat.label} style={s.quickCard}>
                <Ionicons name={stat.icon} size={20} color="#8641f4" style={{ marginBottom: 6 }} />
                <Text style={s.quickNum}>{stat.value}</Text>
                <Text style={s.quickLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Overall Mastery</Text>
            <View style={s.bigBarTrack}>
              <View style={[s.bigBarFill, { width: `${masteryPct}%` }]} />
            </View>
            <View style={s.barLegend}>
              <Text style={s.barLegendText}>{mastered} mastered</Text>
              <Text style={s.barLegendText}>{total} total</Text>
            </View>
          </View>

          {data?.subjects?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>By Subject</Text>
              {data.subjects.map(subj => {
                const t = parseInt(subj.total_questions || 0);
                const m = parseInt(subj.mastered || 0);
                const pct = t > 0 ? Math.round((m / t) * 100) : 0;
                const color = subj.iconColor || "#8641f4";
                return (
                  <View key={subj.id} style={s.subjectRow}>
                    <View style={[s.subjectIcon, { backgroundColor: color + "22" }]}>
                      <Ionicons name={subj.icon || "school"} size={18} color={color} />
                    </View>
                    <View style={s.subjectInfo}>
                      <View style={s.subjectTopRow}>
                        <Text style={s.subjectName}>{subj.name}</Text>
                        <Text style={[s.subjectPct, { color }]}>{pct}%</Text>
                      </View>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                      <Text style={s.subjectMeta}>{m} / {t} questions mastered</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {data?.recentActivity?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent Activity</Text>
              {data.recentActivity.map((a, i) => {
                const color = a.iconColor || "#8641f4";
                const statusColor = STATUS_COLOR[a.status] || "#CCC";
                return (
                  <View key={i} style={s.activityRow}>
                    <View style={[s.activityIcon, { backgroundColor: color + "22" }]}>
                      <Ionicons name={a.icon || "school"} size={16} color={color} />
                    </View>
                    <View style={s.activityInfo}>
                      <Text style={s.activityQ} numberOfLines={1}>{a.question_text}</Text>
                      <Text style={s.activityMeta}>{a.subject_name} · {a.topic_name}</Text>
                    </View>
                    <View style={s.activityRight}>
                      <Ionicons name={STATUS_ICON[a.status]} size={16} color={statusColor} />
                      <Text style={s.activityTime}>{timeAgo(a.last_reviewed)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {total === 0 && (
            <View style={s.empty}>
              <Ionicons name="stats-chart-outline" size={56} color={theme.textTer} />
              <Text style={s.emptyTitle}>No activity yet</Text>
              <Text style={s.emptySub}>Start studying flashcards to see your progress here</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 26, fontWeight: "800", color: theme.text },
    headerSub: { fontSize: 14, color: theme.textTer, marginTop: 2 },
    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },
    statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
    statCard: { flex: 1, borderRadius: 20, padding: 20, justifyContent: "center", alignItems: "center" },
    statNum: { fontSize: 36, fontWeight: "800", color: "#FFF" },
    statLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2, fontWeight: "600" },
    statCardGroup: { flex: 1, gap: 12 },
    statCardSm: { flex: 1, borderRadius: 16, padding: 14, justifyContent: "center", alignItems: "center" },
    statNumSm: { fontSize: 24, fontWeight: "800", color: "#FFF" },
    statLabelSm: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 1, fontWeight: "600" },
    quickRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
    quickCard: {
      flex: 1, backgroundColor: theme.surface, borderRadius: 14, padding: 14, alignItems: "center",
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.05, shadowRadius: 3, elevation: 2,
    },
    quickNum: { fontSize: 20, fontWeight: "700", color: theme.text },
    quickLabel: { fontSize: 12, color: theme.textTer, marginTop: 2 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 14 },
    bigBarTrack: { height: 12, backgroundColor: theme.border, borderRadius: 6, overflow: "hidden" },
    bigBarFill: { height: "100%", backgroundColor: "#8641f4", borderRadius: 6 },
    barLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    barLegendText: { fontSize: 12, color: theme.textTer },
    subjectRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: theme.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    },
    subjectIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    subjectInfo: { flex: 1 },
    subjectTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    subjectName: { fontSize: 14, fontWeight: "600", color: theme.text },
    subjectPct: { fontSize: 13, fontWeight: "700" },
    barTrack: { height: 6, backgroundColor: theme.inputBg, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
    barFill: { height: "100%", borderRadius: 3 },
    subjectMeta: { fontSize: 11, color: theme.textTer },
    activityRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: theme.surface, borderRadius: 14, padding: 12, marginBottom: 8,
    },
    activityIcon: { width: 34, height: 34, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    activityInfo: { flex: 1 },
    activityQ: { fontSize: 13, fontWeight: "600", color: theme.text },
    activityMeta: { fontSize: 12, color: theme.textTer, marginTop: 2 },
    activityRight: { alignItems: "center", gap: 3 },
    activityTime: { fontSize: 10, color: theme.textTer },
    empty: { alignItems: "center", paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.textTer, marginTop: 16 },
    emptySub: { fontSize: 14, color: theme.textTer, marginTop: 4, textAlign: "center", lineHeight: 20 },
  });
}
