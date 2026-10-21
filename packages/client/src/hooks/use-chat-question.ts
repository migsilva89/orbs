import { m } from '@openbots/i18n/client';
import { ORPCError } from '@orpc/client';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { match } from 'ts-pattern';
import { chatAnswerProblem } from '../services/chat/chat.utils';
import { roomsQuestionText } from '../services/rooms/rooms.utils';
import { useRpc } from './use-rpc';
import type { ConversationQuestion, QuestionAnswer } from '@openbots/contracts/universal';

/** The state of a bot question card: picked choices, a typed answer, and sending, skipping or choosing. */
export function useChatQuestion(question: ConversationQuestion) {
  const { rpc } = useRpc();
  const [picked, setPicked] = useState<string[]>([]);
  const [typed, setTyped] = useState('');
  const answer = useMutation(rpc.conversation.answerQuestion.mutationOptions({ meta: { invalidates: [rpc.conversation.questions.key()] } }));
  const isGone = (answer.error instanceof ORPCError && answer.error.code === 'NOT_FOUND') || answer.data?.isAccepted === false;
  const own = typed.trim();

  const reply = (value: QuestionAnswer) => answer.mutate({
    botId: question.botId,
    conversationId: question.conversationId,
    id: question.id,
    answer: value,
  });

  return {
    ...roomsQuestionText({ question: question.text }),
    hint: match(question)
      .with({ choices: [] }, () => m.rooms_chat_question_open())
      .with({ isMultiSelect: true }, () => m.rooms_chat_question_many())
      .otherwise(() => m.rooms_chat_question_one()),
    picked,
    typed,
    setTyped,
    isAnswered: answer.isPending || answer.data?.isAccepted === true,
    canSend: question.isMultiSelect ? picked.length > 0 || own !== '' : own !== '',
    problem: chatAnswerProblem({ isGone, isError: answer.isError }),
    skip: () => reply({ kind: 'skip' }),
    choose: (choice: string) => match(question.isMultiSelect)
      .with(true, () => setPicked(picked.includes(choice) ? picked.filter((item) => item !== choice) : [...picked, choice]))
      .with(false, () => reply({ kind: 'choices', choices: [choice] }))
      .exhaustive(),
    send: () => match({ hasPicked: question.isMultiSelect && picked.length > 0, own })
      .with({ hasPicked: true, own: '' }, () => reply({ kind: 'choices', choices: picked }))
      .with({ own: '' }, () => undefined)
      .otherwise(({ hasPicked }) => reply({ kind: 'text', text: hasPicked ? [...picked, own].join(', ') : own })),
  };
}
