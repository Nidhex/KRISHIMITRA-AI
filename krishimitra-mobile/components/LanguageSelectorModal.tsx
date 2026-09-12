/* ==========================================================================
   KrishiMitra AI — Mobile Language Selector Modal
   Displays 11 Indian languages in native scripts for farmer accessibility.
   ========================================================================== */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { SUPPORTED_LANGUAGES, LanguageOption } from '../i18n/languages';
import { Colors, Typography, Spacing, BorderRadius, ComponentSize, Elevation } from '../constants/theme';

interface LanguageSelectorModalProps {
  visible: boolean;
  selectedLanguage: string;
  onSelectLanguage: (langCode: string) => void;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  visible,
  selectedLanguage,
  onSelectLanguage,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>भाषा चुनें / Select Language</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close language selector"
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Language Grid / List */}
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langCard,
                    isSelected && styles.langCardSelected,
                  ]}
                  onPress={() => {
                    onSelectLanguage(lang.code);
                    onClose();
                  }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${lang.name} (${lang.nativeName})`}
                >
                  <Text style={styles.flagEmoji}>{lang.flagEmoji}</Text>
                  <View style={styles.textContainer}>
                    <Text style={[styles.nativeName, isSelected && styles.textSelected]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[styles.englishName, isSelected && styles.textSelectedSecondary]}>
                      {lang.name}
                    </Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingBottom: Spacing.xl,
    ...Elevation.high,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: ComponentSize.minTouchTarget,
    height: ComponentSize.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  scrollList: {
    padding: Spacing.lg,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: ComponentSize.minTouchTarget,
  },
  langCardSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primaryDark,
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  nativeName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  englishName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  textSelected: {
    color: Colors.primaryDark,
  },
  textSelectedSecondary: {
    color: Colors.primaryDark,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
});
