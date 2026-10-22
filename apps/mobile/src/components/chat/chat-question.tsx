import { roomsChoice } from '@repo/client/client';
import { useChatQuestion } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { ArrowUp, X } from 'lucide-react-native';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { QuestionCard, QuestionCardHeader, QuestionCardOption, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import type { ConversationQuestion } from '@repo/contracts/universal';

interface ChatQuestionProps {
  question: ConversationQuestion;
}

export function ChatQuestion({ question }: ChatQuestionProps) {
  const card = useChatQuestion(question);

  const skip = (
    <Button
      accessibilityLabel={m.rooms_chat_question_skip()}
      disabled={card.isAnswered}
      size="icon-xs"
      variant="ghost"
      onPress={card.skip}
    >
      <Icon icon={X} size="sm" />
    </Button>
  );

  return (
    <QuestionCard>
      <QuestionCardHeader
        action={skip}
        descriptions={[...(card.detail ? [card.detail] : []), card.hint]}
        title={card.title}
      />
      {question.choices.length > 0 ? (
        <QuestionCardOptions>
          {question.choices.map((choice, index) => {
            const { label, recommended } = roomsChoice({ choice });

            return (
              <QuestionCardOption
                disabled={card.isAnswered}
                index={index}
                key={choice}
                selected={card.picked.includes(choice)}
                onPress={() => card.choose(choice)}
              >
                <Text className="flex-1">{label}</Text>
                {recommended ? <Badge variant="outline"><Text>{m.rooms_chat_question_recommended()}</Text></Badge> : null}
              </QuestionCardOption>
            );
          })}
        </QuestionCardOptions>
      ) : null}
      <Input
        accessibilityLabel={card.isSecret ? m.rooms_chat_question_secret_placeholder() : m.rooms_chat_question_other()}
        autoCapitalize={card.isSecret ? 'none' : undefined}
        autoCorrect={!card.isSecret}
        editable={!card.isAnswered}
        placeholder={card.isSecret ? m.rooms_chat_question_secret_placeholder() : m.rooms_chat_question_other()}
        returnKeyType="send"
        secureTextEntry={card.isSecret}
        value={card.typed}
        onChangeText={card.setTyped}
        onSubmitEditing={card.send}
      />
      <Button
        accessibilityLabel={m.rooms_chat_question_send()}
        disabled={card.isAnswered || !card.canSend}
        onPress={card.send}
      >
        <Icon icon={ArrowUp} />
        {m.rooms_chat_question_send()}
      </Button>
      {card.problem ? <Text tone="destructive" variant="small">{card.problem}</Text> : null}
    </QuestionCard>
  );
}
