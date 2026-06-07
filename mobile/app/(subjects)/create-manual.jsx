import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSubjects } from "../../hooks/useSubjects";
import { useTopics } from "../../hooks/useTopics";
import { useTheme } from "../../hooks/useTheme";

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
  const theme = useTheme();
  const [step, setStep] = useState(1);

  const { subjects, loadData: loadSubjects, isLoading: subjectsLoading } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState(null);
  const { topics, loadTopics, isLoading: topicsLoading } = useTopics(selectedSubject?.id);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [isNewTopic, setIsNewTopic] = useState(false);

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

  const canProceed = selectedSubject && (isNewTopic ? newTopicName.trim() : selectedTopic);

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
    if (!current.text.trim()) { Alert.alert("Missing question", "Please enter the question text."); return; }
    const hasCorrect = current.answers.some(a => a.isCorrect);
    if (current.type !== "short_answer" && !hasCorrect) { Alert.alert("No correct answer", "Please mark one answer as correct."); return; }
    const filledAnswers = current.answers.filter(a => a.text.trim());
    if (current.type === "multiple_choice" && filledAnswers.length < 2) { Alert.alert("Not enough answers", "Add at least 2 answer options."); return; }
    setQuestions(prev => [...prev, current]);
    setCurrent(emptyQuestion());
  };

  const removeQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const saveQuiz = async () => {
    if (questions.length === 0) { Alert.alert("No questions", "Add at least one question before saving."); return; }
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

  const s = makeStyles(theme);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())} style={s.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Manual Creation</Text>
            <Text style={s.headerSub}>Step {step} of 2 — {step === 1 ? "Subject & Topic" : "Add Questions"}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.stepBar}>
          <View style={[s.stepFill, { width: step === 1 ? "50%" : "100%" }]} />
        </View>

        {step === 1 ? (
          <ScrollView style={s.scroll} contentContainerStyle={s.content}>
            <Text style={s.sectionLabel}>Subject</Text>
            {subjectsLoading ? (
              <ActivityIndicator color="#8641f4" />
            ) : (
              <View style={s.chipRow}>
                {subjects.map(subj => (
                  <TouchableOpacity
                    key={subj.id}
                    style={[s.chip, selectedSubject?.id === subj.id && s.chipSelected]}
                    onPress={() => setSelectedSubject(subj)}
                  >
                    <Ionicons
                      name={subj.icon || "school"}
                      size={14}
                      color={selectedSubject?.id === subj.id ? "#FFF" : (subj.iconColor || "#8641f4")}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[s.chipText, selectedSubject?.id === subj.id && s.chipTextSelected]}>{subj.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {selectedSubject && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 24 }]}>Topic</Text>
                {topicsLoading ? (
                  <ActivityIndicator color="#8641f4" />
                ) : (
                  <>
                    {topics.map(t => (
                      <TouchableOpacity
                        key={t.id}
                        style={[s.topicRow, !isNewTopic && selectedTopic?.id === t.id && s.topicRowSelected]}
                        onPress={() => { setSelectedTopic(t); setIsNewTopic(false); }}
                      >
                        <Ionicons
                          name={!isNewTopic && selectedTopic?.id === t.id ? "radio-button-on" : "radio-button-off"}
                          size={20} color="#8641f4"
                        />
                        <Text style={s.topicName}>{t.name}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[s.topicRow, isNewTopic && s.topicRowSelected]}
                      onPress={() => { setIsNewTopic(true); setSelectedTopic(null); }}
                    >
                      <Ionicons name={isNewTopic ? "radio-button-on" : "radio-button-off"} size={20} color="#8641f4" />
                      <Text style={s.topicName}>+ Create new topic</Text>
                    </TouchableOpacity>
                    {isNewTopic && (
                      <TextInput
                        style={s.input}
                        placeholder="Topic name"
                        placeholderTextColor={theme.textTer}
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
          <ScrollView style={s.scroll} contentContainerStyle={s.content}>
            {questions.length > 0 && (
              <View style={s.summaryBox}>
                <Text style={s.summaryTitle}>{questions.length} question{questions.length > 1 ? "s" : ""} added</Text>
                {questions.map((q, i) => (
                  <View key={i} style={s.summaryRow}>
                    <Text style={s.summaryText} numberOfLines={1}>{i + 1}. {q.text}</Text>
                    <TouchableOpacity onPress={() => removeQuestion(i)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={s.sectionLabel}>Question text</Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="e.g. What is the capital of France?"
              placeholderTextColor={theme.textTer}
              value={current.text}
              onChangeText={t => setCurrent(p => ({ ...p, text: t }))}
              multiline
            />

            <Text style={s.sectionLabel}>Type</Text>
            <View style={s.pillRow}>
              {QUESTION_TYPES.map(qt => (
                <TouchableOpacity
                  key={qt.key}
                  style={[s.pill, current.type === qt.key && s.pillSelected]}
                  onPress={() => onTypeChange(qt.key)}
                >
                  <Ionicons name={qt.icon} size={14} color={current.type === qt.key ? "#FFF" : theme.textSec} style={{ marginRight: 4 }} />
                  <Text style={[s.pillText, current.type === qt.key && s.pillTextSelected]}>{qt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>Difficulty</Text>
            <View style={s.pillRow}>
              {DIFFICULTIES.map(d => (
                <TouchableOpacity
                  key={d.key}
                  style={[s.pill, current.difficulty === d.key && { backgroundColor: d.color, borderColor: d.color }]}
                  onPress={() => setCurrent(p => ({ ...p, difficulty: d.key }))}
                >
                  <Text style={[s.pillText, current.difficulty === d.key && s.pillTextSelected]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.sectionLabel}>
              {current.type === "short_answer" ? "Correct answer" : "Answer options"}
            </Text>

            {current.type === "multiple_choice" && current.answers.map((ans, i) => (
              <View key={i} style={s.answerRow}>
                <TouchableOpacity onPress={() => markCorrect(i)} style={s.radioBtn}>
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

            {current.type === "true_false" && (
              <View style={s.pillRow}>
                {["True", "False"].map((label, i) => (
                  <TouchableOpacity
                    key={label}
                    style={[s.tfBtn, current.answers[i]?.isCorrect && s.tfBtnSelected]}
                    onPress={() => markCorrect(i)}
                  >
                    <Ionicons
                      name={label === "True" ? "checkmark-circle" : "close-circle"}
                      size={18}
                      color={current.answers[i]?.isCorrect ? "#FFF" : theme.textSec}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[s.tfText, current.answers[i]?.isCorrect && { color: "#FFF" }]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {current.type === "short_answer" && (
              <TextInput
                style={s.input}
                placeholder="Correct answer"
                placeholderTextColor={theme.textTer}
                value={current.answers[0]?.text || ""}
                onChangeText={v => setAnswer(0, "text", v)}
              />
            )}

            <Text style={s.sectionLabel}>
              Explanation <Text style={[s.optional, { color: theme.textTer }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[s.input, s.multiline]}
              placeholder="Why is this the correct answer?"
              placeholderTextColor={theme.textTer}
              value={current.explanation}
              onChangeText={t => setCurrent(p => ({ ...p, explanation: t }))}
              multiline
            />

            <TouchableOpacity style={s.addBtn} onPress={addQuestion}>
              <Ionicons name="add-circle-outline" size={20} color="#8641f4" style={{ marginRight: 8 }} />
              <Text style={s.addBtnText}>Add Question</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <View style={s.footer}>
          {step === 1 ? (
            <TouchableOpacity
              style={[s.primaryBtn, !canProceed && s.primaryBtnDisabled]}
              onPress={() => setStep(2)}
              disabled={!canProceed}
            >
              <Text style={s.primaryBtnText}>Next — Add Questions</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.primaryBtn, (questions.length === 0 || saving) && s.primaryBtnDisabled]}
              onPress={saveQuiz}
              disabled={questions.length === 0 || saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={s.primaryBtnText}>Save Quiz ({questions.length})</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12,
      backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backBtn: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: theme.text, textAlign: "center" },
    headerSub: { fontSize: 12, color: theme.textTer, textAlign: "center", marginTop: 2 },
    stepBar: { height: 3, backgroundColor: theme.border },
    stepFill: { height: 3, backgroundColor: "#8641f4" },
    scroll: { flex: 1 },
    content: { padding: 20, paddingBottom: 40 },
    sectionLabel: { fontSize: 13, fontWeight: "700", color: theme.textSec, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
    optional: { fontWeight: "400", textTransform: "none" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: theme.surface, borderWidth: 1.5, borderColor: theme.border,
    },
    chipSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
    chipText: { fontSize: 14, color: theme.textSec },
    chipTextSelected: { color: "#FFF", fontWeight: "600" },
    topicRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: theme.surface, borderRadius: 12, padding: 14,
      marginBottom: 8, borderWidth: 1.5, borderColor: "transparent",
    },
    topicRowSelected: { borderColor: "#8641f4" },
    topicName: { fontSize: 15, color: theme.text },
    input: {
      backgroundColor: theme.surface, borderRadius: 12, padding: 14,
      fontSize: 15, color: theme.text, borderWidth: 1.5, borderColor: theme.border, marginBottom: 16,
    },
    multiline: { minHeight: 80, textAlignVertical: "top" },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
    pill: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
      backgroundColor: theme.surface2, borderWidth: 1.5, borderColor: theme.border,
    },
    pillSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
    pillText: { fontSize: 13, color: theme.textSec, fontWeight: "500" },
    pillTextSelected: { color: "#FFF" },
    answerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
    radioBtn: { padding: 2 },
    answerInput: {
      flex: 1, backgroundColor: theme.surface, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text,
      borderWidth: 1.5, borderColor: theme.border,
    },
    tfBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 12, borderRadius: 12, backgroundColor: theme.surface2,
      borderWidth: 1.5, borderColor: theme.border,
    },
    tfBtnSelected: { backgroundColor: "#8641f4", borderColor: "#8641f4" },
    tfText: { fontSize: 15, fontWeight: "600", color: theme.textSec },
    summaryBox: {
      backgroundColor: theme.surface, borderRadius: 14, padding: 14,
      marginBottom: 20, borderWidth: 1, borderColor: theme.border,
    },
    summaryTitle: { fontSize: 13, fontWeight: "700", color: "#8641f4", marginBottom: 8 },
    summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    summaryText: { flex: 1, fontSize: 13, color: theme.textSec, marginRight: 8 },
    addBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
      borderColor: "#8641f4", marginTop: 4, marginBottom: 20,
    },
    addBtnText: { fontSize: 15, fontWeight: "600", color: "#8641f4" },
    footer: { padding: 20, paddingBottom: 36, backgroundColor: theme.bg, borderTopWidth: 1, borderTopColor: theme.border },
    primaryBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: "#8641f4", borderRadius: 16, paddingVertical: 16,
    },
    primaryBtnDisabled: { backgroundColor: "#C4A0F8" },
    primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  });
}
