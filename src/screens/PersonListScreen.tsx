/* eslint-disable react-native/no-inline-styles */
import React, {createRef} from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  Dimensions,
  SectionList,
  type ScaledSize,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import PersonItem from '../components/PersonItem';
import ListRefreshControl from '../components/ListRefreshControl';
import {fetchJsonFromSource, fetchJsonWithCache} from '../services/apiCache';
import {cacheImages} from '../services/imageCache';
import {
  getListSafeAreaEdges,
  getPersonListContentPadding,
  ALPHABET_RAIL_WIDTH,
} from '../utils/landscapeLayout';
import {
  getPersonSectionListItemLayout,
  scrollSectionListToTop,
  type SectionListLayoutSection,
} from '../utils/listScroll';
import {setScrollToTopHeaderTitle} from '../utils/listHeader';
import {
  API_URL,
  type AuthorsListResponse,
  type InterpretersListResponse,
  type Person,
} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';

type Props = RootStackScreenProps<'person_list'>;

interface PersonSection {
  title: string;
  data: Person[];
}

interface PersonListScreenState {
  persons: Person[];
  alphabetPersons: Record<string, Person[]>;
  sid: string | null;
  dimensions: ScaledSize;
  getHeight: number;
  artworkByPersonId: Record<string, string>;
  isLoading: boolean;
  refreshing: boolean;
}

export default class PersonListScreen extends React.Component<
  Props,
  PersonListScreenState
> {
  private sectionListRef = createRef<SectionList<Person, PersonSection>>();
  private dimensionsSubscription?: {remove: () => void};
  private lastSelectedAlphabetIndex: number | null = null;
  private alphabetBlockOffset = 0;
  private alphabetBlockHeight = 0;

  constructor(props: Props) {
    super(props);
    const dimensions = Dimensions.get('screen');
    this.state = {
      persons: [],
      alphabetPersons: {},
      sid: props.route.params.sid,
      dimensions,
      getHeight: this.getHeight(dimensions),
      artworkByPersonId: {},
      isLoading: true,
      refreshing: false,
    };
  }

  componentDidMount = async () => {
    const {route} = this.props;
    this.updateHeaderTitle(
      route.params.url === 'autori' ? 'Autori' : 'Interpreti',
    );

    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      ({screen}) => {
        this.setState({
          dimensions: screen,
          getHeight: this.getHeight(screen),
        });
      },
    );

    await this.loadPersons(false);
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
      credentials: 'omit',
    };
  };

  loadPersons = async (fromSource: boolean) => {
    const {route} = this.props;
    const requestUrl = `${API_URL}${route.params.url}/?app`;
    const fetchJson = fromSource ? fetchJsonFromSource : fetchJsonWithCache;

    try {
      const responseJson = await fetchJson<
        AuthorsListResponse | InterpretersListResponse
      >(requestUrl, this.getRequestOptions());

      const alphas = 'alpha' in responseJson ? responseJson.alpha : [];
      const alphaPersons: Record<string, Person[]> = {};
      const personData: Person[] =
        route.params.url === 'autori'
          ? (responseJson as AuthorsListResponse).authors
          : (responseJson as InterpretersListResponse).interpreters;

      alphas.forEach((value) => {
        const letter = value.alpha;
        alphaPersons[letter] = personData.filter((item) =>
          item.surname.toLowerCase().startsWith(letter.toLowerCase()),
        );
      });

      const remoteArtworks = personData.map((person) =>
        route.params.url === 'autori'
          ? `${API_URL}data/${person.id}_author.png`
          : `${API_URL}data/${person.id}_interpreter.png`,
      );
      const artworkMap = await cacheImages(remoteArtworks);
      const artworkByPersonId: Record<string, string> = {};
      personData.forEach((person, index) => {
        artworkByPersonId[person.id] =
          artworkMap[remoteArtworks[index]] || remoteArtworks[index];
      });

      this.setState({
        persons: personData,
        alphabetPersons: alphaPersons,
        artworkByPersonId,
      });
    } catch (error) {
      console.error(error);
    }
  };

  handleRefresh = async () => {
    this.setState({refreshing: true});
    await this.loadPersons(true);
    this.setState({refreshing: false, isLoading: false});
  };

  scrollToTop = () => {
    scrollSectionListToTop(this.sectionListRef);
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

  /** All alphabet buckets (including empty) for the side rail. */
  getAllSections = (): PersonSection[] => {
    return Object.keys(this.state.alphabetPersons).map((title) => ({
      title,
      data: this.state.alphabetPersons[title] ?? [],
    }));
  };

  /** Non-empty sections only — matches what SectionList renders and indexes. */
  getListSections = (): PersonSection[] => {
    return this.getAllSections().filter((section) => section.data.length > 0);
  };

  scrollToLetter = (letter: string) => {
    const listSections = this.getListSections();
    const sectionIndex = listSections.findIndex(
      (section) => section.title === letter,
    );
    if (sectionIndex < 0) {
      return;
    }

    const list = this.sectionListRef.current;
    if (!list) {
      return;
    }

    list.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      animated: true,
      viewOffset: 0,
      viewPosition: 0,
    });
  };

  getItemLayout = (
    _sections: SectionListLayoutSection[] | null,
    index: number,
  ) => getPersonSectionListItemLayout(this.getListSections(), index);

  onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    const list = this.sectionListRef.current;
    if (!list) {
      return;
    }

    const sectionIndex = this.getSectionIndexForFlatIndex(info.index);

    setTimeout(() => {
      list.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: false,
        viewOffset: 0,
        viewPosition: 0,
      });
    }, 100);
  };

  getSectionIndexForFlatIndex = (flatIndex: number): number => {
    const sections = this.getListSections();
    let index = 0;

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const sectionSize = sections[sectionIndex].data.length + 2;
      if (flatIndex < index + sectionSize) {
        return sectionIndex;
      }
      index += sectionSize;
    }

    return Math.max(sections.length - 1, 0);
  };

  handleAlphabetTouch = (locationY: number) => {
    const sections = this.getAllSections();
    if (!sections.length || this.alphabetBlockHeight <= 0) {
      return;
    }

    const letterHeight = this.alphabetBlockHeight / sections.length;
    const adjustedY = locationY - this.alphabetBlockOffset;
    if (adjustedY < 0 || adjustedY > this.alphabetBlockHeight) {
      return;
    }

    const index = Math.min(
      Math.max(Math.floor(adjustedY / letterHeight), 0),
      sections.length - 1,
    );
    const section = sections[index];

    if (this.lastSelectedAlphabetIndex !== index && section.data.length > 0) {
      this.lastSelectedAlphabetIndex = index;
      this.scrollToLetter(section.title);
    }
  };

  resetAlphabetSelection = () => {
    this.lastSelectedAlphabetIndex = null;
  };

  renderItem = (item: Person) => {
    const {route} = this.props;
    const artwork =
      this.state.artworkByPersonId[item.id] ||
      (route.params.url === 'autori'
        ? `${API_URL}data/${item.id}_author.png`
        : `${API_URL}data/${item.id}_interpreter.png`);
    return (
      <PersonItem
        item={item}
        artwork={artwork}
        onPress={this.onPersonPress}
        listKey={item.id}
        isPaused={2}
        getHeight={this.state.getHeight}
      />
    );
  };

  renderSectionHeader = ({section: {title}}: {section: PersonSection}) => {
    const contentPadding = getPersonListContentPadding(this.state.dimensions);
    return (
      <View
        style={{
          paddingLeft: contentPadding.left,
          paddingRight: contentPadding.right,
          backgroundColor: '#c7a7a2',
          paddingVertical: 5,
          marginLeft: -contentPadding.left,
          marginRight: -contentPadding.right,
        }}>
        <Text
          style={{color: '#271809', fontFamily: 'Comfortaa', lineHeight: 24}}>
          {title}
        </Text>
      </View>
    );
  };

  renderAlphabetRail = () => {
    const sections = this.getAllSections();

    return (
      <View
        style={styles.alphabetRail}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          this.handleAlphabetTouch(event.nativeEvent.locationY);
        }}
        onResponderMove={(event) => {
          this.handleAlphabetTouch(event.nativeEvent.locationY);
        }}
        onResponderRelease={this.resetAlphabetSelection}
        onResponderTerminate={this.resetAlphabetSelection}>
        <View
          style={styles.alphabetRailInner}
          onLayout={(event) => {
            this.alphabetBlockOffset = event.nativeEvent.layout.y;
            this.alphabetBlockHeight = event.nativeEvent.layout.height;
          }}>
          {sections.map((section) => {
            const isActive = section.data.length > 0;
            return (
              <View
                key={section.title}
                style={styles.alphabetLetter}
                pointerEvents="none">
                <Text
                  style={[
                    styles.alphabetLetterText,
                    !isActive && styles.alphabetLetterInactive,
                  ]}>
                  {section.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  onPersonPress = (personId: string | number) => {
    const {route, navigation} = this.props;
    navigation.navigate('person_detail', {
      url: route.params.url,
      personId: String(personId),
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
    const {dimensions, persons, isLoading, refreshing} = this.state;
    const contentPadding = getPersonListContentPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);
    const listSections = this.getListSections();

    if (isLoading && persons.length === 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <ActivityIndicator size="large" color="#261710" style={styles.list} />
        </SafeAreaView>
      );
    }

    if (persons.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <View style={styles.listContainer}>
            <SectionList<Person, PersonSection>
              ref={this.sectionListRef}
              style={styles.list}
              sections={listSections}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => this.renderItem(item)}
              renderSectionHeader={this.renderSectionHeader}
              contentContainerStyle={{
                paddingLeft: contentPadding.left,
                paddingRight: contentPadding.right,
                paddingVertical: 5,
              }}
              getItemLayout={this.getItemLayout}
              onScrollToIndexFailed={this.onScrollToIndexFailed}
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
            {this.renderAlphabetRail()}
          </View>
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
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  alphabetRail: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ALPHABET_RAIL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
    paddingVertical: 4,
  },
  alphabetRailInner: {
    alignItems: 'center',
  },
  alphabetLetter: {
    paddingVertical: 1,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  alphabetLetterText: {
    fontSize: 12,
    lineHeight: 14,
    fontFamily: 'Comfortaa',
    color: '#271809',
    fontWeight: '700',
  },
  alphabetLetterInactive: {
    color: '#CCCCCC',
  },
});
