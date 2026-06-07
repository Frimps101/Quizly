import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, Pressable } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const RootLayout = () => {
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const router = useRouter();
  const theme = useTheme();

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
          tabBarInactiveTintColor: theme.textTer,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopWidth: 1,
            borderTopColor: theme.border,
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
              <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="flashcards"
          options={{
            title: "Flashcards",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "albums" : "albums-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: "Quiz",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="rocket-outline" size={size} color={color} />
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
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "person" : "person-outline"} size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Modal
        animationType="slide"
        transparent={true}
        visible={quizModalVisible}
        onRequestClose={() => setQuizModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          onPress={() => setQuizModalVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: theme.surface,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, minHeight: 350,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ width: 40, height: 4, backgroundColor: theme.handleBar, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />

            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 24, textAlign: 'center' }}>
              Choose an Option
            </Text>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface2, borderRadius: 16, padding: 16, marginBottom: 12 }}
              onPress={handleStartQuiz}
            >
              <View style={{ marginRight: 16 }}>
                <Ionicons name="play-circle" size={32} color="#8641f4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Start Quiz</Text>
                <Text style={{ fontSize: 14, color: theme.textSec }}>Take a quiz from available subjects</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textTer} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface2, borderRadius: 16, padding: 16, marginBottom: 12 }}
              onPress={handleCreateQuiz}
            >
              <View style={{ marginRight: 16 }}>
                <Ionicons name="add-circle" size={32} color="#8641f4" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Create Quiz</Text>
                <Text style={{ fontSize: 14, color: theme.textSec }}>Create your own custom quiz</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textTer} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, paddingVertical: 16, alignItems: 'center' }}
              onPress={() => setQuizModalVisible(false)}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#8641f4' }}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default RootLayout;
