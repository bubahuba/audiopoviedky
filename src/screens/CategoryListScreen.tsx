/* eslint-disable react-native/no-inline-styles */
import React, {createRef} from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  type ScaledSize,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CategoryItem from '../components/CategoryItem';
import ListRefreshControl from '../components/ListRefreshControl';
import {fetchJsonFromSource, fetchJsonWithCache} from '../services/apiCache';
import {
  getListHorizontalPadding,
  getListSafeAreaEdges,
} from '../utils/landscapeLayout';
import {setScrollToTopHeaderTitle} from '../utils/listHeader';
import {scrollFlatListToTop} from '../utils/listScroll';
import {API_URL, type CategoriesResponse, type Category} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';

type Props = RootStackScreenProps<'category_list'>;

interface CategoryListScreenState {
  categories: Category[];
  sid: string | null;
  dimensions: ScaledSize;
  getHeight: number;
  isLoading: boolean;
  refreshing: boolean;
}

export default class CategoryListScreen extends React.Component<
  Props,
  CategoryListScreenState
> {
  private listRef = createRef<FlatList<Category>>();
  private dimensionsSubscription?: {remove: () => void};

  constructor(props: Props) {
    super(props);
    const dimensions = Dimensions.get('screen');
    this.state = {
      categories: [],
      sid: props.route.params.sid,
      dimensions,
      getHeight: this.getHeight(dimensions),
      isLoading: true,
      refreshing: false,
    };
  }

  componentDidMount = async () => {
    this.updateHeaderTitle('Knižné série');

    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      ({screen}) => {
        this.setState({
          dimensions: screen,
          getHeight: this.getHeight(screen),
        });
      },
    );

    await this.loadCategories(false);
    this.setState({isLoading: false});
  };

  getRequestOptions = (): RequestInit => {
    const {route} = this.props;
    return {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        Cookie: 'PHPSESSID=' + route.params.sid,
      },
      credentials: 'include',
    };
  };

  loadCategories = async (fromSource: boolean) => {
    const {route} = this.props;
    const requestUrl = `${API_URL}${route.params.url}?app`;
    const fetchJson = fromSource ? fetchJsonFromSource : fetchJsonWithCache;

    try {
      const responseJson = await fetchJson<CategoriesResponse>(
        requestUrl,
        this.getRequestOptions(),
      );
      this.setState({categories: responseJson.categories});
    } catch (error) {
      console.error(error);
    }
  };

  handleRefresh = async () => {
    this.setState({refreshing: true});
    await this.loadCategories(true);
    this.setState({refreshing: false, isLoading: false});
  };

  scrollToTop = () => {
    scrollFlatListToTop(this.listRef);
  };

  updateHeaderTitle = (title: string) => {
    setScrollToTopHeaderTitle(
      this.props.navigation,
      title,
      this.scrollToTop,
    );
  };

  componentWillUnmount = () => {
    this.dimensionsSubscription?.remove();
  };

  renderItem = (item: Category, index: number) => {
    if (this.state.categories[index]?.id) {
      return (
        <CategoryItem
          item={item}
          artwork={null}
          onPress={this.onCategoryPress}
          listKey={index}
          getHeight={this.state.getHeight}
        />
      );
    }
    return null;
  };

  onCategoryPress = (index: number) => {
    const {route, navigation} = this.props;
    const category = this.state.categories[index];
    if (!category) {
      return;
    }
    navigation.navigate('category_detail', {
      url: 'kategorie',
      personId: category.id,
      title: category.name,
      sid: this.state.sid,
    });
  };

  setDimensions = () => {
    const dimensions = Dimensions.get('screen');
    this.setState({
      dimensions,
      getHeight: this.getHeight(dimensions),
    });
  };

  getHeight = (dimensions: ScaledSize): number => {
    return dimensions.width < 600
      ? dimensions.width - 30
      : dimensions.width * 0.4;
  };

  render() {
    const {dimensions, categories, isLoading, refreshing} = this.state;
    const horizontalPadding = getListHorizontalPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);

    if (isLoading && categories.length === 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <ActivityIndicator size="large" color="#261710" style={styles.list} />
        </SafeAreaView>
      );
    }

    if (categories.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <FlatList
            ref={this.listRef}
            style={styles.list}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({item, index}) => this.renderItem(item, index)}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingVertical: 5,
            }}
            refreshControl={
              <ListRefreshControl
                refreshing={refreshing}
                onRefresh={this.handleRefresh}
              />
            }
            onLayout={() => {
              this.setDimensions();
            }}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={safeAreaEdges}>
        <ActivityIndicator size="large" color="#261710" style={styles.list} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c7a7a2',
  },
  list: {
    flex: 1,
  },
});
