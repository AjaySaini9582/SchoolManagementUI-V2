export interface Notice {
  id: number;
  title: string;
  body: string;
  publishedOn: string;
  expiryDate: string | null;
  isActive: boolean;
}
