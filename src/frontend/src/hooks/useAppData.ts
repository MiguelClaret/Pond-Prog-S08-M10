import { useContext } from 'react';
import { AppDataContext } from '../state/AppDataContext';

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData precisa ser usado dentro de AppDataProvider.');
  }

  return context;
}
