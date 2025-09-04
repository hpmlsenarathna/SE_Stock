import { useState } from "react";

interface UndoAction<T> {
  data: T;                       // what was deleted/changed
  restore: () => Promise<void>;  // how to restore it (API call)
}

export function useUndo<T>() {
  const [lastAction, setLastAction] = useState<UndoAction<T> | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // call this after a delete
  const registerUndo = (action: UndoAction<T>, msg: string) => {
    setLastAction(action);
    setMessage(msg);
  };

  const undo = async () => {
    if (lastAction) {
      await lastAction.restore();   // call restore API
      setMessage("Undo successful ✅");
      setLastAction(null);
    }
  };

  const clearMessage = () => setMessage(null);

  return { message, registerUndo, undo, clearMessage };
}
