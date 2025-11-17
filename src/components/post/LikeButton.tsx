import { useTogglePostLike } from '@/hooks/mutations/post/useTogglePostLike';
import { useSession } from '@/stores/session';
import { HeartIcon } from 'lucide-react';

export default function LikeButton({
  id,
  likeCount,
  isLiked,
}: {
  id: number;
  likeCount: number;
  isLiked: boolean;
}) {
  const session = useSession();
  const { mutate: togglePostlike } = useTogglePostLike();
  const handleToggleLike = () => {
    togglePostlike({ postId: id, userId: session!.user.id });
  };

  return (
    <div
      onClick={handleToggleLike}
      className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-xl border-1 p-2 px-4 text-sm'
    >
      <HeartIcon
        className={`h-4 w-4 ${isLiked ? 'fill-red-500 border-foreground ' : ''}`}
      />
      <span>{likeCount}</span>
    </div>
    
  );
}
