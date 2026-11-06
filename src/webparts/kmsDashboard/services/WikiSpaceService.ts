import type { SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

import type { IWikiSpace } from '../model/IWikiSpace';

const DEFAULT_ICON_NAME = 'Page';
const MAX_ITEMS = 5000;

/**
 * SharePoint may return a field as a plain string, as { Url, Description }
 * (hyperlink columns) or as { serverRelativeUrl } (image columns).
 */
const normalizeUrl = (value: unknown): string => {
  if (!value || typeof value === 'string') {
    return (value as string) || '';
  }

  const obj = value as { Url?: string; url?: string; serverRelativeUrl?: string };
  return obj.Url || obj.url || obj.serverRelativeUrl || '';
};

const toBoolean = (value: unknown): boolean => {
  // Column missing or empty -> keep the item, the list may not be fully provisioned yet.
  if (value === undefined || value === null || value === '') {
    return true;
  }

  return value !== false && value !== 0 && value !== '0' && value !== 'false';
};

interface IWikiSpaceItem {
  ID?: number;
  Id?: number;
  Title?: string;
  Description?: string;
  Category?: string;
  IconName?: string;
  IconColor?: string;
  TileImage?: unknown;
  LinkUrl?: unknown;
  SortOrder?: number;
  Order?: number;
  IsActive?: unknown;
}

const mapItem = (item: IWikiSpaceItem): IWikiSpace => {
  const sortValue = typeof item.SortOrder === 'number' ? item.SortOrder : item.Order;

  return {
    id: item.ID ?? item.Id ?? 0,
    title: item.Title || '',
    description: item.Description || '',
    category: item.Category || '',
    iconName: item.IconName || DEFAULT_ICON_NAME,
    iconColor: item.IconColor || '',
    imageUrl: normalizeUrl(item.TileImage) || undefined,
    linkUrl: normalizeUrl(item.LinkUrl) || undefined,
    order: typeof sortValue === 'number' ? sortValue : Number.MAX_SAFE_INTEGER
  };
};

/**
 * Reads every active wiki space from the given list, ordered by the `SortOrder` column.
 * The query only uses `select=*` so the web part keeps working when an optional
 * column (IconName, TileImage, ...) has not been created yet.
 */
export const getWikiSpaces = async (sp: SPFI, listName: string): Promise<IWikiSpace[]> => {
  const items: IWikiSpaceItem[] = await sp.web.lists
    .getByTitle(listName)
    .items.select('*')
    .top(MAX_ITEMS)();

  return items
    .filter((item) => (item.Title || '').length > 0 && toBoolean(item.IsActive))
    .map(mapItem)
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
};
