import * as React from 'react';
import { Icon } from '@fluentui/react';

import styles from './KmsDashboard.module.scss';
import type { IWikiSpace } from '../model/IWikiSpace';

export interface IWikiSpaceCardProps {
  space: IWikiSpace;
  openInNewTab: boolean;
}

/** `IconName` may hold a Fluent font name (e.g. "People") or an image URL (e.g. an Iconify SVG link). */
const isImageUrl = (value: string): boolean => /^https?:\/\//i.test(value || '');

/** Default tile colour, only needed for font icons without an explicit `IconColor`. */
const FALLBACK_TILE_COLOR = '#0F6CBD';

const WikiSpaceCard: React.FC<IWikiSpaceCardProps> = (props) => {
  const { space, openInNewTab } = props;

  const iconIsImage = isImageUrl(space.iconName);
  const tileImage = isImageUrl(space.iconColor);

  // IconColor wins when present; without it an image icon renders plain (no tile)
  // and a font icon falls back to the default Fluent blue tile.
  const tileStyle: React.CSSProperties = tileImage
    ? {
        // fallback colour while the background image loads (or if it fails)
        backgroundColor: FALLBACK_TILE_COLOR,
        backgroundImage: `url("${space.iconColor}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : { backgroundColor: space.iconColor || (iconIsImage ? 'transparent' : FALLBACK_TILE_COLOR) };

  const tileClass = tileImage
    ? `${styles.iconTile} ${styles.iconTilePhoto}`
    : iconIsImage && !space.iconColor
      ? `${styles.iconTile} ${styles.iconTilePlain}`
      : styles.iconTile;

  const linkProps = openInNewTab
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      className={space.imageUrl ? `${styles.card} ${styles.cardWithImage}` : styles.card}
      href={space.linkUrl || '#'}
      aria-label={space.title}
      {...linkProps}
    >
      <div className={styles.cardHead}>
        <span className={tileClass} style={tileStyle}>
          {iconIsImage ? (
            <img className={styles.iconTileImage} src={space.iconName} alt="" aria-hidden="true" />
          ) : (
            <Icon iconName={space.iconName} aria-hidden="true" />
          )}
        </span>
        <span className={styles.cardTitle}>{space.title}</span>
      </div>

      {space.imageUrl ? (
        <span className={styles.cardImage} style={{ backgroundImage: `url("${space.imageUrl}")` }} />
      ) : (
        space.description && <p className={styles.cardDesc}>{space.description}</p>
      )}

      <Icon iconName="ChevronRight" className={styles.cardChevron} aria-hidden="true" />
    </a>
  );
};

export default WikiSpaceCard;
