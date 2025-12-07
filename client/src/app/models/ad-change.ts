export interface AdCreate {
  title: string;
  description: string;
  category: string;
  location: string;
  imageUrl?: string;
}

export interface AdUpdate {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  imageUrl?: string;
}
