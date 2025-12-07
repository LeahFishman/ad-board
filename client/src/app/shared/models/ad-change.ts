export interface AdCreate {
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AdUpdate {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  imageUrl?: string;
  latitude?: number | null;
  longitude?: number | null;
}
