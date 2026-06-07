import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export default function SearchBar({ 
  placeholder = "Search...", 
  value, 
  onChangeText,
  onClear,
  style 
}) {
  const theme = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 50, paddingHorizontal: 16, paddingVertical: 10 }, style]}>
      <Ionicons name="search" size={20} color={theme.textTer} style={{ marginRight: 10 }} />
      <TextInput
        style={{ flex: 1, fontSize: 16, color: theme.text }}
        placeholder={placeholder}
        placeholderTextColor={theme.textTer}
        value={value}
        onChangeText={onChangeText}
      />
      {value && value.length > 0 && onClear && (
        <TouchableOpacity onPress={onClear}>
          <Ionicons name="close-circle" size={20} color={theme.textTer} />
        </TouchableOpacity>
      )}
    </View>
  );
}
