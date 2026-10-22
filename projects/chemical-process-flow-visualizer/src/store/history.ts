import type { ProcessFlowDocument } from '../model/types';

export interface EditorHistory {
  past: ProcessFlowDocument[];
  present: ProcessFlowDocument;
  future: ProcessFlowDocument[];
}

export type HistoryAction =
  | { type: 'commit'; document: ProcessFlowDocument }
  | { type: 'replace'; document: ProcessFlowDocument }
  | { type: 'undo' }
  | { type: 'redo' };

export function createEditorHistory(document: ProcessFlowDocument): EditorHistory {
  return { past: [], present: document, future: [] };
}

export function historyReducer(state: EditorHistory, action: HistoryAction): EditorHistory {
  if (action.type === 'replace') {
    return { ...state, present: action.document };
  }
  if (action.type === 'commit') {
    if (action.document === state.present) return state;
    return {
      past: [...state.past, state.present].slice(-100),
      present: action.document,
      future: [],
    };
  }
  if (action.type === 'undo') {
    const previous = state.past.at(-1);
    if (!previous) return state;
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    };
  }
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
  };
}
