# Zustand 미들웨어

- 특정 로직에 `중간에 관여하여 추가작업` 후 다음 로직 실행하는 단계
- 회원가입 로직에 순차적 `중간단계에 로그, 중복확인 등 처리`하고 결과 리턴
- 5개의 미들웨어에 대한 이해 필요
- store 생성시 `중간단계에서 미들웨어 작동 후` 결과 리턴
- `미들웨어 적용 순서가 엄청 중요함`

## 1. Middleware 종류

- combine : Store 의 `State 타입을 자동 추론` (Action 타입은 별도)
- immer : Store 의 State 가 객체, 배열, 중첩객체, 중첩배열등 복잡한 경우 활용
- subscribeWithSelector : Store 내부의 특정 값 변화시, 이벤트 핸들러 호출
- persist : Store 의 값을 모두 로컬 또는 세션 등에 Storage 에 보관 옵션
- devtools : Store 의 값을 개발자 도구에서 확인하며 디버그 진행시 활용

## 2. combine

- `/src/stores/count.ts`
- `결합한다`는 의미
- create 로 Store 생성시 `state` 와 `actions` 를 한 개의 객체로 만들지 않겠다.
- `state` 와 `actions` 를 분리해서 작성하고, 결합시키는 방식으로 Store 정의
- `state` 의 타입 자동 추론으로 편리하다.

### 2.1. 작성순서

- 단계 1.

```ts
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

create(combine(스토어에 포함될 State 객체, 콜백함수));
```

- 단계 2.

```ts
create(combine({ count: 0 }, 콜백함수));
```

- 단계 3.

```ts
create(combine({ count: 0 }, () => {}));
```

- 단계 4.

```ts
create(combine({ count: 0 }, (set, get) => 리턴객체));
```

- 단계 5.
- 화살표 함수 때문에 리턴객체는 `({리턴객체})` 필수

```ts
create(combine({ count: 0 }, (set, get) => ({ 리턴객체 })));
```

- 단계 6.

```ts
create(combine({ count: 0 }, (set, get) => ({ 키명: 기능값 })));
```

```ts
create(
  combine({ count: 0 }, (set, get) => ({
    // 키명: 기능
    actions: {
      increment: () => {
        // 함수형태 지원
        set(store => ({ count: store.count + 1 }));
      },
      decrement: () => {
        set(store => ({ count: store.count - 1 }));
      },
    },
  }))
);
```

#### 2.2. combine 의 장점

- combine(스테이트 객체, 콜백함수)
- `스테이트 객체의 타입을 자동 추론`해 준다
- 전체 Store 의 타입을 추론하는 건 아니다
- 정확히 개발자가 명시해 주기 위해서 action 은 아래처럼 작성함

```ts
create(
  combine({ count: 0 }, (set, get) => ({
    actions: {
      increment: () => {
        get(); // 자동타입추론
        // 함수형태 지원 (store 대신에 state 작성이 관례)
        set(state => ({ count: state.count + 1 }));
      },
      decrement: () => {
        set(state => ({ count: state.count - 1 }));
      },
    },
  }))
);
```

### 2.3. 최종 코드

```ts
import { create } from 'zustand';
import { combine } from 'zustand/middleware';

// create 함수는 hook 을 리턴한다.
const useCountStore = create(
  combine({ count: 0 }, (set, get) => ({
    actions: {
      increment: () => {
        get(); // 자동타입추론
        // 함수형태 지원 (store 대신에 state 작성이 관례)
        set(state => ({ count: state.count + 1 }));
      },
      decrement: () => {
        set(state => ({ count: state.count - 1 }));
      },
    },
  }))
);

// 전용 훅들
export const useCount = () => {
  const count = useCountStore(store => store.count);
  return count;
};
export const useIncrement = () => {
  const increment = useCountStore(store => store.actions.increment);
  return increment;
};
export const useDecrement = () => {
  const decrement = useCountStore(store => store.actions.decrement);
  return decrement;
};
```

## 3. immer

- state 객체를 편리하게 `불변성 관리`해주는 도구
- 이전의 값고 새로운 값이 다르면 리랜더링한다.
- 이전의 객체와 새로운 객체가 다르면 리랜더링한다.

### 3.1. 설치

```bash
npm i immer
```

### 3.2. import 해주기

```ts
import { immer } from 'zustand/middleware/immer';
```

### 3.3. 적용은 순서가 중요하다.

- 1 단계

```ts
const useCountStore = create();
```

- 2 단계

```ts
const useCountStore = create(immer());
```

- 3 단계

```ts
const useCountStore = create(immer(combine()));
```

### 3.4. 적용코드

```ts
import { create } from 'zustand';
import { combine } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// create 함수는 hook 을 리턴한다.

const useCountStore = create(
  // 불변성 유지 immer 적용
  immer(
    combine({ count: 0 }, (set, get) => ({
      actions: {
        increment: () => {
          get(); // 자동타입추론
          // 함수형태 지원 (store 대신에 state 작성이 관례)
          set(state => ({ count: state.count + 1 }));
        },
        decrement: () => {
          set(state => ({ count: state.count - 1 }));
        },
      },
    }))
  )
);

// 전용 훅들
export const useCount = () => {
  const count = useCountStore(store => store.count);
  return count;
};
export const useIncrement = () => {
  const increment = useCountStore(store => store.actions.increment);
  return increment;
};
export const useDecrement = () => {
  const decrement = useCountStore(store => store.actions.decrement);
  return decrement;
};
```

## 4. subscribeWithSelector

- subscribe : 구독
- Selector : Selector 함수
- 특정 값이 변경이 될 때 추가로 함수도 같이 실행한다.
- `state` 가 변하면 함수도 실행된다.
- ex) 로그인을 하면 쿠키, 세션 굽고, 로그아웃 하면 쿠키, 세션 정보 지우고

### 4.1. 생성단계

- 단계 1.

```ts
import { combine, subscribeWithSelector } from 'zustand/middleware';
```

- 단계 2.

```ts
const useCountStore = create(subscribeWithSelector());
```

- 단계 3.

```ts
const useCountStore = create(subscribeWithSelector(immer코드));
```

- 단계 4.

```ts
// create 함수는 hook 을 리턴한다.
const useCountStore = create(
  subscribeWithSelector(
    // 불변성 유지 immer 적용
    immer(
      combine({ count: 0 }, (set, get) => ({
        actions: {
          increment: () => {
            get(); // 자동타입추론
            // 함수형태 지원 (store 대신에 state 작성이 관례)
            set(state => ({ count: state.count + 1 }));
          },
          decrement: () => {
            set(state => ({ count: state.count - 1 }));
          },
        },
      }))
    )
  )
);
```

### 4.2. 적용단계

- 단계 1.

```ts
useCountStore.subscribe();
```

- 단계 2.

```ts
useCountStore.subscribe(
    스토어에 어떠한 값을 구동할지 결정하는 Selector 함수 정의,
  콜백함수(값이 변경될 때마다 실행될 함수) 작성
);
```

- 단계 3.

```ts
useCountStore.subscribe(
  ()=>리턴객체,
  콜백함수(값이 변경될 때마다 실행될 함수) 작성
);
```

- 단계 4.

```ts
useCountStore.subscribe(
  (store)=>store.count,
  콜백함수(값이 변경될 때마다 실행될 함수) 작성
);
```

- 단계 5.

```ts
useCountStore.subscribe(
  store => store.count,
  (새로운 값, 기존의 값) => {
    하고 싶은 일
  }
);
```

- 단계 6.

```ts
useCountStore.subscribe(
  store => store.count,
  (count, previousSelectedState) => {
    console.log('새로운 값', count);
  }
);
```

- 단계 7. 최종코드

```ts
useCountStore.subscribe(
  store => store.count,
  (count, prevCount) => {
    console.log(count, prevCount);
    // 현재 스토어의 값을 읽어오기
    const store = useCountStore.getState();
    console.log(store);
    // 아래 코드는 store 의 count 를 계속 업데이트 하므로 무한 루프가 돈다.
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState({ count: 100 });
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState(state => {
    //   state.count = 100;
    // });
  }
);
```

### 4.3. 최종코드

```ts
import { create } from 'zustand';
import { combine, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// create 함수는 hook 을 리턴한다.
const useCountStore = create(
  subscribeWithSelector(
    // 불변성 유지 immer 적용
    immer(
      combine({ count: 0 }, (set, get) => ({
        actions: {
          increment: () => {
            get(); // 자동타입추론
            // 함수형태 지원 (store 대신에 state 작성이 관례)
            set(state => ({ count: state.count + 1 }));
          },
          decrement: () => {
            set(state => ({ count: state.count - 1 }));
          },
        },
      }))
    )
  )
);

useCountStore.subscribe(
  store => store.count,
  (count, prevCount) => {
    console.log(count, prevCount);
    // 현재 스토어의 값을 읽어오기
    const store = useCountStore.getState();
    console.log(store);
    // 아래 코드는 store 의 count 를 계속 업데이트 하므로 무한 루프가 돈다.
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState({ count: 100 });
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState(state => {
    //   state.count = 100;
    // });
  }
);

// 전용 훅들
export const useCount = () => {
  const count = useCountStore(store => store.count);
  return count;
};
export const useIncrement = () => {
  const increment = useCountStore(store => store.actions.increment);
  return increment;
};
export const useDecrement = () => {
  const decrement = useCountStore(store => store.actions.decrement);
  return decrement;
};
```

## 5. persist

- 현재 Store 에 모든 내용을 웹브라우저에 보관
- 쿠키에 보관 가능 : 일정 기간 동안 보관 가능함
- 세션에 보관 가능 : 웹브라우저 종료시 사라짐
- 로컬스토리지에 보관 가능 : 영원히 보관함
- 주의사항 : 현실적으로 store 는 state 와 action 으로 구성됨

### 5.1. 적용단계

- 단계 1.

```ts
import { combine, subscribeWithSelector, persist } from 'zustand/middleware';
```

- 단계 2.

```ts
const useCountStore = create();
```

- 단계 3.

```ts
const useCountStore = create(persist());
```

- 단계 4.

```ts
const useCountStore = create(persist(subscribeWithSelector 함수 등, {옵션객체}));
```

- 단계 5.

```ts
const useCountStore = create(
  persist(
    subscribeWithSelector(
      // 불변성 유지 immer 적용
      immer(
        combine({ count: 0 }, (set, get) => ({
          actions: {
            increment: () => {
              get(); // 자동타입추론
              // 함수형태 지원 (store 대신에 state 작성이 관례)
              set(state => ({ count: state.count + 1 }));
            },
            decrement: () => {
              set(state => ({ count: state.count - 1 }));
            },
          },
        }))
      )
    ),
    { 옵션객체 }
  )
);
```

- 단계 6. : 로컬스토리지 이름 옵션

```ts
const useCountStore = create(
  persist(
    subscribeWithSelector(
      // 불변성 유지 immer 적용
      immer(
        combine({ count: 0 }, (set, get) => ({
          actions: {
            increment: () => {
              get(); // 자동타입추론
              // 함수형태 지원 (store 대신에 state 작성이 관례)
              set(state => ({ count: state.count + 1 }));
            },
            decrement: () => {
              set(state => ({ count: state.count - 1 }));
            },
          },
        }))
      )
    ),
    {
      // 기본적으로 로컬스토리지에 저장됨
      name: 'countStore',
    }
  )
);
```

### 5.2. 저장된 내용 확인하기

- F12 개발자 모드 > Apllication 탭 활성
- `Local Storage` 탭 내용 확인
- 문제점 확인해보기

```txt
{"state":{"count":3,"actions":{}},"version":0}
```

- 위의 결과로 actions 의 함수가 모두 사라짐. 액션 기능 삭제
- `불러와서 사용하면 문제 발생`

### 5.3. 옵션으로 개선하기

```ts
{
  // 기본적으로 로컬스토리지에 저장됨
  name: 'countStore',
  // 보관할 대상을 지정함
  partialize: state => ({ count: state.count }),
}
```

- 보관된 데이터

```txt
{"state":{"count":3},"version":0}
```

### 5.4. 저장소를 변경하기

- 로컬스토리지가 기본 저장소

```ts
import {
  combine,
  subscribeWithSelector,
  persist,
  createJSONStorage,
} from 'zustand/middleware';
```

- 적용

```ts
{
  // 기본적으로 로컬스토리지에 저장됨
  name: 'countStore',
  // 보관할 대상을 지정함
  partialize: state => ({ count: state.count }),
  // 저장소 변경하기 (sessionStorage 저장)
  storage: createJSONStorage(() => sessionStorage),
}
```

## 6. devtools

- 개발 중에 웹 브라우저에서 디버깅 용도

### 6.1. 적용단계

- 단계 1.

```ts
import {
  combine,
  subscribeWithSelector,
  persist,
  createJSONStorage,
  devtools,
} from 'zustand/middleware';
```

- 단계 2.

```ts
const useCountStore = create();
```

- 단계 3.

```ts
const useCountStore = create(devtools());
```

- 단계 4.

```ts
const useCountStore = create(devtools(persist 등, {옵션객체}));
```

- 단계 5.

```ts
const useCountStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        // 불변성 유지 immer 적용
        immer(
          combine({ count: 0 }, (set, get) => ({
            actions: {
              increment: () => {
                get(); // 자동타입추론
                // 함수형태 지원 (store 대신에 state 작성이 관례)
                set(state => ({ count: state.count + 1 }));
              },
              decrement: () => {
                set(state => ({ count: state.count - 1 }));
              },
            },
          }))
        )
      ),
      {
        // 기본적으로 로컬스토리지에 저장됨
        name: 'countStore',
        // 보관할 대상을 지정함
        partialize: state => ({ count: state.count }),
        // 저장소 변경하기
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    { 옵션객체 }
  )
);
```

- 단계 6. 옵션객체

```ts
{
    // 디버깅 구분용
   name: 'countStore',
}
```

### 6.2. Redux Devtools 설치

- https://chromewebstore.google.com/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=ko&pli=1

### 6.3. 최종코드

```ts
import { create } from 'zustand';
import {
  combine,
  subscribeWithSelector,
  persist,
  createJSONStorage,
  devtools,
} from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// create 함수는 hook 을 리턴한다.

const useCountStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        // 불변성 유지 immer 적용
        immer(
          combine({ count: 0 }, (set, get) => ({
            actions: {
              increment: () => {
                get(); // 자동타입추론
                // 함수형태 지원 (store 대신에 state 작성이 관례)
                set(state => ({ count: state.count + 1 }));
              },
              decrement: () => {
                set(state => ({ count: state.count - 1 }));
              },
            },
          }))
        )
      ),
      {
        // 기본적으로 로컬스토리지에 저장됨
        name: 'countStore',
        // 보관할 대상을 지정함
        partialize: state => ({ count: state.count }),
        // 저장소 변경하기
        storage: createJSONStorage(() => sessionStorage),
      }
    ),
    {
      // 디버깅 구분용
      name: 'countStore',
    }
  )
);

useCountStore.subscribe(
  store => store.count,
  (count, prevCount) => {
    console.log(count, prevCount);
    // 현재 스토어의 값을 읽어오기
    const store = useCountStore.getState();
    console.log(store);
    // 아래 코드는 store 의 count 를 계속 업데이트 하므로 무한 루프가 돈다.
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState({ count: 100 });
    // 현재 스토어의 값을 업데이트 하기
    // useCountStore.setState(state => {
    //   state.count = 100;
    // });
  }
);

// 전용 훅들
export const useCount = () => {
  const count = useCountStore(store => store.count);
  return count;
};
export const useIncrement = () => {
  const increment = useCountStore(store => store.actions.increment);
  return increment;
};
export const useDecrement = () => {
  const decrement = useCountStore(store => store.actions.decrement);
  return decrement;
};
```
