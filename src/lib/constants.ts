// 쿼리키 픽토링 상수
export const QUERY_KEYS = {
  // 프로필 useQuery 키 생성 및 관리
  profile: {
    all: ['profile'],
    list: ['profile', 'list'],
    byId: (userId: string) => ['profile', 'byId', userId],
  },
  // 포스트 useQuery 키 생성 및 관리
  posts: {
    all: ['posts'],
    list: ['posts', 'list'],
    byId: (postsId: number) => ['posts', 'byId', postsId],
    // 추가됨
    userlist: (userId: string) => ['posts', 'userList', userId],
  },
  // 댓글 useQuery 키 생성 및 관리
  comments: {
    all: ['comments'],
    post: (postId: number) => ['comments', 'post', postId],
  },
};

// 버킷 이름 : Supabase Storage
export const BUCKET_NAME = 'uploads';
