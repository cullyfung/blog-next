import { useEffect, useRef } from 'react';

export function useGetState<T>(state: T): () => T {
  const ref = useRef(state);

  useEffect(() => {
    ref.current = state;
  }, [state]);
  return () => ref.current;
}
