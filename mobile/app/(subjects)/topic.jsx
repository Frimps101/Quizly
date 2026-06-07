import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

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
  const theme = useTheme();
  const resolvedColor = subjectColor || "#8641f4";

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);

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
    loadQuestions();
  };

  const handleSave = async () => {
    setFormError("");
    if (!form.text.trim()) { setFormError("Please enter the question text."); return; }
    if (form.type === "short_answer" && !form.answers[0]?.text.trim()) { setFormError("Please enter the correct answer."); return; }
    const filledAnswers = form.answers.filter(a => a.text.trim());
    if (form.type === "multiple_choice" && filledAnswers.length < 2) { setFormError("Fill in at least 2 answer options."); return; }
    const hasCorrect = form.answers.some(a => a.isCorrect);
    if (form.type !== "short_answer" && !hasCorrect) { setFormError("Tap the circle next to the correct answer."); return; }

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

  const s = makeStyles(theme);

  return (
    <View style={s.container}>
      <View style={[s.header, { backgroundColor: resolvedColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{topicName}</Text>
        <TouchableOpacity onPress={openModal} style={s.addHeaderBtn}>
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={resolvedColor} />}
      >
        {isLoading ? (
          <ActivityIndicator color={resolvedColor} style={{ marginTop: 40 }} />
        ) : questions.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="help-circle-outline" size={52} color={theme.textTer} />
            <Text style={s.emptyTitle}>No questions yet</Text>
            <Text style={s.emptySub}>Tap + to add your first question</Text>
          </View>
        ) : (
          <>
            <Text style={s.countLabel}>{questions.length} question{questions.length !== 1 ? "s" : ""}</Text>
            {questions.map((q, i) => {
              const isOpen = expanded === q.id;
              const diffColor = DIFFICULTY_COLOR[q.difficulty] || theme.textTer;
              return (
                <TouchableOpacity key={q.id} style={s.card} onPress={() => setExpanded(isOpen ? null : q.id)} activeOpacity={0.8}>
                  <View style={s.cardHeader}>
                    <View style={[s.indexBadge, { backgroundColor: resolvedColor + "20" }]}>
                      <Text style={[s.indexText, { color: resolvedColor }]}>{i + 1}</Text>
                    </View>
                    <View style={s.cardMeta}>
                      <Text style={s.questionText}>{q.question_text}</Text>
                      <View style={s.badges}>
                        <View style={[s.badge, { backgroundColor: diffColor + "22" }]}>
                          <Text style={[s.badgeText, { color: diffColor }]}>{q.difficulty}</Text>
                        </View>
                        <View style={[s.badge, { backgroundColor: "#8641f422" }]}>
                          <Text style={[s.badgeText, { color: "#8641f4" }]}>{TYPE_LABEL[q.question_type]}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={theme.textTer} />
                  </View>
                  {isOpen && (
                    <View style={s.answersSection}>
                      {(q.answers || []).map((a, ai) => (
                        <View key={ai} style={[s.answerRow, a.is_correct && s.answerRowCorrect]}>
                          <Ionicons
                            name={a.is_correct ? "checkmark-circle" : "ellipse-outline"}
                            size={18} color={a.is_correct ? "#10B981" : theme.textTer}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={[s.answerText, a.is_correct && s.answerTextCorrect]}>{a.answer_text}</Text>
                        </View>
                      ))}
                      {q.explanation ? (
                        <View style={s.explanation}>
                          <Ionicons name="information-circle-outline" size={15} color="#8641f4" style={{ marginRight: 6 }} />
                          <Text style={s.explanationText}>{q.explanation}</Text>
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

      <TouchableOpacity style={[s.fab, { backgroundColor: resolvedColor }]} onPress={openModal} activeOpacity={0.85}>
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeModal} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>Add Question</Text>
              {savedCount > 0 && (
                <View style={s.savedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={s.savedBadgeText}>{savedCount} saved</Text>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.label}>Question</Text>
              <TextInput
                style={[s.input, s.multiline]}
                placeholder="e.g. What is the capital of France?"
                placeholderTextColor={theme.textTer}
                value={form.text}
                onChangeText={t => setForm(p => ({ ...p, text: t }))}
                multiline autoFocus
              />

              <Text style={s.label}>Type</Text>
              <View style={s.pillRow}>
                {QUESTION_TYPES.map(qt => (
                  <TouchableOpacity
                    key={qt.key}
                    style={[s.pill, form.type === qt.key && s.pillSelected]}
                    onPress={() => onTypeChange(qt.key)}
                  >
                    <Ionicons name={qt.icon} size={13} color={form.type === qt.key ? "#FFF" : theme.textSec} style={{ marginRight: 4 }} />
                    <Text style={[s.pillText, form.type === qt.key && s.pillTextSel]}>{qt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>Difficulty</Text>
              <View style={s.pillRow}>
                {DIFFICULTIES.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    style={[s.pill, form.difficulty === d.key && { backgroundColor: d.color, borderColor: d.color }]}
                    onPress={() => setForm(p => ({ ...p, difficulty: d.key }))}
                  >
                    <Text style={[s.pillText, form.difficulty === d.key && s.pillTextSel]}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.label}>{form.type === "short_answer" ? "Correct answer" : "Answer options"}</Text>

              {form.type === "multiple_choice" && form.answers.map((ans, i) => (
                <View key={i} style={s.answerInputRow}>
                  <TouchableOpacity onPress={() => markCorrect(i)}>
                    <Ionicons name={ans.isCorrect ? "checkmark-circle" : "ellipse-outline"} size={22} color={ans.isCorrect ? "#10B981" : theme.textTer} />
                  </TouchableOpacity>
                  <TextInput
                    style={s.answerInput}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor={theme.textTer}
                    value={ans.text}
                    onChangeText={v => setAnswer(i, "text", v)}
                  />
                </View>
              ))}

              {form.type === "true_false" && (
                <View style={s.pillRow}>
                  {["True", "False"].map((label, i) => (
                    <TouchableOpacity
                      key={label}
                      style={[s.tfBtn, form.answers[i]?.isCorrect && { backgroundColor: resolvedColor, borderColor: resolvedColor }]}
                      onPress={() => markCorrect(i)}
                    >
                      <Text style={[s.tfText, form.answers[i]?.isCorrect && { color: "#FFF" }]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {form.type === "short_answer" && (
                <TextInput
                  style={s.input}
                  placeholder="Correct answer"
                  placeholderTextColor={theme.textTer}
                  value={form.answers[0]?.text || ""}
                  onChangeText={v => setAnswer(0, "text", v)}
                />
              )}

              <Text style={s.label}>
                Explanation <Text style={{ fontWeight: "400", color: theme.textTer }}>(optional)</Text>
              </Text>
              <TextInput
                style={[s.input, s.multiline, { marginBottom: 24 }]}
                placeholder="Why is this the correct answer?"
                placeholderTextColor={theme.textTer}
                value={form.explanation}
                onChangeText={t => setForm(p => ({ ...p, explanation: t }))}
                multiline
              />
            </ScrollView>

            {formError ? (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={s.errorText}>{formError}</Text>
              </View>
            ) : null}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}>
                <Text style={s.cancelBtnText}>{savedCount > 0 ? "Done" : "Cancel"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, { backgroundColor: resolvedColor }, isSaving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={s.saveBtnText}>Save Question</Text>
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
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    },
    backButton: { width: 36, height: 36, justifyContent: "center" },
    addHeaderBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFF", flex: 1, textAlign: "center" },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    countLabel: { fontSize: 13, color: theme.textTer, fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 },
    card: {
      backgroundColor: theme.surface, borderRadius: 16, padding: 14, marginBottom: 10,
      shadowColor: theme.shadow, shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.isDark ? 0.3 : 0.06, shadowRadius: 4, elevation: 2,
    },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    indexBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    indexText: { fontSize: 13, fontWeight: "700" },
    cardMeta: { flex: 1 },
    questionText: { fontSize: 14, fontWeight: "600", color: theme.text, lineHeight: 20, marginBottom: 6 },
    badges: { flexDirection: "row", gap: 6 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: "700" },
    answersSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12, gap: 6 },
    answerRow: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 8, backgroundColor: theme.surface2 },
    answerRowCorrect: { backgroundColor: "#F0FDF4" },
    answerText: { fontSize: 14, color: theme.textSec, flex: 1 },
    answerTextCorrect: { color: "#10B981", fontWeight: "600" },
    explanation: { flexDirection: "row", alignItems: "flex-start", marginTop: 8, padding: 10, backgroundColor: theme.accentLight, borderRadius: 8 },
    explanationText: { fontSize: 13, color: "#8641f4", flex: 1, lineHeight: 18 },
    empty: { alignItems: "center", paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: theme.textTer, marginTop: 16 },
    emptySub: { fontSize: 14, color: theme.textTer, marginTop: 4, textAlign: "center" },
    fab: {
      position: "absolute", bottom: 28, right: 24,
      width: 58, height: 58, borderRadius: 29,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, maxHeight: "88%",
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.handleBar, alignSelf: "center", marginBottom: 16 },
    modalTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: "700", color: theme.text },
    savedBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0FDF4", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    savedBadgeText: { fontSize: 13, fontWeight: "600", color: "#10B981" },
    label: { fontSize: 12, fontWeight: "700", color: theme.textSec, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
    input: {
      backgroundColor: theme.inputBg, borderRadius: 12, paddingHorizontal: 14,
      paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 16,
      borderWidth: 1.5, borderColor: theme.border,
    },
    multiline: { minHeight: 72, textAlignVertical: "top" },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    pill: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
      backgroundColor: theme.surface2, borderWidth: 1.5, borderColor: theme.border,
    },
    pillSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
    pillText: { fontSize: 13, color: theme.textSec, fontWeight: "500" },
    pillTextSel: { color: "#FFF" },
    answerInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    answerInput: {
      flex: 1, backgroundColor: theme.inputBg, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text,
      borderWidth: 1.5, borderColor: theme.border,
    },
    tfBtn: {
      flex: 1, alignItems: "center", justifyContent: "center",
      paddingVertical: 12, borderRadius: 12, backgroundColor: theme.surface2,
      borderWidth: 1.5, borderColor: theme.border,
    },
    tfText: { fontSize: 15, fontWeight: "600", color: theme.textSec },
    errorBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderRadius: 10, padding: 10, marginBottom: 12 },
    errorText: { fontSize: 13, color: "#EF4444", flex: 1, lineHeight: 18 },
    modalActions: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: theme.inputBg, alignItems: "center" },
    cancelBtnText: { fontSize: 16, fontWeight: "600", color: theme.textSec },
    saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  });
}
