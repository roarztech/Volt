import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Bot, Dumbbell, Moon, Send, Sparkles, Utensils } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { AppScreen } from '../components/AppScreen';
import { Card } from '../components/Card';
import { MotionPressable } from '../components/MotionPressable';
import { Pill } from '../components/Pill';
import { AppText } from '../components/Text';
import { useAppState } from '../context/AppStateContext';
import { colors, radii, spacing } from '../theme/theme';
import { CoachMessage } from '../types';

const useNativeMotion = Platform.OS !== 'web';
const webFocusReset = Platform.select({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'solid' as const,
    outlineWidth: 0,
  },
  default: {},
});

const quickPrompts = [
  { label: 'Next workout', value: 'What should I focus on in my next workout?', icon: <Dumbbell size={15} color={colors.text} /> },
  { label: 'Meal idea', value: 'What should I eat with my remaining calories?', icon: <Utensils size={15} color={colors.text} /> },
  { label: 'Recovery', value: 'I feel sore. How should I adjust training?', icon: <Moon size={15} color={colors.text} /> },
  { label: 'Fat loss', value: 'How do I keep losing fat without losing strength?', icon: <Sparkles size={15} color={colors.text} /> },
];

export const AICoachScreen = () => {
  const { data, coachThinking, sendCoachMessage } = useAppState();
  const [message, setMessage] = useState('');
  const [composerFocused, setComposerFocused] = useState(false);
  const listRef = useRef<FlatList<CoachMessage>>(null);
  const tabBarHeight = useBottomTabBarHeight();

  const scrollToLatest = useCallback((animated = true) => {
    const scroll = () => {
      listRef.current?.scrollToEnd({ animated });
    };

    requestAnimationFrame(() => {
      scroll();
    });

    setTimeout(() => {
      scroll();
    }, 40);

    setTimeout(() => {
      scroll();
    }, 80);

    setTimeout(() => {
      scroll();
    }, 240);

    setTimeout(() => {
      scroll();
    }, 520);
  }, []);

  useEffect(() => {
    scrollToLatest();
  }, [coachThinking, data.coachMessages.length, scrollToLatest]);

  const submit = (content = message) => {
    const clean = content.trim();

    if (!clean || coachThinking) {
      return;
    }

    sendCoachMessage(clean);
    setMessage('');
    scrollToLatest();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppScreen scroll={false} contentStyle={styles.screenContent}>
        <AppHeader />

        <Card style={styles.promptCard}>
          <View style={styles.promptWrap}>
            {quickPrompts.map((prompt) => (
              <Pill key={prompt.value} label={prompt.label} icon={prompt.icon} onPress={() => submit(prompt.value)} />
            ))}
          </View>
        </Card>

        <FlatList
          ref={listRef}
          data={data.coachMessages}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          extraData={coachThinking}
          renderItem={({ item }) => <MessageBubble message={item} />}
          ListFooterComponent={<ChatFooter thinking={coachThinking} />}
          onContentSizeChange={() => scrollToLatest()}
          onLayout={() => scrollToLatest(false)}
        />

        <View style={[styles.composerDock, composerFocused && styles.composerDockFocused, { marginBottom: tabBarHeight + spacing.sm }]}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            onFocus={() => setComposerFocused(true)}
            onBlur={() => setComposerFocused(false)}
            placeholder="Ask about meals, overload, recovery..."
            placeholderTextColor={colors.textSubtle}
            style={[styles.composerInput, webFocusReset]}
            multiline
          />
          <MotionPressable
            style={[styles.composerSend, coachThinking && styles.sendButtonDisabled]}
            onPress={() => submit()}
            activeScale={0.94}
            disabled={coachThinking}
          >
            <Send size={18} color={coachThinking ? colors.textMuted : colors.black} />
          </MotionPressable>
        </View>
      </AppScreen>
    </KeyboardAvoidingView>
  );
};

const ChatFooter = ({ thinking }: { thinking: boolean }) => (
  <View style={styles.chatFooter}>{thinking ? <TypingBubble /> : null}</View>
);

const MessageBubble = ({ message }: { message: CoachMessage }) => {
  const isUser = message.role === 'user';
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 17,
        stiffness: 180,
        mass: 0.55,
        useNativeDriver: useNativeMotion,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 260,
        mass: 0.45,
        useNativeDriver: useNativeMotion,
      }),
    ]).start();
  }, [opacity, scale, translateY]);

  return (
    <Animated.View style={[styles.bubbleRow, isUser && styles.userRow, { opacity, transform: [{ translateY }, { scale }] }]}>
      {!isUser ? (
        <View style={styles.coachAvatar}>
          <Bot size={15} color={colors.black} />
        </View>
      ) : null}
      <View style={[styles.bubbleStack, isUser && styles.userBubbleStack]}>
        <AppText variant="caption" color={isUser ? colors.textSubtle : colors.textMuted}>
          {isUser ? 'YOU' : 'VOLT COACH'}
        </AppText>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.coachBubble]}>
          <AppText variant="body" color={isUser ? colors.black : colors.text}>
            {message.content}
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
};

const TypingBubble = () => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 720,
          useNativeDriver: useNativeMotion,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 720,
          useNativeDriver: useNativeMotion,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.bubbleRow}>
      <View style={styles.thinkingCard}>
        <View style={styles.typingAvatar}>
          <Bot size={15} color={colors.black} />
        </View>
        <View style={styles.typingCopy}>
          <AppText variant="caption" color={colors.accent}>
            VOLT IS THINKING...
          </AppText>
          <AppText variant="body">Reading your question and checking your recent logs.</AppText>
          <View style={styles.dotRow}>
            {[0, 1, 2].map((index) => {
              const opacity = pulse.interpolate({
                inputRange: [0, 0.25 + index * 0.18, 0.55 + index * 0.12, 1],
                outputRange: [0.35, 1, 0.35, 0.35],
              });
              const translateY = pulse.interpolate({
                inputRange: [0, 0.25 + index * 0.18, 0.55 + index * 0.12, 1],
                outputRange: [0, -3, 0, 0],
              });

              return <Animated.View key={index} style={[styles.typingDot, { opacity, transform: [{ translateY }] }]} />;
            })}
          </View>
          <View style={styles.thinkingRail}>
            <Animated.View
              style={[
                styles.thinkingRailFill,
                {
                  opacity: pulse.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.45, 1],
                  }),
                  transform: [
                    {
                      scaleX: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.25, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  promptCard: {
    padding: spacing.md,
  },
  promptWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  messageList: {
    flex: 1,
  },
  messages: {
    gap: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  chatFooter: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  coachAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  bubbleStack: {
    maxWidth: '86%',
    gap: spacing.xs,
  },
  userBubbleStack: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  coachBubble: {
    backgroundColor: '#14161A',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderTopLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: colors.accent,
    borderTopRightRadius: 6,
  },
  composerDock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 60,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#3A3D44',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 14,
  },
  composerDockFocused: {
    borderColor: colors.accent,
    shadowOpacity: 0.34,
  },
  composerInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 86,
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 15,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  composerSend: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.graphite,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  thinkingCard: {
    width: '88%',
    borderRadius: radii.md,
    borderTopLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3D44',
    backgroundColor: '#14161A',
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  thinkingRail: {
    height: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.graphite,
    marginTop: spacing.xs,
  },
  thinkingRailFill: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
});
