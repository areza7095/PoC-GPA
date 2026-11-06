import * as React from 'react';
import { SearchBox } from '@fluentui/react';

import styles from './KmsDashboard.module.scss';
import type { IKmsDashboardProps } from './IKmsDashboardProps';
import type { IWikiSpace } from '../model/IWikiSpace';
import { useWikiSpaces } from './hooks/useWikiSpaces';
import FilterChips from './FilterChips';
import WikiSpaceCard from './WikiSpaceCard';
import * as strings from 'KmsDashboardWebPartStrings';

const ALL_CATEGORIES = '';
const SEARCH_DEBOUNCE_MS = 250;
const SKELETON_COUNT = 10;

const KmsDashboard: React.FC<IKmsDashboardProps> = (props) => {
  const { sp, title, listName, showSearch, showFilter, openInNewTab } = props;

  const { spaces, loading, error, reload } = useWikiSpaces(sp, listName);

  const [rawQuery, setRawQuery] = React.useState<string>('');
  const [query, setQuery] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>(ALL_CATEGORIES);

  // Debounce the search box so we only filter once the user stops typing.
  React.useEffect((): (() => void) => {
    const handle = window.setTimeout(() => setQuery(rawQuery), SEARCH_DEBOUNCE_MS);
    return (): void => window.clearTimeout(handle);
  }, [rawQuery]);

  const categories = React.useMemo<string[]>(() => {
    const seen: string[] = [];
    spaces.forEach((space: IWikiSpace): void => {
      if (space.category && seen.indexOf(space.category) === -1) {
        seen.push(space.category);
      }
    });
    return seen;
  }, [spaces]);

  // Reset the category filter when it disappears from the current data set.
  React.useEffect((): void => {
    if (category !== ALL_CATEGORIES && categories.indexOf(category) === -1) {
      setCategory(ALL_CATEGORIES);
    }
  }, [categories, category]);

  const visibleSpaces = React.useMemo<IWikiSpace[]>(() => {
    const search = query.trim().toLowerCase();
    return spaces.filter((space: IWikiSpace): boolean => {
      const matchesCategory = category === ALL_CATEGORIES || space.category === category;
      const matchesSearch =
        !search ||
        space.title.toLowerCase().indexOf(search) !== -1 ||
        space.description.toLowerCase().indexOf(search) !== -1;
      return matchesCategory && matchesSearch;
    });
  }, [spaces, category, query]);

  const renderContent = (): React.ReactElement => {
    if (loading) {
      return (
        <div className={styles.grid} aria-busy="true">
          {Array.from({ length: SKELETON_COUNT }).map((_item: unknown, index: number) => (
            <div key={index} className={`${styles.card} ${styles.skeleton}`}>
              <span className={styles.skeletonLine} />
              <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.state}>
          <p>{strings.ErrorLabel}{error}</p>
          <button type="button" className={styles.retryButton} onClick={reload}>
            {strings.RetryLabel}
          </button>
        </div>
      );
    }

    if (visibleSpaces.length === 0) {
      return (
        <div className={styles.state}>
          <p>{strings.NoResultsLabel}</p>
        </div>
      );
    }

    return (
      <div className={styles.grid}>
        {visibleSpaces.map((space: IWikiSpace) => (
          <WikiSpaceCard key={space.id} space={space} openInNewTab={openInNewTab} />
        ))}
      </div>
    );
  };

  return (
    <section className={styles.root}>
      <h2 className={styles.title}>{title}</h2>

      {(showFilter && categories.length > 0) || showSearch ? (
        <div className={styles.toolbar}>
          {showFilter && categories.length > 0 && (
            <FilterChips
              options={categories}
              selected={category}
              allLabel={strings.AllFilterLabel}
              onSelect={setCategory}
            />
          )}

          {showSearch && (
            <div className={styles.search}>
              <SearchBox
                placeholder={strings.SearchPlaceholder}
                value={rawQuery}
                underlined={false}
                onChange={(_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement> | undefined, newValue?: string): void =>
                  setRawQuery(newValue || '')
                }
              />
            </div>
          )}
        </div>
      ) : null}

      {renderContent()}
    </section>
  );
};

export default KmsDashboard;
