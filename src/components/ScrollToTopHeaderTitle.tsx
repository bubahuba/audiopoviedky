import React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

interface ScrollToTopHeaderTitleProps {
  title: string;
  onPress: () => void;
}

export default function ScrollToTopHeaderTitle({
  title,
  onPress,
}: ScrollToTopHeaderTitleProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="Scroll to top">
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Comfortaa',
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});
