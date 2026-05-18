import { Text, View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function CreateQuiz() {
  const handleOptionPress = (option) => {
    if (option === "manual") router.push("/(subjects)/create-manual");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Quiz</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Choose how you want to create your quiz
        </Text>

        {/* Manual Creation */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => handleOptionPress("manual")}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="create" size={32} color="#8641f4" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Manual Creation</Text>
            <Text style={styles.optionDescription}>
              Create quiz questions manually one by one
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* AI Generated */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => handleOptionPress("ai")}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="sparkles" size={32} color="#8641f4" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>AI Generated</Text>
            <Text style={styles.optionDescription}>
              Generate quiz questions using AI
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Import from File */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => handleOptionPress("import")}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="cloud-upload" size={32} color="#8641f4" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Import from File</Text>
            <Text style={styles.optionDescription}>
              Upload a file with quiz questions
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>

        {/* Template Based */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => handleOptionPress("template")}
        >
          <View style={styles.optionIcon}>
            <Ionicons name="document-text" size={32} color="#8641f4" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Use Template</Text>
            <Text style={styles.optionDescription}>
              Start from a pre-made quiz template
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#999" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    backgroundColor: '#F8F4FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

