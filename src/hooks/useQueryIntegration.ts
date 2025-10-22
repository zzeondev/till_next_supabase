// React Query 와 Zustand 통합 훅

import { fetchUser } from '@/lib/api';
import { useQueryStore } from '@/stores/queryStore';
import { useQuery } from '@tanstack/react-query';

// 선택된 사용자 정보를 가져온느 훅
export function useSelectedUser() {
  // 사용자 정보를 zustand 로 관리
  const { selectedUserId } = useQueryStore();

  return useQuery({
    queryKey: ['users', selectedUserId],
    queryFn: () => fetchUser(selectedUserId!),
    enabled: !!selectedUserId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// 선택된 게시글 정보를 가져오는 훅
export function useSelectedPost() {
  // 게시글 정보를 zustand 로 관리
  const { selectedPostId } = useQueryStore();

  return useQuery({
    queryKey: ['posts', selectedPostId],
    queryFn: () => fetchUser(selectedPostId!),
    enabled: !!selectedPostId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// 사용자 선택 기능을 제공하는 훅
export function useUserSelection() {
  const { selectedUserId, setSelectedUserId } = useQueryStore();
  // 선택된 사용자 정보를 가져오는 훅
  const selectdUserQuery = useSelectedUser();
  return {
    // 상태
    selectedUserId,
    selectedUser: selectdUserQuery.data,
    isLoading: selectdUserQuery.isLoading,
    error: selectdUserQuery.error,
  };
}

// 게시글 선택 기능을 제공하는 훅
export function usePostSelection() {}

// 업데이트를 위한 훅
export function useOptimisticUpdate() {}

// 쿼리 프리패치를 위한 훅
export function usePrefetchQuery() {}

// React Query 와 Zustand 상태 동기화 훅
export function useQuerySync() {}
