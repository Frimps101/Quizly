import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    padding: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 18,
  },
  improveSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '90%',
  },
  improveText: {
    fontSize: 32,
    fontWeight: '500',
    color: '#000',
    lineHeight: 45,
  },
  subjectsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  subjectsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000',
    marginTop: 20,
  },
  subjectsLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8641f4',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 12,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#8641f4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8641f4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default styles;
