import { useRef, useCallback, useEffect } from 'react';

const useAutoSave = (saveFn, delay = 8000) => {
  const timerRef = useRef(null);
  const pendingRef = useRef(false);

  const scheduleeSave = useCallback(() => {
    pendingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (pendingRef.current) {
        pendingRef.current = false;
        await saveFn();
      }
    }, delay);
  }, [saveFn, delay]);

  const flush = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (pendingRef.current) {
      pendingRef.current = false;
      await saveFn();
    }
  }, [saveFn]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { scheduleeSave, flush };
};

export default useAutoSave;
