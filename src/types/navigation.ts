import type {ComponentType} from 'react';
import type {StackScreenProps} from '@react-navigation/stack';
import type {DrawerScreenProps} from '@react-navigation/drawer';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {Credentials} from './auth';

export type RootStackParamList = {
  Landing: undefined;
  HomeScreen: {
    url: string;
    sid: string;
    credentials: Credentials;
  };
  register: {url: string};
  platba: {
    url: string;
    sid: string;
    stream: number;
    headerTitle: string;
  };
  nakupy: {url: string; sid: string};
  najkratsie: AudioListScreenParams;
  najnovsie: AudioListScreenParams;
  najpopularnejsie: AudioListScreenParams;
  najdlhsie: AudioListScreenParams;
  person_list: PersonListScreenParams;
  person_detail: PersonDetailScreenParams;
  category_list: CategoryListScreenParams;
  category_detail: PersonDetailScreenParams;
};

export type DrawerParamList = {
  Home: {user?: string};
};

export interface AudioListScreenParams {
  url: string;
  sid: string | null;
  scrollToIndex?: number;
}

export interface PersonListScreenParams {
  url: 'autori' | 'interpreti';
  sid: string | null;
}

export interface PersonDetailScreenParams {
  url: 'autori' | 'interpreti' | 'kategorie';
  personId: string;
  sid: string | null;
  title?: string;
  scrollToIndex?: number;
}

export interface CategoryListScreenParams {
  url: string;
  sid: string | null;
}

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type DrawerCompositeProps<T extends keyof RootStackParamList> =
  CompositeScreenProps<
    StackScreenProps<RootStackParamList, T>,
    DrawerScreenProps<DrawerParamList>
  >;

/** Bridges class screen components to React Navigation's per-route component type. */
export function stackScreen<T extends keyof RootStackParamList>(
  screen: ComponentType<RootStackScreenProps<T>>,
): ComponentType<StackScreenProps<RootStackParamList, T>> {
  return screen as ComponentType<StackScreenProps<RootStackParamList, T>>;
}
