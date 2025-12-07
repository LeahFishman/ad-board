export interface Ad {
  id: string; // GUID from server
  title: string;
  shortDescription: string;
  category: string;
  location: string;
  createdAt: string;
  imageUrl?: string;
  userName?: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}
