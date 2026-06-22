/** Parsed JSON stored in `AudioTrack.meta`. */
export interface AudioMeta {
  short_text: string;
  long_text: string;
  price?: string;
  pages?: string;
  size?: string;
  style?: string;
  edition?: string;
  odate?: string;
}

/** Single audio track from list/detail endpoints. */
export interface AudioTrack {
  id: string;
  type: string;
  date: string;
  name: string;
  meta: string;
  authors: string;
  interpreters: string;
  categories: string;
  visited: string;
  downloads: string;
  duration: string;
  tags: string;
  serie: string;
  soon: string;
  ispaid: string | null;
  isfav: string | null;
  file: string;
}

export interface Category {
  id: string;
  name: string;
  cparent_id: string | null;
  content_count: string;
  duration?: string;
}

export interface Person {
  id: string;
  name: string;
  surname: string;
  meta: string;
  content_count: string;
  isfav: string | null;
}

export interface AlphaEntry {
  alpha: string;
}

export interface CountEntry {
  pocet: string;
}

export interface StreamEntry {
  duration: string;
}

export interface AudioListResponse {
  audio: AudioTrack[];
  count: CountEntry;
  page: number;
  url_append: string;
  soon?: AudioTrack[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface AuthorsListResponse {
  authors: Person[];
  alpha: AlphaEntry[];
  count?: CountEntry;
  page?: number;
}

export interface InterpretersListResponse {
  interpreters: Person[];
  alpha: AlphaEntry[];
  count?: CountEntry;
  page?: number;
}

export interface PersonDetailResponse {
  authors?: Person[];
  interpreters?: Person[];
  audio: AudioTrack[];
  from?: string;
  page?: number;
}

export interface LoginResponse {
  sid?: string;
}

export interface SubscriptionResponse {
  stream?: StreamEntry[];
  result?: string;
}

export interface PromoResponse {
  result: string;
  msg?: string;
}

export const API_URL = 'https://audiopoviedky.sk/';
