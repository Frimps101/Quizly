import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";

const RootLayout = () => {
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const router = useRouter();

  const handleStartQuiz = () => {
    setQuizModalVisible(false);
    router.push("/(subjects)/subjects");
  };

  const handleCreateQuiz = () => {
    setQuizModalVisible(false);
    router.push("/(subjects)/create-quiz");
  };

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#8641f4",
          tabBarInactiveTintColor: "#999",
          tabBarStyle: {
            backgroundColor: "#FFF",
            borderTopWidth: 1,
            borderTopColor: "#E0E0E0",
            height: 60,
            paddingBottom: 30,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "home" : "home-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="flashcards"
          options={{
            title: "Flashcards",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "albums" : "albums-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: "Quiz",
            tabBarIcon: ({ color, size }) => (
              <Ionicons 
                name="rocket-outline"
                size={size} 
                color={color} 
              />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setQuizModalVisible(true);
            },
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: "Progress",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "stats-chart" : "stats-chart-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons 
                name={focused ? "person" : "person-outline"} 
                size={size} 
                color={color} 
              />
            ),
          }}
        />
      </Tabs>

      {/* Quiz Options Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={quizModalVisible}
        onRequestClose={() => setQuizModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setQuizModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Handle Bar */}
            <View style={styles.handleBar} />

            <Text style={styles.modalTitle}>Choose an Option</Text>

            {/* Start Quiz Option */}
            <TouchableOpacity style={styles.option} onPress={handleStartQuiz}>
              <View style={styles.optionIcon}>
                <Ionicons name="play-circle" size={32} color="#8641f4" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Start Quiz</Text>
                <Text style={styles.optionDescription}>
                  Take a quiz from available subjects
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            {/* Create Quiz Option */}
            <TouchableOpacity style={styles.option} onPress={handleCreateQuiz}>
              <View style={styles.optionIcon}>
                <Ionicons name="add-circle" size={32} color="#8641f4" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Create Quiz</Text>
                <Text style={styles.optionDescription}>
                  Create your own custom quiz
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setQuizModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    minHeight: 350,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginBottom: 24,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  optionIcon: {
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
  cancelButton: {
    marginTop: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8641f4',
  },
});

export default RootLayout;