import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";

const API_URL = "http://localhost:5002/api";

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

const emptyQuestion = () => ({
  text: "",
  type: "multiple_choice",
  difficulty: "medium",
  explanation: "",
  answers: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

export default function CreateManual() {
  const [step, setStep] = useState(1);

  // Step 1 state
  const { subjects, loadData: loadSubjects, isLoading: subjectsLoading } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const { topics, loadTopics, isLoading: topicsLoading } = useTopics(selectedSubject?.id);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [isNewTopic, setIsNewTopic] = useState(false);

  // Step 2 state
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(emptyQuestion());
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);
  useEffect(() => {
    if (selectedSubject) {
      setSelectedTopic(null);
      setIsNewTopic(false);
      setNewTopicName("");
      loadTopics();
    }
  }, [selectedSubject]);

  // ─── Step 1 helpers ────────────────────────────────────────────────────────

  const canProceed = selectedSubject && (isNewTopic ? newTopicName.trim() : selectedTopic);

  // ─── Step 2 helpers ────────────────────────────────────────────────────────

  const setAnswer = (index, field, value) => {
    setCurrent(prev => {
      const answers = [...prev.answers];
      answers[index] = { ...answers[index], [field]: value };
      return { ...prev, answers };
    });
  };

  const markCorrect = (index) => {
    setCurrent(prev => ({
      ...prev,
      answers: prev.answers.map((a, i) => ({ ...a, isCorrect: i === index })),
    }));
  };

  const onTypeChange = (type) => {
    const baseAnswers =
      type === "true_false"
        ? [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }]
        : type === "short_answer"
        ? [{ text: "", isCorrect: true }]
        : [{ text: "", isCorrect: false }, { text: "", isCorrect: false },
           { text: "", isCorrect: false }, { text: "", isCorrect: false }];
    setCurrent(prev => ({ ...prev, type, answers: baseAnswers }));
  };

  const addQuestion = () => {
    if (!current.text.trim()) {
      Alert.alert("Missing question", "Please enter the question text.");
      return;
    }
    const hasCorrect = current.answers.some(a => a.isCorrect);
    if (current.type !== "short_answer" && !hasCorrect) {
      Alert.alert("No correct answer", "Please mark one answer as correct.");
      return;
    }
    const filledAnswers = current.answers.filter(a => a.text.trim());
    if (current.type === "multiple_choice" && filledAnswers.length < 2) {
      Alert.alert("Not enough answers", "Add at least 2 answer options.");
      return;
    }
    setQuestions(prev => [...prev, current]);
    setCurrent(emptyQuestion());
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const saveQuiz = async () => {
    if (questions.length === 0) {
      Alert.alert("No questions", "Add at least one question before saving.");
      return;
    }
    setSaving(true);
    try {
      let topicId = selectedTopic?.id;

      if (isNewTopic) {
        const res = await fetch(`${API_URL}/topics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject_id: selectedSubject.id, name: newTopicName.trim() }),
        });
        if (!res.ok) throw new Error("Failed to create topic");
        const topic = await res.json();
        topicId = topic.id;
      }

      for (const q of questions) {
        const res = await fetch(`${API_URL}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic_id: topicId,
            question_text: q.text,
            question_type: q.type,
            difficulty: q.difficulty,
            explanation: q.explanation || null,
            answers: q.answers
              .filter(a => a.text.trim())
              .map((a, i) => ({ answer_text: a.text, is_correct: a.isCorrect, order_index: i })),
          }),
        });
        if (!res.ok) throw new Error("Failed to save question");
      }

      Alert.alert("Saved!", `${questions.length} question${questions.length > 1 ? "s" : ""} saved.`, [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Manual Creation</Text>
            <Text style={styles.headerSub}>Step {step} of 2 — {step === 1 ? "Subject & Topic" : "Add Questions"}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Step indicator */}
        <View style={styles.stepBar}>
          <View style={[styles.stepFill, { width: step === 1 ? "50%" : "100%" }]} />
        </View>

        {step === 1 ? (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Subject picker */}
            <Text style={styles.sectionLabel}>Subject</Text>
            {subjectsLoading ? (
              <ActivityIndicator color="#8641f4" />
            ) : (
              <View style={styles.chipRow}>
                {subjects.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.chip, selectedSubject?.id === s.id && styles.chipSelected]}
                    onPress={() => setSelectedSubject(s)}
                  >
                    <Ionicons
                      name={s.icon || "school"}
                      size={14}
                      color={selectedSubject?.id === s.id ? "#FFF" : (s.iconColor || "#8641f4")}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.chipText, selectedSubject?.id === s.id && styles.chipTextSelected]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Topic picker */}
            {selectedSubject && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Topic</Text>
                {topicsLoading ? (
                  <ActivityIndicator color="#8641f4" />
                ) : (
                  <>
                    {topics.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[styles.topicRow, !isNewTopic && selectedTopic?.id === t.id && styles.topicRowSelected]}
                        onPress={() => { setSelectedTopic(t); setIsNewTopic(false); }}
                      >
                        <Ionicons
                          name={!isNewTopic && selectedTopic?.id === t.id ? "radio-button-on" : "radio-button-off"}
                          size={20}
                          color="#8641f4"
                        />
                        <Text style={styles.topicName}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}

                    {/* New topic option */}
                    <TouchableOpacity
                      style={[styles.topicRow, isNewTopic && styles.topicRowSelected]}
                      onPress={() => { setIsNewTopic(true); setSelectedTopic(null); }}
                    >
                      <Ionicons name={isNewTopic ? "radio-button-on" : "radio-button-off"} size={20} color="#8641f4" />
                      <Text style={styles.topicName}>+ Create new topic</Text>
                    </TouchableOpacity>

                    {isNewTopic && (
                      <TextInput
                        style={styles.input}
                        placeholder="Topic name"
                        placeholderTextColor="#999"
                        value={newTopicName}
                        onChangeText={setNewTopicName}
                        autoFocus
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {/* Added questions summary */}
            {questions.length > 0 && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{questions.length} question{questions.length > 1 ? "s" : ""} added</Text>
                {questions.map((q, i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summaryText} numberOfLines={1}>
                      {i + 1}. {q.text}
                    </Text>
                    <TouchableOpacity onPress={() => removeQuestion(i)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Question builder */}
            <Text style={styles.sectionLabel}>Question text</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="e.g. What is the capital of France?"
              placeholderTextColor="#999"
              value={current.text}
              onChangeText={t => setCurrent(p => ({ ...p, text: t }))}
              multiline
            />

            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.pillRow}>
              {QUESTION_TYPES.map(qt => (
                <TouchableOpacity
                  key={qt.key}
                  style={[styles.pill, current.type === qt.key && styles.pillSelected]}
                  onPress={() => onTypeChange(qt.key)}
                >
                  <Ionicons name={qt.icon} size={14} color={current.type === qt.key ? "#FFF" : "#666"} style={{ marginRight: 4 }} />
                  <Text style={[styles.pillText, current.type === qt.key && styles.pillTextSelected]}>{qt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Difficulty</Text>
            <View style={styles.pillRow}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[styles.pill, current.difficulty === d.key && { backgroundColor: d.color, borderColor: d.color }]}
                  onPress={() => setCurrent(p => ({ ...p, difficulty: d.key }))}
                >
                  <Text style={[styles.pillText, current.difficulty === d.key && styles.pillTextSelected]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Answers */}
            <Text style={styles.sectionLabel}>
              {current.type === "short_answer" ? "Correct answer" : "Answer options"}
            </Text>

            {current.type === "multiple_choice" && current.answers.map((ans, i) => (
              <View key={i} style={styles.answerRow}>
                <TouchableOpacity onPress={() => markCorrect(i)} style={styles.radioBtn}>
                  <Ionicons
                    name={ans.isCorrect ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={ans.isCorrect ? "#10B981" : "#CCC"}
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

            {current.type === "true_false" && (
              <View style={styles.pillRow}>
                {["True", "False"].map((label, i) => (
                  <TouchableOpacity
                    key={label}
                    style={[styles.tfBtn, current.answers[i]?.isCorrect && styles.tfBtnSelected]}
                    onPress={() => markCorrect(i)}
                  >
                    <Ionicons
                      name={label === "True" ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={current.answers[i]?.isCorrect ? "#FFF" : "#666"}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.tfText, current.answers[i]?.isCorrect && { color: "#FFF" }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {current.type === "short_answer" && (
              <TextInput
                style={styles.input}
                placeholder="Correct answer"
                placeholderTextColor="#999"
                value={current.answers[0]?.text || ""}
                onChangeText={v => setAnswer(0, "text", v)}
              />
            )}

            {/* Explanation */}
            <Text style={styles.sectionLabel}>Explanation <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Why is this the correct answer?"
              placeholderTextColor="#999"
              value={current.explanation}
              onChangeText={t => setCurrent(p => ({ ...p, explanation: t }))}
              multiline
            />

            <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
              <Ionicons name="add-circle-outline" size={20} color="#8641f4" style={{ marginRight: 8 }} />
              <Text style={styles.addBtnText}>Add Question</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {step === 1 ? (
            <TouchableOpacity
              style={[styles.primaryBtn, !canProceed && styles.primaryBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!canProceed}
            >
              <Text style={styles.primaryBtnText}>Next — Add Questions</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, (questions.length === 0 || saving) && styles.primaryBtnDisabled]}
              onPress={saveQuiz}
              disabled={questions.length === 0 || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Save Quiz ({questions.length})</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
    backgroundColor: "#FFF", borderBottomWidth: 1, borderBottomColor: "#E0E0E0",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#000", textAlign: "center" },
  headerSub: { fontSize: 12, color: "#999", textAlign: "center", marginTop: 2 },
  stepBar: { height: 3, backgroundColor: "#E0E0E0" },
  stepFill: { height: 3, backgroundColor: "#8641f4" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  optional: { fontWeight: "400", color: "#AAA", textTransform: "none" },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  chipSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
  chipText: { fontSize: 14, color: "#333" },
  chipTextSelected: { color: "#FFF", fontWeight: "600" },

  // Topics
  topicRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FFF", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: "transparent",
  },
  topicRowSelected: { borderColor: "#8641f4" },
  topicName: { fontSize: 15, color: "#333" },

  // Input
  input: {
    backgroundColor: "#FFF", borderRadius: 12, padding: 14,
    fontSize: 15, color: "#000", borderWidth: 1.5, borderColor: "#E8E8E8", marginBottom: 16,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },

  // Pills
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  pill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#FFF", borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  pillSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
  pillText: { fontSize: 13, color: "#555", fontWeight: "500" },
  pillTextSelected: { color: "#FFF" },

  // Answers
  answerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
  radioBtn: { padding: 2 },
  answerInput: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#000",
    borderWidth: 1.5, borderColor: "#E8E8E8",
  },

  // True/False
  tfBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 12, borderRadius: 12, backgroundColor: "#FFF",
    borderWidth: 1.5, borderColor: "#E0E0E0",
  },
  tfBtnSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
  tfText: { fontSize: 15, fontWeight: "600", color: "#555" },

  // Summary
  summaryBox: {
    backgroundColor: "#FFF", borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: "#E0E0E0",
  },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: "#8641f4", marginBottom: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  summaryText: { flex: 1, fontSize: 13, color: "#555", marginRight: 8 },

  // Add button
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: "#8641f4", marginTop: 4, marginBottom: 20,
  },
  addBtnText: { fontSize: 15, fontWeight: "600", color: "#8641f4" },

  // Footer
  footer: { padding: 20, paddingBottom: 36, backgroundColor: "#F5F5F5", borderTopWidth: 1, borderTopColor: "#E8E8E8" },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#8641f4", borderRadius: 16, paddingVertical: 16,
  },
  primaryBtnDisabled: { backgroundColor: "#C4A0F8" },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
});
