export interface IWikiSpace {
  id: number;
  title: string;
  description: string;
  category: string;
  iconName: string;
  iconColor: string;
  imageUrl?: string;
  linkUrl?: string;
  order: number;
}
