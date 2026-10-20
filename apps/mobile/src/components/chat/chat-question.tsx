import { roomsChoice, roomsQuestionText } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { ORPCError } from '@orpc/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, X } from 'lucide-react-native';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { QuestionCard, QuestionCardHeader, QuestionCardOption, QuestionCardOptions } from '@/components/ui/question-card';
import { Text } from '@/components/ui/text';
import type { RpcSession } from '@/types/rpc.types';
import type { ConversationQuestion, QuestionAnswer } from '@openbots/contracts/universal';

interface ChatQuestionProps {
  session: RpcSession;
  question: ConversationQuestion;
}

export function ChatQuestion({ session, question }: ChatQuestionProps) {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<string[]>([]);
  const [typed, setTyped] = useState('');

  const answer = useMutation(session.rpc.conversation.answerQuestion.mutationOptions({
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.conversation.questions.key() }),
  }));

  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.isAccepted === false;
  const isAnswered = answer.isPending || answer.data?.isAccepted === true;
  const own = typed.trim();
  const { title, detail } = roomsQuestionText({ question: question.text });

  const hint = match(question)
    .with({ choices: [] }, () => m.rooms_chat_question_open())
    .with({ isMultiSelect: true }, () => m.rooms_chat_question_many())
    .otherwise(() => m.rooms_chat_question_one());

  const reply = (value: QuestionAnswer) => answer.mutate({
    botId: question.botId,
    conversationId: question.conversationId,
    id: question.id,
    answer: value,
  });

  function send() {
    if (question.isMultiSelect && picked.length > 0 && !own) {
      reply({ kind: 'choices', choices: picked });
    } else if (own) {
      reply({ kind: 'text', text: question.isMultiSelect && picked.length > 0 ? [...picked, own].join(', ') : own });
    }
  }

  const skip = (
    <Button
      accessibilityLabel={m.rooms_chat_question_skip()}
      disabled={isAnswered}
      size="icon-xs"
      variant="ghost"
      onPress={() => reply({ kind: 'skip' })}
    >
      <Icon icon={X} size="sm" />
    </Button>
  );

  return (
    <QuestionCard>
      <QuestionCardHeader
        action={skip}
        descriptions={[...(detail ? [detail] : []), hint]}
        title={title}
      />
      {question.choices.length > 0 ? (
        <QuestionCardOptions>
          {question.choices.map((choice) => {
            const { label, recommended } = roomsChoice({ choice });

            return (
              <QuestionCardOption
                disabled={isAnswered}
                key={choice}
                selected={picked.includes(choice)}
                onPress={() => (question.isMultiSelect
                  ? setPicked(picked.includes(choice) ? picked.filter((item) => item !== choice) : [...picked, choice])
                  : reply({ kind: 'choices', choices: [choice] }))}
              >
                <Text className="flex-1">{label}</Text>
                {recommended ? <Badge variant="outline"><Text>{m.rooms_chat_question_recommended()}</Text></Badge> : null}
              </QuestionCardOption>
            );
          })}
        </QuestionCardOptions>
      ) : null}
      <Input
        accessibilityLabel={m.rooms_chat_question_other()}
        editable={!isAnswered}
        placeholder={m.rooms_chat_question_other()}
        returnKeyType="send"
        value={typed}
        onChangeText={setTyped}
        onSubmitEditing={send}
      />
      <Button
        accessibilityLabel={m.rooms_chat_question_send()}
        disabled={isAnswered || (question.isMultiSelect ? picked.length === 0 && !own : !own)}
        onPress={send}
      >
        <Icon icon={ArrowUp} />
        {m.rooms_chat_question_send()}
      </Button>
      {answer.isError || isGone ? <Text tone="destructive" variant="small">{isGone ? m.rooms_chat_approval_gone() : m.rooms_chat_approval_error()}</Text> : null}
    </QuestionCard>
  );
}
