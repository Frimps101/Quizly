import { Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import SubjectCard from "../../components/SubjectCard";
import SearchBar from "../../components/SearchBar";
import { subjects } from "../../data";
import makeStyles from "../../assets/styles/home.styles";
import { useTheme } from "../../hooks/useTheme";


export default function Index() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const user = {
    name: "User",
    profileImage: "https://i.pravatar.cc/300",
  };

  const featuredSubjects = subjects.slice(0, 4);

  const handleSubjectPress = (subject) => {
    router.push({
      pathname: "/(subjects)/[id]",
      params: {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        iconColor: subject.iconColor,
      },
    });
  };

  const handleSeeAllPress = () => {
    router.push("/(subjects)/subjects");
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView style={styles.container}>
        {/* Header with greeting and profile picture */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello {user.name}</Text>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: user.profileImage }}
              style={styles.profileImage}
            />
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          placeholder="Subject, Progress Reports"
          style={styles.searchContainer}
        />

        {/* Improve Section */}
        <View style={styles.improveSection}>
          <Text style={styles.improveText}>
            What do you want to improve upon today?
          </Text>
        </View>

        <View style={styles.subjectsSection}>
          <Text style={styles.subjectsText}>Explore By Subjects</Text>
          <TouchableOpacity onPress={handleSeeAllPress}>
            <Text style={styles.subjectsLink}>See All</Text>
          </TouchableOpacity>
        </View>

        {/* Subject Cards */}
        <View style={styles.subjectsContainer}>
          {featuredSubjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject.name}
              icon={subject.icon}
              iconColor={subject.iconColor}
              onPress={() => handleSubjectPress(subject)}
            />
          ))}
        </View>
      </ScrollView>

      {/* FAB — create a new quiz */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(subjects)/create-quiz")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}
