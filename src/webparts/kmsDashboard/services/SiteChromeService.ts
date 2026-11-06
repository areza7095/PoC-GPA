import type { SPFI } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

/** Settings are stored as key/value rows: `Key` (single line) + `Value` (multi line). */
export type ISiteSettings = Record<string, string>; // keys are lower-cased

interface ISettingItem {
  ID?: number;
  Title?: string;
  Key?: string;
  Value?: string;
}

/**
 * Reads the key/value settings list used to drive the site chrome customisation
 * (sidebar, header background, logo, custom CSS). Uses `select=*` so the list
 * keeps working when it only has the default `Title` column, and never throws
 * for an empty/missing list: an empty object simply means "keep the defaults".
 */
export const getSiteSettings = async (sp: SPFI, listName: string): Promise<ISiteSettings> => {
  const settings: ISiteSettings = {};

  let items: ISettingItem[];
  try {
    items = await sp.web.lists.getByTitle(listName).items.select('*').top(500)();
  } catch {
    return settings; // list missing or not readable -> defaults
  }

  items.forEach((item: ISettingItem): void => {
    const key = (item.Key || item.Title || '').trim().toLowerCase();
    const value = (item.Value || '').trim();
    if (key) {
      settings[key] = value;
    }
  });

  return settings;
};
