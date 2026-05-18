import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "http://localhost:5002/api";

const DIFFICULTY_COLOR = { easy: "#10B981", medium: "#F59E0B", hard: "#EF4444" };
const TYPE_LABEL = { multiple_choice: "MCQ", true_false: "T/F", short_answer: "Short" };

const QUESTION_TYPES = [
  { key: "multiple_choice", label: "Multiple Choice", icon: "list" },
  { key: "true_false",      label: "True / False",    icon: "checkmark-circle" },
  { key: "short_answer",    label: "Short Answer",    icon: "create" },
];
const DIFFICULTIES = [
  { key: "easy",   label: "Easy",   color: "#10B981" },
  { key: "medium", label: "Medium", color: "#F59E0B" },
  { key: "hard",   label: "Hard",   color: "#EF4444" },
];

const emptyForm = () => ({
  text: "", type: "multiple_choice", difficulty: "medium", explanation: "",
  answers: [
    { text: "", isCorrect: false }, { text: "", isCorrect: false },
    { text: "", isCorrect: false }, { text: "", isCorrect: false },
  ],
});

export default function TopicDetail() {
  const { topicId, topicName, subjectColor } = useLocalSearchParams();
  const resolvedColor = subjectColor || "#8641f4";

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [formError, setFormError] = useState("");

  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/questions/${topicId}`);
      if (!res.ok) throw new Error();
      setQuestions(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topicId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  // ── Form helpers ────────────────────────────────────────────────────────────

  const setAnswer = (i, field, value) =>
    setForm(prev => {
      const answers = [...prev.answers];
      answers[i] = { ...answers[i], [field]: value };
      return { ...prev, answers };
    });

  const markCorrect = (i) =>
    setForm(prev => ({
      ...prev,
      answers: prev.answers.map((a, idx) => ({ ...a, isCorrect: idx === i })),
    }));

  const onTypeChange = (type) => {
    const answers =
      type === "true_false"
        ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
        : type === "short_answer"
        ? [{ text: "", isCorrect: true }]
        : [{ text: "", isCorrect: false }, { text: "", isCorrect: false },
           { text: "", isCorrect: false }, { text: "", isCorrect: false }];
    setForm(prev => ({ ...prev, type, answers }));
  };

  const openModal = () => {
    setForm(emptyForm());
    setSavedCount(0);
    setFormError("");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    // Reload so the list reflects everything that was added
    loadQuestions();
  };

  const handleSave = async () => {
    setFormError("");

    if (!form.text.trim()) {
      setFormError("Please enter the question text.");
      return;
    }
    if (form.type === "short_answer" && !form.answers[0]?.text.trim()) {
      setFormError("Please enter the correct answer.");
      return;
    }
    const filledAnswers = form.answers.filter(a => a.text.trim());
    if (form.type === "multiple_choice" && filledAnswers.length < 2) {
      setFormError("Fill in at least 2 answer options.");
      return;
    }
    const hasCorrect = form.answers.some(a => a.isCorrect);
    if (form.type !== "short_answer" && !hasCorrect) {
      setFormError("Tap the circle next to the correct answer.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic_id: Number(topicId),
          question_text: form.text.trim(),
          question_type: form.type,
          difficulty: form.difficulty,
          explanation: form.explanation.trim() || null,
          answers: filledAnswers.map((a, i) => ({
            answer_text: a.text.trim(),
            is_correct: a.isCorrect,
            order_index: i,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setFormError(err.message || "Server error — question not saved.");
        return;
      }
      setSavedCount(c => c + 1);
      setForm(emptyForm());
      setFormError("");
    } catch {
      setFormError("Network error — check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: resolvedColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topicName}</Text>
        <TouchableOpacity onPress={openModal} style={styles.addHeaderBtn}>
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={resolvedColor} />}
      >
        {isLoading ? (
          <ActivityIndicator color={resolvedColor} style={{ marginTop: 40 }} />
        ) : questions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="help-circle-outline" size={52} color="#CCC" />
            <Text style={styles.emptyTitle}>No questions yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first question</Text>
          </View>
        ) : (
          <>
            <Text style={styles.countLabel}>
              {questions.length} question{questions.length !== 1 ? "s" : ""}
            </Text>
            {questions.map((q, i) => {
              const isOpen = expanded === q.id;
              const diffColor = DIFFICULTY_COLOR[q.difficulty] || "#999";
              return (
                <TouchableOpacity
                  key={q.id}
                  style={styles.card}
                  onPress={() => setExpanded(isOpen ? null : q.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.indexBadge, { backgroundColor: resolvedColor + "20" }]}>
                      <Text style={[styles.indexText, { color: resolvedColor }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={styles.questionText}>{q.question_text}</Text>
                      <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: diffColor + "22" }]}>
                          <Text style={[styles.badgeText, { color: diffColor }]}>{q.difficulty}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: "#8641f422" }]}>
                          <Text style={[styles.badgeText, { color: "#8641f4" }]}>{TYPE_LABEL[q.question_type]}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color="#CCC" />
                  </View>
                  {isOpen && (
                    <View style={styles.answersSection}>
                      {(q.answers || []).map((a, ai) => (
                        <View key={ai} style={[styles.answerRow, a.is_correct && styles.answerRowCorrect]}>
                          <Ionicons
                            name={a.is_correct ? "checkmark-circle" : "ellipse-outline"}
                            size={18} color={a.is_correct ? "#10B981" : "#CCC"}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[styles.answerText, a.is_correct && styles.answerTextCorrect]}>
                            {a.answer_text}
                          </Text>
                        </View>
                      ))}
                      {q.explanation ? (
                        <View style={styles.explanation}>
                          <Ionicons name="information-circle-outline" size={15} color="#8641f4" style={{ marginRight: 6 }} />
                          <Text style={styles.explanationText}>{q.explanation}</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: resolvedColor }]} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Add Question Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Add Question</Text>
              {savedCount > 0 && (
                <View style={styles.savedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={styles.savedBadgeText}>{savedCount} saved</Text>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Question text */}
              <Text style={styles.label}>Question</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="e.g. What is the capital of France?"
                placeholderTextColor="#999"
                value={form.text}
                onChangeText={t => setForm(p => ({ ...p, text: t }))}
                multiline autoFocus
              />

              {/* Type */}
              <Text style={styles.label}>Type</Text>
              <View style={styles.pillRow}>
                {QUESTION_TYPES.map(qt => (
                  <TouchableOpacity
                    key={qt.key}
                    style={[styles.pill, form.type === qt.key && styles.pillSelected]}
                    onPress={() => onTypeChange(qt.key)}
                  >
                    <Ionicons name={qt.icon} size={13} color={form.type === qt.key ? "#FFF" : "#666"} style={{ marginRight: 4 }} />
                    <Text style={[styles.pillText, form.type === qt.key && styles.pillTextSel]}>{qt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.pillRow}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.pill, form.difficulty === d.key && { backgroundColor: d.color, borderColor: d.color }]}
                    onPress={() => setForm(p => ({ ...p, difficulty: d.key }))}
                  >
                    <Text style={[styles.pillText, form.difficulty === d.key && styles.pillTextSel]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Answers */}
              <Text style={styles.label}>
                {form.type === "short_answer" ? "Correct answer" : "Answer options"}
              </Text>

              {form.type === "multiple_choice" && form.answers.map((ans, i) => (
                <View key={i} style={styles.answerInputRow}>
                  <TouchableOpacity onPress={() => markCorrect(i)}>
                    <Ionicons
                      name={ans.isCorrect ? "checkmark-circle" : "ellipse-outline"}
                      size={22} color={ans.isCorrect ? "#10B981" : "#CCC"}
                    />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.answerInput}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor="#BBB"
                    value={ans.text}
                    onChangeText={v => setAnswer(i, "text", v)}
                  />
                </View>
              ))}

              {form.type === "true_false" && (
                <View style={styles.pillRow}>
                  {["True", "False"].map((label, i) => (
                    <TouchableOpacity
                      key={label}
                      style={[styles.tfBtn, form.answers[i]?.isCorrect && { backgroundColor: resolvedColor, borderColor: resolvedColor }]}
                      onPress={() => markCorrect(i)}
                    >
                      <Text style={[styles.tfText, form.answers[i]?.isCorrect && { color: "#FFF" }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {form.type === "short_answer" && (
                <TextInput
                  style={styles.input}
                  placeholder="Correct answer"
                  placeholderTextColor="#999"
                  value={form.answers[0]?.text || ""}
                  onChangeText={v => setAnswer(0, "text", v)}
                />
              )}

              {/* Explanation */}
              <Text style={styles.label}>
                Explanation <Text style={{ fontWeight: "400", color: "#AAA" }}>(optional)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.multiline, { marginBottom: 24 }]}
                placeholder="Why is this the correct answer?"
                placeholderTextColor="#999"
                value={form.explanation}
                onChangeText={t => setForm(p => ({ ...p, explanation: t }))}
                multiline
              />
            </ScrollView>

            {/* Inline error */}
            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                <Text style={styles.cancelBtnText}>{savedCount > 0 ? "Done" : "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: resolvedColor }, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.saveBtnText}>Save Question</Text>
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
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
  },
  backButton: { width: 36, height: 36, justifyContent: "center" },
  addHeaderBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF", flex: 1, textAlign: "center" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  countLabel: { fontSize: 13, color: "#999", fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 14,
    marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  indexBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  indexText: { fontSize: 13, fontWeight: "700" },
  cardMeta: { flex: 1 },
  questionText: { fontSize: 14, fontWeight: "600", color: "#000", lineHeight: 20, marginBottom: 6 },
  badges: { flexDirection: "row", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  answersSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingTop: 12, gap: 6 },
  answerRow: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 8, backgroundColor: "#FAFAFA" },
  answerRowCorrect: { backgroundColor: "#F0FDF4" },
  answerText: { fontSize: 14, color: "#555", flex: 1 },
  answerTextCorrect: { color: "#10B981", fontWeight: "600" },
  explanation: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, padding: 10, backgroundColor: "#F5F0FF", borderRadius: 8 },
  explanationText: { fontSize: 13, color: "#8641f4", flex: 1, lineHeight: 18 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#BBB", marginTop: 4, textAlign: "center" },

  fab: {
    position: "absolute", bottom: 28, right: 24,
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36,
    maxHeight: "88%",
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0", alignSelf: "center", marginBottom: 16 },
  modalTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#000" },
  savedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  savedBadgeText: { fontSize: 13, fontWeight: "600", color: "#10B981" },
  label: { fontSize: 12, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: "#000", marginBottom: 16,
    borderWidth: 1.5, borderColor: "#E8E8E8",
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  pillSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
  pillText: { fontSize: 13, color: "#555", fontWeight: "500" },
  pillTextSel: { color: "#FFF" },
  answerInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  answerInput: {
    flex: 1, backgroundColor: "#F5F5F5", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#000",
    borderWidth: 1.5, borderColor: "#E8E8E8",
  },
  tfBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 12, backgroundColor: "#FFF",
    borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  tfText: { fontSize: 15, fontWeight: "600", color: "#555" },
  errorBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10, marginBottom: 12,
  },
  errorText: { fontSize: 13, color: "#EF4444", flex: 1, lineHeight: 18 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: "#F5F5F5", alignItems: "center" },
  cancelBtnText: { fontSize: 16, fontWeight: "600", color: "#666" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
