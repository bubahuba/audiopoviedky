/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  Dimensions,
} from 'react-native';
import PersonItem from '../components/PersonItem';
import AlphabetSectionList from 'react-native-alphabet-sectionlist';
import {fetchJsonWithCache} from '../services/apiCache';
import {cacheImages} from '../services/imageCache';

const apiURL = 'https://audiopoviedky.sk/';

export default class PersonListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      persons: [],
      alphabetPersons: {},
      sid: props.route.params.sid,
      dimensions: Dimensions.get('screen'),
      getHeight: this._getHeight(Dimensions.get('screen')),
      artworkByPersonId: {},
    };
  }

  componentDidMount = async () => {
    const {route} = this.props;
    const requestUrl = apiURL + route.params.url + '/?app';
    const headers = {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0,
        Cookie: 'PHPSESSID=' + route.params.sid,
      },
    };

    try {
      const responseJson = await fetchJsonWithCache(requestUrl, headers);
      let alphas = responseJson.alpha;
      let alphaPersons = {};
      let personData =
        route.params.url === 'autori'
          ? responseJson.authors
          : responseJson.interpreters;
      alphas.forEach((value) => {
        let letter = value.alpha;
        alphaPersons[letter] = personData.filter((item) =>
          item.surname.toLowerCase().startsWith(letter.toLowerCase()),
        );
      });

      const remoteArtworks = personData.map((person) =>
        route.params.url === 'autori'
          ? apiURL + 'data/' + person.id + '_author.png'
          : apiURL + 'data/' + person.id + '_interpreter.png',
      );
      const artworkMap = await cacheImages(remoteArtworks);
      const artworkByPersonId = {};
      personData.forEach((person, index) => {
        artworkByPersonId[person.id] =
          artworkMap[remoteArtworks[index]] || remoteArtworks[index];
      });

      this.setState({
        persons: personData,
        alphabetPersons: alphaPersons,
        artworkByPersonId,
      });

      this.props.navigation.setOptions({
        title: route.params.url === 'autori' ? 'Autori' : 'Interpreti',
      });
    } catch (error) {
      console.error(error);
    }
  };

  renderItem = (item) => {
    const {route} = this.props;
    let artwork =
      this.state.artworkByPersonId[item.id] ||
      (route.params.url === 'autori'
        ? apiURL + 'data/' + item.id + '_author.png'
        : apiURL + 'data/' + item.id + '_interpreter.png');
    return (
      <PersonItem
        item={item}
        artwork={artwork}
        onPress={this.onPersonPress}
        listKey={item.id}
        style={{marginRight: 10}}
        isPaused={2}
        getHeight={this.state.getHeight}
      />
    );
  };
  renderSectionHeader = ({section: {title}}) => {
    return (
      <View
        style={{
          paddingLeft: 10,
          backgroundColor: '#c7a7a2',
          paddingVertical: 5,
          marginHorizontal: -10,
        }}>
        <Text
          style={{color: '#271809', fontFamily: 'Comfortaa', lineHeight: 24}}>
          {title}
        </Text>
      </View>
    );
  };
  onPersonPress = (item) => {
    const {route, navigation} = this.props;
    navigation.navigate('person_detail', {
      url: route.params.url,
      personId: item,
      sid: this.state.sid,
    });
  };

  _setDimensions = () => {
    let dimensions = Dimensions.get('screen');
    this.setState({
      dimensions: dimensions,
      getHeight: this._getHeight(dimensions),
    });
  };
  _getHeight = (dimensions) => {
    let ret =
      dimensions.width < 600 ? dimensions.width - 30 : dimensions.width * 0.4;
    return ret;
  };
  render() {
    if (this.state.persons.length > 0) {
      return (
        <AlphabetSectionList
          style={styles.container}
          data={this.state.alphabetPersons}
          renderSectionHeader={this.renderSectionHeader}
          renderItem={({item}) => this.renderItem(item)}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
          sectionListFontStyle={{
            color: '#271809',
            fontFamily: 'Comfortaa',
            lineHeight: 20,
          }}
          onScrollToIndexFailed={(e) => {}}
          onLayout={(event) => {
            this._setDimensions(event);
          }}
        />
      );
    } else {
      return (
        <ActivityIndicator
          size="large"
          color="#261710"
          style={styles.container}
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c7a7a2',
  },
  artwork: {
    padding: 5,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  listItem: {
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,

    elevation: 6,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
