import type { SPFI } from '@pnp/sp';

export interface IKmsDashboardProps {
  sp: SPFI;
  title: string;
  listName: string;
  showSearch: boolean;
  showFilter: boolean;
  openInNewTab: boolean;
}
