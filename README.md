# comments 댓글의 댓글

## 1. 댓글의 댓글을 배치 시 고려사항

- 댓글의 배치 순서가 최신순이 아님
- 시간이 오래된 순서로 배치하고 댓글 출력
- `/src/apis/comment.ts` 일부 옵션 조절

```ts
// 2. 댓글 조회
export async function fetchComments(postId: number) {
  const { data, error } = await supabase
    .from('comments')
    .select('*, author: profiles!author_id(*)')
    .eq('post_id', postId)
    // .order('created_at', { ascending: false });
    .order('created_at', { ascending: true }); // 오래된 순서대로
  if (error) throw error;
  return data;
}
```

## 2. 캐시 데이터 정렬 후 갱신하기

- `/src/hooks/mutations/comment/useCreateComment.ts`

```ts
import { createComment } from '@/apis/comment';
import useProfileData from '@/hooks/queries/useProfileData';
import { QUERY_KEYS } from '@/lib/constants';
import { useSession } from '@/stores/session';
import { Comment, UseMutationCallback } from '@/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateComment(callback?: UseMutationCallback) {
  const queryClient = useQueryClient();
  // author_id 를 이용해서 프로필들도 불러와야 함
  const session = useSession();
  const { data: profile } = useProfileData(session?.user.id);

  return useMutation({
    mutationFn: createComment,

    // 리턴 받은 성공데이터를 매개변수로 자동으로 받음
    onSuccess: newComment => {
      if (callback?.onSuccess) callback.onSuccess();
      // 캐시 업데이트
      queryClient.setQueryData<Comment[]>(
        QUERY_KEYS.comments.post(newComment.post_id),
        comments => {
          if (!comments) throw new Error('댓글 목록을 찾을 수 없습니다.');
          if (!profile) throw new Error('사용자 정보를 찾을 수 없습니다.');

          // return [{ ...newComment, author: profile }, ...comments];
          // 새로운 댓글을 배열의 뒤에 추가형태 반영
          return [...comments, { ...newComment, author: profile }];
        }
      );
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
```

## 3. 대댓글 테이블

### 3.1. 테이블의 변경

- Post ID 와 Comment ID 는 생성되어 있음
- 추가로 `부모 Comment ID` 는 보관해서 관리
- `comments` 테이블 칼럼 추가 > `Edit table`
- `parent_comment_id` > `int8` > `NULL` > `is Nullable` > 저장

### 3.2. FK 설정

- 부모 댓글의 칼럼 id 를 참조할 수 있도록 외래키 관계 설정
- Add foreign key reation 버튼 > `comments` > `parent_comment_id`> `id` > `cascade` > `cascade` > save 버튼

### 3.3. 타입 반영

```bash
npx supabase login
npm run generate-types
```

## 4. API 수정하기

- `/src/apis/comment.ts`
- `parentCommentId?:number`

```ts
// 1. 댓글 추가하기
export async function createComment({
  postId,
  content,
  parentCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId?: number;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, content, parent_comment_id: parentCommentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

## 5. 기능구현하기

### 5.1. 대댓글 작성하기

- `/src/components/comment/CommentItem.tsx` 업데이트

```tsx
// 대댓글 상태관리
const [isReplyinhg, setIsReplying] = useState(false);
const toggleReplying = () => {
  setIsReplying(prev => !prev);
};
```

```tsx
<div onClick={toggleReplying} className='cursor-pointer hover:underline'>
  댓글
</div>
```

```tsx
{
  /* 대댓글 영역 */
}
{
  isReplyinhg && (
    <div className='flex flex-col gap-2'>
      <CommentEditor
        type='REPLY'
        postId={props.post_id}
        parentCommentId={props.id}
        onClose={toggleReplying}
      />
    </div>
  );
}
```

- `/src/components/comment/CommentEditor.tsx` 업데이트
- type 에 `REPLY` 추가

```tsx
type ReplyMode = {
  type: 'REPLY';
  postId: number;
  parentCommentId: number;
  onClose: () => void;
};

type Props = CreateMode | EditMode | ReplyMode;
```

- 테스트 해보기

### 5.2. UI 개선

- `/src/components/comment/CommentEditor.tsx` 업데이트

```tsx
<div className='flex justify-end gap-2'>
  {(props.type === 'EDIT' || props.type === 'REPLY') && (
    <Button onClick={() => props.onClose()}>취소</Button>
  )}

  <Button disabled={isPending} onClick={handleSaveComment}>
    {props.type === 'EDIT' ? '수정' : '작성'}
  </Button>
</div>
```

### 5.3. 대댓글 작성 기능 업데이트

- `/src/components/comment/CommentEditor.tsx` 업데이트

```tsx
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
    });
  }
};
```

- 테스트 : supabase 테이블에서 확인

## 6. Mutation 업데이트 하기

- `/src/components/comment/CommentEditor.tsx` 업데이트

```tsx
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
```

- 전체 코드

```tsx
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
```

## 7. 부모 댓글 아래에 자식 댓글 배치하기

- 중첩 배치
- `/src/comments/comment/CommentList.tsx` 업데이트

### 7.1. 리턴받은 Comment 타입을 조건에 맞게 중첩해주는 함수 정의

- 단계 1.

```tsx
// parent_comment_id 를 이용해서 중첩 배열 구조 만들기
import type { Comment } from '@/types/types';
function toNestedComments(comments: Comment[]) {}
```

- 단계 2.

```tsx
// parent_comment_id 를 이용해서 중첩 배열 구조 만들기
import type { Comment } from '@/types/types';
function toNestedComments(comments: Comment[]): 반환할타입[] {}
```

- 단계 3. 중첩타입 정의 (`/src/types/type.ts`)

```tsx
// 중첩 댓글 타입
export type NestedComment = Comment & {
  parentComment?: Comment;
  children: NestedComment[]; // 재귀구조 패턴
};
```

- 단계 4. 반환타입 적용

```tsx
// parent_comment_id 를 이용해서 중첩 배열 구조 만들기
import type { Comment, NestedComment } from '@/types/types';
function toNestedComments(comments: Comment[]): NestedComment[] {}
```

- 단계 5. 함수 내부 작성

```tsx
function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      // 부모 댓글이 없으면 부모 댓글로 추가
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모 댓글 찾기, 중첩 반복으로 찾아냄
      const parentCommentIndex = result.findIndex(
        item => item.id === comment.parent_comment_id
      );
      // 부모인덱스를 찾았다면, 인덱스를 통해서 자식을 추가
      result[parentCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: result[parentCommentIndex],
      });
    }
  });

  return result;
}
```

- 단계 6. 함수 활용

```tsx
'use client';
import CommentItem from '@/components/comment/CommentItem';
import { useCommentsData } from '@/hooks/queries/useCommentsData';
import FallBack from '../FallBack';
import Loader from '../Loader';

// parent_comment_id 를 이용해서 중첩 배열 구조 만들기
import type { Comment, NestedComment } from '@/types/types';

function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      // 부모 댓글이 없으면 부모 댓글로 추가
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모 댓글 찾기, 중첩 반복으로 찾아냄
      const parentCommentIndex = result.findIndex(
        item => item.id === comment.parent_comment_id
      );
      // 부모인덱스를 찾았다면, 인덱스를 통해서 자식을 추가
      result[parentCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: result[parentCommentIndex],
      });
    }
  });

  return result;
}

export default function CommentList({ postId }: { postId: number }) {
  // useQuery 호출
  const {
    data: comments,
    error: fetchCommentsError,
    isPending: isFetchCommentsPending,
  } = useCommentsData(postId);

  if (fetchCommentsError) return <FallBack />;
  if (fetchCommentsError) return <Loader />;

  // 중첩된 댓글 목록 정리
  const nestedComments = toNestedComments(comments || []);

  return (
    <div className='flex flex-col gap-5'>
      {/* {comments?.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))} */}

      {nestedComments.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

### 7.2. 대댓글 출력하기

- `/src/components/comment/CommentItem.tsx` 업데이트
- Props 타입 변경 (`NestedComment`)

```tsx
// export default function CommentItem(props: Comment) {
export default function CommentItem(props: NestedComment) {
```

- children 출력

```tsx
{
  /* children 댓글 목록 출력 */
}
{
  props.children.map(comment => <CommentItem key={comment.id} {...comment} />);
}
```

- 전체 코드

```tsx
'use client';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';
// 타입만 import
import { Comment, NestedComment } from '@/types/types';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { useState } from 'react';
import CommentEditor from './CommentEditor';
import { useDeleteComment } from '@/hooks/mutations/comment/useDeleteComment';
import { toast } from 'sonner';
import { useOpenAlertModal } from '@/stores/alertModalStore';

// export default function CommentItem(props: Comment) {
export default function CommentItem(props: NestedComment) {
  const session = useSession();

  // 삭제 mutation
  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useDeleteComment({
      onSuccess: () => {},
      onError: error => {
        toast.error('댓글 삭제에 실패했습니다.', { position: 'top-center' });
      },
    });

  const openAlertModal = useOpenAlertModal();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEditing = () => {
    setIsEditing(prev => !prev);
  };

  // 대댓글 상태관리
  const [isReplying, setIsReplying] = useState(false);
  const toggleReply = () => {
    setIsReplying(prev => !prev);
  };

  const handleDeleteComment = () => {
    openAlertModal({
      title: '댓글 삭제',
      description: '삭제된 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
      onPositive: () => {
        deleteComment(props.id);
      },
      onNegative: () => {
        console.log('취소');
      },
    });
  };

  const isMine = session?.user.id === props.author.id;

  return (
    <div className={'flex flex-col gap-8  border-b pb-5'}>
      <div className='flex items-start gap-4'>
        <Link href={'#'}>
          <div className='flex h-full flex-col'>
            <Image
              className='h-10 w-10 rounded-full object-cover'
              src={props.author.avatar_url || defaultAvatar}
              width={40}
              height={40}
              alt={props.author.nickname || '회원 이미지'}
            />
          </div>
        </Link>
        <div className='flex w-full flex-col gap-2'>
          <div className='font-bold'>{props.author.nickname}</div>

          {isEditing ? (
            <CommentEditor
              type='EDIT'
              commentId={props.id}
              initialContent={props.content}
              onClose={toggleEditing}
            />
          ) : (
            <div>{props.content}</div>
          )}

          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div
                onClick={toggleReply}
                className='cursor-pointer hover:underline'
              >
                댓글
              </div>
              <div className='bg-border h-[13px] w-[2px]'></div>
              <div>{formatTimeAgo(props.created_at)}</div>
            </div>

            <div className='flex items-center gap-2'>
              {isMine && (
                <>
                  <div
                    onClick={toggleEditing}
                    className='cursor-pointer hover:underline'
                  >
                    수정
                  </div>
                  <div className='bg-border h-[13px] w-[2px]'></div>
                  <div
                    onClick={handleDeleteComment}
                    className='cursor-pointer hover:underline'
                  >
                    삭제
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 대댓글 영역 */}
      {isReplying && (
        <div className='flex flex-col gap-2'>
          <CommentEditor
            type='REPLY'
            postId={props.post_id}
            parentCommentId={props.id}
            onClose={toggleReply}
          />
        </div>
      )}

      {/* children 댓글 목록 출력 */}
      {props.children.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

### 7.3. UI/UX 적용하기

- `/src/components/comment/CommentItem.tsx` 업데이트

```tsx
// UI/UX 적용 : 일반적 댓글인지, 대댓글인지를 정의함
const isRootComment = props.parentComment === undefined;
```

```tsx
  return (
    <div
      className={`flex flex-col gap-8 pb-5 ${isRootComment ? 'border-b' : 'ml-6'}`}
    >
```

- 전체 코드

```tsx
'use client';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';
// 타입만 import
import { Comment, NestedComment } from '@/types/types';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { useState } from 'react';
import CommentEditor from './CommentEditor';
import { useDeleteComment } from '@/hooks/mutations/comment/useDeleteComment';
import { toast } from 'sonner';
import { useOpenAlertModal } from '@/stores/alertModalStore';

// export default function CommentItem(props: Comment) {
export default function CommentItem(props: NestedComment) {
  const session = useSession();

  // 삭제 mutation
  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useDeleteComment({
      onSuccess: () => {},
      onError: error => {
        toast.error('댓글 삭제에 실패했습니다.', { position: 'top-center' });
      },
    });

  const openAlertModal = useOpenAlertModal();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEditing = () => {
    setIsEditing(prev => !prev);
  };

  // 대댓글 상태관리
  const [isReplying, setIsReplying] = useState(false);
  const toggleReply = () => {
    setIsReplying(prev => !prev);
  };

  const handleDeleteComment = () => {
    openAlertModal({
      title: '댓글 삭제',
      description: '삭제된 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
      onPositive: () => {
        deleteComment(props.id);
      },
      onNegative: () => {
        console.log('취소');
      },
    });
  };

  const isMine = session?.user.id === props.author.id;

  // UI/UX 적용 : 일반적 댓글인지, 대댓글인지를 정의함
  const isRootComment = props.parentComment === undefined;

  return (
    <div
      className={`flex flex-col gap-8 pb-5 ${isRootComment ? 'border-b' : 'ml-6'}`}
    >
      <div className='flex items-start gap-4'>
        <Link href={'#'}>
          <div className='flex h-full flex-col'>
            <Image
              className='h-10 w-10 rounded-full object-cover'
              src={props.author.avatar_url || defaultAvatar}
              width={40}
              height={40}
              alt={props.author.nickname || '회원 이미지'}
            />
          </div>
        </Link>
        <div className='flex w-full flex-col gap-2'>
          <div className='font-bold'>{props.author.nickname}</div>

          {isEditing ? (
            <CommentEditor
              type='EDIT'
              commentId={props.id}
              initialContent={props.content}
              onClose={toggleEditing}
            />
          ) : (
            <div>{props.content}</div>
          )}

          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div
                onClick={toggleReply}
                className='cursor-pointer hover:underline'
              >
                댓글
              </div>
              <div className='bg-border h-[13px] w-[2px]'></div>
              <div>{formatTimeAgo(props.created_at)}</div>
            </div>

            <div className='flex items-center gap-2'>
              {isMine && (
                <>
                  <div
                    onClick={toggleEditing}
                    className='cursor-pointer hover:underline'
                  >
                    수정
                  </div>
                  <div className='bg-border h-[13px] w-[2px]'></div>
                  <div
                    onClick={handleDeleteComment}
                    className='cursor-pointer hover:underline'
                  >
                    삭제
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 대댓글 영역 */}
      {isReplying && (
        <div className='flex flex-col gap-2'>
          <CommentEditor
            type='REPLY'
            postId={props.post_id}
            parentCommentId={props.id}
            onClose={toggleReply}
          />
        </div>
      )}

      {/* children 댓글 목록 출력 */}
      {props.children.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```

## 8. 무한 대댓글

- 대대댓글에 대해서 태그를 바로 위의 대대댓글임을 표현
- 자신의 `최상위 댓글의 아이디` 와 `댓글의 아이디` 도 알아야 함

### 8.1. 최상위 글의 아이디를 위한 칼럼 추가

- supabase `comments` 테이블에 `칼럼 추가`
- `root_comment_id` > `int8` > `NULL`
- 외래키 관계 설정
- `public` > `comments` > `root_comment_id` > `id` > `Cascade` > `Cascade` > Save

### 8.2. 타입 정의

```bash
npm run generate-types
```

### 8.3. 댓글 추가 API 수정

- `/src/apis/comment.ts`

```ts
// 1. 댓글 추가하기
export async function createComment({
  postId,
  content,
  parentCommentId,
  rootCommentId,
}: {
  postId: number;
  content: string;
  parentCommentId?: number;
  rootCommentId?: number;
}) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      content,
      parent_comment_id: parentCommentId,
      root_comment_id: rootCommentId,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

### 8.4. 컴포넌트 수정

- `/src/components/comment/CommentItem.tsx` 업데이트
- `rootCommentId` 추가

```tsx
{
  /* 대댓글 영역 */
}
{
  isReplying && (
    <div className='flex flex-col gap-2'>
      <CommentEditor
        type='REPLY'
        postId={props.post_id}
        parentCommentId={props.id}
        rootCommentId={props.root_comment_id || props.id} // 추가됨
        onClose={toggleReply}
      />
    </div>
  );
}
```

- `/src/components/comment/CommentEditor.tsx` 업데이트
- `rootCommentId: number;` 추가

```tsx
type ReplyMode = {
  type: 'REPLY';
  postId: number;
  parentCommentId: number;
  rootCommentId: number; // 추가
  onClose: () => void;
};
```

- `rootCommentId: props.rootCommentId,` 추가

```tsx
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
```

### 8.5. 댓글 리스트 `댓글 작성자 아이디` 출력

- `/src/components/comment/CommentList.tsx` 업데이트

```tsx
function toNestedComments(comments: Comment[]): NestedComment[] {
  const result: NestedComment[] = [];
  comments.forEach(comment => {
    if (!comment.parent_comment_id) {
      result.push({ ...comment, children: [] });
    } else {
      // 특정 댓글에 부모가 존재하므로 대댓글
      // 부모에 대한 정보를 찾아냄
      const rootCommentIndex = result.findIndex(
        item => item.id === comment.root_comment_id
      );
      // 실제 부모의 Comment 정보
      const parentComment = comments.find(
        item => item.id === comment.parent_comment_id
      );

      if (rootCommentIndex === -1) return;
      if (!parentComment) return;

      result[rootCommentIndex].children.push({
        ...comment,
        children: [],
        parentComment: parentComment,
      });
    }
  });

  return result;
}
```

- `/src/components/comment/CommentItem.tsx` 해시태그 출력

```tsx
// 대댓글의 해시태그 출력을 위한 파악
const isOverTwoLevels = props.parent_comment_id !== props.root_comment_id;
```

```tsx
<div>
  {isOverTwoLevels && (
    <span className='font-bold text-blue-500'>
      @{props.parentComment?.author.nickname}
    </span>
  )}
  {props.content}
</div>
```

- 전체 코드

```tsx
'use client';
import defaultAvatar from '/public/assets/icons/default-avatar.jpg';
import Image from 'next/image';
import Link from 'next/link';
// 타입만 import
import { Comment, NestedComment } from '@/types/types';
import { formatTimeAgo } from '@/lib/time';
import { useSession } from '@/stores/session';
import { useState } from 'react';
import CommentEditor from './CommentEditor';
import { useDeleteComment } from '@/hooks/mutations/comment/useDeleteComment';
import { toast } from 'sonner';
import { useOpenAlertModal } from '@/stores/alertModalStore';

// export default function CommentItem(props: Comment) {
export default function CommentItem(props: NestedComment) {
  const session = useSession();

  // 삭제 mutation
  const { mutate: deleteComment, isPending: isDeleteCommentPending } =
    useDeleteComment({
      onSuccess: () => {},
      onError: error => {
        toast.error('댓글 삭제에 실패했습니다.', { position: 'top-center' });
      },
    });

  const openAlertModal = useOpenAlertModal();

  const [isEditing, setIsEditing] = useState(false);
  const toggleEditing = () => {
    setIsEditing(prev => !prev);
  };

  // 대댓글 상태관리
  const [isReplying, setIsReplying] = useState(false);
  const toggleReply = () => {
    setIsReplying(prev => !prev);
  };

  const handleDeleteComment = () => {
    openAlertModal({
      title: '댓글 삭제',
      description: '삭제된 댓글은 되돌릴 수 없습니다. 정말 삭제하시겠습니까?',
      onPositive: () => {
        deleteComment(props.id);
      },
      onNegative: () => {
        console.log('취소');
      },
    });
  };

  const isMine = session?.user.id === props.author.id;

  // UI/UX 적용 : 일반적 댓글인지, 대댓글인지를 정의함
  const isRootComment = props.parentComment === undefined;

  // 대댓글의 해시태그 출력을 위한 파악
  const isOverTwoLevels = props.parent_comment_id !== props.root_comment_id;

  return (
    <div
      className={`flex flex-col gap-8 pb-5 ${isRootComment ? 'border-b' : 'ml-6'}`}
    >
      <div className='flex items-start gap-4'>
        <Link href={'#'}>
          <div className='flex h-full flex-col'>
            <Image
              className='h-10 w-10 rounded-full object-cover'
              src={props.author.avatar_url || defaultAvatar}
              width={40}
              height={40}
              alt={props.author.nickname || '회원 이미지'}
            />
          </div>
        </Link>
        <div className='flex w-full flex-col gap-2'>
          <div className='font-bold'>{props.author.nickname}</div>

          {isEditing ? (
            <CommentEditor
              type='EDIT'
              commentId={props.id}
              initialContent={props.content}
              onClose={toggleEditing}
            />
          ) : (
            <div>
              {isOverTwoLevels && (
                <span className='font-bold text-blue-500'>
                  @{props.parentComment?.author.nickname}
                </span>
              )}
              {props.content}
            </div>
          )}

          <div className='text-muted-foreground flex justify-between text-sm'>
            <div className='flex items-center gap-2'>
              <div
                onClick={toggleReply}
                className='cursor-pointer hover:underline'
              >
                댓글
              </div>
              <div className='bg-border h-[13px] w-[2px]'></div>
              <div>{formatTimeAgo(props.created_at)}</div>
            </div>

            <div className='flex items-center gap-2'>
              {isMine && (
                <>
                  <div
                    onClick={toggleEditing}
                    className='cursor-pointer hover:underline'
                  >
                    수정
                  </div>
                  <div className='bg-border h-[13px] w-[2px]'></div>
                  <div
                    onClick={handleDeleteComment}
                    className='cursor-pointer hover:underline'
                  >
                    삭제
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 대댓글 영역 */}
      {isReplying && (
        <div className='flex flex-col gap-2'>
          <CommentEditor
            type='REPLY'
            postId={props.post_id}
            parentCommentId={props.id}
            rootCommentId={props.root_comment_id || props.id}
            onClose={toggleReply}
          />
        </div>
      )}

      {/* children 댓글 목록 출력 */}
      {props.children.map(comment => (
        <CommentItem key={comment.id} {...comment} />
      ))}
    </div>
  );
}
```
