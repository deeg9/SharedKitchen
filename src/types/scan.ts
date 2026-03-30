export interface ScannedItem {
  /** Client-side ID for list key and editing */
  id: string;
  name: string;
  quantity: string;
  category: string;
  brand: string | null;
  /** ID of existing pantry item if duplicate detected */
  duplicateOfId: string | null;
  /** Name of existing pantry item if duplicate */
  duplicateOfName: string | null;
}

export interface ScanReviewState {
  items: ScannedItem[];
  loading: boolean;
  photoCount: number;
}
