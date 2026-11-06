import * as React from 'react';

import styles from './KmsDashboard.module.scss';

export interface IFilterChipsProps {
  options: string[];
  selected: string;
  allLabel: string;
  onSelect: (value: string) => void;
}

const FilterChips: React.FC<IFilterChipsProps> = (props) => {
  const { options, selected, allLabel, onSelect } = props;

  const chips: Array<{ key: string; label: string }> = [
    { key: '', label: allLabel },
    ...options.map((option) => ({ key: option, label: option }))
  ];

  return (
    <div className={styles.chips} role="tablist">
      {chips.map((chip) => {
        const isActive = chip.key === selected;
        return (
          <button
            key={chip.key || '__all__'}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? `${styles.chip} ${styles.chipActive}` : styles.chip}
            onClick={(): void => onSelect(chip.key)}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};

export default FilterChips;
