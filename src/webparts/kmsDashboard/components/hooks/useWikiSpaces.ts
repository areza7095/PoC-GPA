import * as React from 'react';
import type { SPFI } from '@pnp/sp';

import type { IWikiSpace } from '../../model/IWikiSpace';
import { getWikiSpaces } from '../../services/WikiSpaceService';

export interface IWikiSpacesState {
  spaces: IWikiSpace[];
  loading: boolean;
  error?: string;
  reload: () => void;
}

export const useWikiSpaces = (sp: SPFI | undefined, listName: string): IWikiSpacesState => {
  const [spaces, setSpaces] = React.useState<IWikiSpace[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [version, setVersion] = React.useState<number>(0);

  const reload = React.useCallback((): void => {
    setVersion((current) => current + 1);
  }, []);

  React.useEffect((): (() => void) | undefined => {
    if (!sp || !listName) {
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(undefined);

    getWikiSpaces(sp, listName)
      .then((result: IWikiSpace[]): void => {
        if (!cancelled) {
          setSpaces(result);
          setLoading(false);
        }
      })
      .catch((err: Error): void => {
        if (!cancelled) {
          setSpaces([]);
          setError(err?.message || 'Unknown error');
          setLoading(false);
        }
      });

    return (): void => {
      cancelled = true;
    };
  }, [sp, listName, version]);

  return { spaces, loading, error, reload };
};
