import { UseMutationCallback } from '@/types/types';
import { useMutation } from '@tanstack/react-query';
import { updatePost } from '@/apis/post';

export function useUpdatePost(callback?: UseMutationCallback) {
  return useMutation({
    mutationFn: updatePost,
    onSuccess: () => {
      if (callback?.onSuccess) callback.onSuccess();
    },
    onError: error => {
      if (callback?.onError) callback.onError(error);
    },
  });
}
