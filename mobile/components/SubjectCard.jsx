import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubjectCard({ subject, icon, iconColor, icon_color, onPress }) {
  const rawIcon = icon || null;
  const resolvedIcon = (rawIcon && Ionicons.glyphMap[rawIcon]) ? rawIcon : "school";
  const resolvedColor = iconColor || icon_color || "#6B7280";
  const cardBackground = resolvedColor + '26'; // 26 = 15% opacity
  
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 48) / 2; // 48 = 16px padding on each side + 16px gap
  
  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: cardBackground, width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={resolvedIcon} size={36} color={resolvedColor} />
      </View>
      <Text style={styles.subjectText}>{subject}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 155,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 10,
  },
  subjectText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
});

