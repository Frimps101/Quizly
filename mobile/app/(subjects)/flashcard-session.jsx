import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, interpolate, Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const API_URL = "http://localhost:5002/api";
const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W - 48;

export default function FlashcardSession() {
  const { topicId, topicName, subjectColor, subjectIcon } = useLocalSearchParams();
  const color = subjectColor || "#8641f4";

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState({ mastered: 0, learning: 0 });
  const [done, setDone] = useState(false);

  const rotation = useSharedValue(0);

  // ── Load questions ─────────────────────────────────────────────────────────
  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/questions/${topicId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setQuestions(data);
    } catch {
      // handled silently
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // ── Flip animation ─────────────────────────────────────────────────────────
  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: "hidden",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: "hidden",
    position: "absolute", top: 0, left: 0, right: 0,
  }));

  const flipCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = flipped ? 0 : 1;
    rotation.value = withTiming(target, { duration: 350 });
    setFlipped(!flipped);
  };

  const resetFlip = () => {
    rotation.value = withTiming(0, { duration: 250 });
    setFlipped(false);
  };

  // ── Answer ─────────────────────────────────────────────────────────────────
  const markCard = async (gotIt) => {
    Haptics.impactAsync(gotIt ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
    const q = questions[index];
    try {
      await fetch(`${API_URL}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: q.id, got_it: gotIt }),
      });
    } catch {}

    setResults(prev => ({
      mastered: prev.mastered + (gotIt ? 1 : 0),
      learning: prev.learning + (gotIt ? 0 : 1),
    }));

    const next = index + 1;
    if (next >= questions.length) {
      setDone(true);
    } else {
      resetFlip();
      setTimeout(() => setIndex(next), 260);
    }
  };

  const restart = () => {
    setIndex(0);
    setResults({ mastered: 0, learning: 0 });
    setDone(false);
    resetFlip();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const current = questions[index];
  const correctAnswer = current?.answers?.find(a => a.is_correct)?.answer_text || "";
  const progress = questions.length > 0 ? (index / questions.length) : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{topicName}</Text>
        {!done && questions.length > 0 && (
          <Text style={styles.counter}>{index + 1}/{questions.length}</Text>
        )}
      </View>

      {/* Progress bar */}
      {!done && (
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={color} size="large" />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="help-circle-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No questions in this topic yet</Text>
          <TouchableOpacity style={[styles.btn, { backgroundColor: color, marginTop: 24 }]} onPress={() => router.back()}>
            <Text style={styles.btnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : done ? (
        // ── Done screen ──────────────────────────────────────────────────────
        <View style={styles.center}>
          <Ionicons name="trophy" size={72} color={color} />
          <Text style={styles.doneTitle}>Session Complete!</Text>
          <Text style={styles.doneSub}>{topicName}</Text>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, { backgroundColor: "#F0FDF4" }]}>
              <Text style={[styles.scoreNum, { color: "#10B981" }]}>{results.mastered}</Text>
              <Text style={styles.scoreLabel}>Got it</Text>
            </View>
            <View style={[styles.scoreBox, { backgroundColor: "#FFF7ED" }]}>
              <Text style={[styles.scoreNum, { color: "#F97316" }]}>{results.learning}</Text>
              <Text style={styles.scoreLabel}>Review again</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, { backgroundColor: color }]} onPress={restart}>
            <Ionicons name="refresh" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.btnText}>Study Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnOutline, { borderColor: color, marginTop: 12 }]} onPress={() => router.back()}>
            <Text style={[styles.btnOutlineText, { color }]}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // ── Card ─────────────────────────────────────────────────────────────
        <View style={styles.sessionContainer}>
          <Text style={styles.tapHint}>
            {flipped ? "Choose an action below" : "Tap card to reveal answer"}
          </Text>

          <Pressable style={styles.cardWrapper} onPress={flipCard}>
            {/* Front */}
            <Animated.View style={[styles.card, frontStyle]}>
              <View style={[styles.cardTag, { backgroundColor: color + "22" }]}>
                <Text style={[styles.cardTagText, { color }]}>Question</Text>
              </View>
              <Text style={styles.questionText}>{current?.question_text}</Text>
              <Ionicons name="finger-print-outline" size={28} color="#DDD" style={{ marginTop: 24 }} />
            </Animated.View>

            {/* Back */}
            <Animated.View style={[styles.card, styles.cardBack, backStyle]}>
              <View style={[styles.cardTag, { backgroundColor: "#10B98122" }]}>
                <Text style={[styles.cardTagText, { color: "#10B981" }]}>Answer</Text>
              </View>
              <Text style={styles.answerText}>{correctAnswer}</Text>
              {current?.explanation ? (
                <View style={styles.explanation}>
                  <Ionicons name="information-circle-outline" size={14} color={color} style={{ marginRight: 4 }} />
                  <Text style={styles.explanationText}>{current.explanation}</Text>
                </View>
              ) : null}
            </Animated.View>
          </Pressable>

          {/* Action buttons — only visible when flipped */}
          {flipped && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.reviewBtn} onPress={() => markCard(false)}>
                <Ionicons name="close-circle" size={28} color="#F97316" />
                <Text style={styles.reviewBtnText}>Review again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gotItBtn} onPress={() => markCard(true)}>
                <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                <Text style={styles.gotItBtnText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, gap: 12,
  },
  backBtn: { width: 32, height: 32, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "700", color: "#FFF" },
  counter: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  progressBar: { height: 4, backgroundColor: "#E0E0E0" },
  progressFill: { height: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#999", marginTop: 16, textAlign: "center" },

  sessionContainer: { flex: 1, alignItems: "center", paddingTop: 20, paddingHorizontal: 24 },
  tapHint: { fontSize: 13, color: "#AAA", marginBottom: 20 },

  cardWrapper: { width: CARD_W, height: 280 },
  card: {
    width: CARD_W, height: 280, borderRadius: 24, backgroundColor: "#FFF",
    padding: 28, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  cardBack: { backgroundColor: "#FAFFFE" },
  cardTag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 20 },
  cardTagText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  questionText: { fontSize: 20, fontWeight: "600", color: "#000", textAlign: "center", lineHeight: 28 },
  answerText: { fontSize: 22, fontWeight: "700", color: "#10B981", textAlign: "center", lineHeight: 30 },
  explanation: {
    flexDirection: "row", alignItems: "flex-start", marginTop: 16,
    backgroundColor: "#F5F0FF", borderRadius: 10, padding: 10,
  },
  explanationText: { fontSize: 13, color: "#8641f4", flex: 1, lineHeight: 18 },

  actions: { flexDirection: "row", gap: 14, marginTop: 32, width: "100%" },
  reviewBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#FFF", borderRadius: 16, paddingVertical: 16,
    borderWidth: 2, borderColor: "#F97316",
  },
  reviewBtnText: { fontSize: 15, fontWeight: "700", color: "#F97316" },
  gotItBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#10B981", borderRadius: 16, paddingVertical: 16,
  },
  gotItBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  doneTitle: { fontSize: 26, fontWeight: "800", color: "#000", marginTop: 20 },
  doneSub: { fontSize: 15, color: "#999", marginTop: 4, marginBottom: 28 },
  scoreRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
  scoreBox: { flex: 1, alignItems: "center", padding: 20, borderRadius: 16 },
  scoreNum: { fontSize: 36, fontWeight: "800" },
  scoreLabel: { fontSize: 13, color: "#888", marginTop: 4 },
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 15, paddingHorizontal: 36, borderRadius: 16, width: "100%",
  },
  btnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  btnOutline: {
    paddingVertical: 14, paddingHorizontal: 36, borderRadius: 16,
    borderWidth: 2, width: "100%", alignItems: "center",
  },
  btnOutlineText: { fontSize: 16, fontWeight: "700" },
});
