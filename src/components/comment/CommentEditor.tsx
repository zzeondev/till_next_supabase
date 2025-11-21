'use client';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useCreateComment } from '@/hooks/mutations/comment/useCreateComment';
import { useUpdateComment } from '@/hooks/mutations/comment/useUpdateComment';

type CreateMode = {
  type: 'CREATE';
  postId: number;
};

type EditMode = {
  type: 'EDIT';
  commentId: number;
  initialContent: string;
  onClose: () => void;
};

type ReplyMode = {
  type: 'REPLY';
  postId: number;
  parentCommentId: number;
  rootCommentId: number; // 추가
  onClose: () => void;
};

type Props = CreateMode | EditMode | ReplyMode;

export default function CommentEditor(props: Props) {
  const { mutate: createComment, isPending: isCreateCommentPending } =
    useCreateComment({
      onSuccess: () => {
        setContent('');
        // 대댓글 창이 보이면 닫아줌
        if (props.type === 'REPLY') props.onClose();
      },
      onError: error => {
        toast.error('댓글 추가에 실패하였습니다.', {
          position: 'top-center',
        });
      },
    });

  const { mutate: updateComment, isPending: isUpdateCommentPending } =
    useUpdateComment({
      onSuccess: () => {
        (props as EditMode).onClose();
      },
      onError: error => {
        toast.error('댓글 수정에 실패했습니다.', {
          position: 'top-center',
        });
      },
    });

  const [content, setContent] = useState('');

  useEffect(() => {
    if (props.type === 'EDIT') {
      setContent(props.initialContent);
    }
  }, []);

  const handleSaveComment = () => {
    if (content.trim() === '') return;

    if (props.type === 'CREATE') {
      createComment({
        postId: props.postId,
        content,
      });
    } else if (props.type === 'EDIT') {
      updateComment({
        id: props.commentId,
        content,
      });
    } else if (props.type === 'REPLY') {
      createComment({
        postId: props.postId,
        content: content,
        parentCommentId: props.parentCommentId,
        rootCommentId: props.rootCommentId, // 추가
      });
    }
  };

  const isPending = isCreateCommentPending || isUpdateCommentPending;

  return (
    <div className='flex flex-col gap-2'>
      <Textarea
        disabled={isPending}
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div className='flex justify-end gap-2'>
        {(props.type === 'EDIT' || props.type === 'REPLY') && (
          <Button onClick={() => props.onClose()}>취소</Button>
        )}

        <Button disabled={isPending} onClick={handleSaveComment}>
          {props.type === 'EDIT' ? '수정' : '작성'}
        </Button>
      </div>
    </div>
  );
}
