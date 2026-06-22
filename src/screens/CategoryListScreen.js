/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import CategoryItem from '../components/CategoryItem';
import {fetchJsonWithCache} from '../services/apiCache';

const apiURL = 'https://audiopoviedky.sk/';

export default class PersonListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: [],
      sid: props.route.params.sid,
      dimensions: Dimensions.get('screen'),
      getHeight: this._getHeight(Dimensions.get('screen')),
    };
  }

  componentDidMount = async () => {
    const {route} = this.props;
    const requestUrl = apiURL + route.params.url + '?app';

    try {
      const responseJson = await fetchJsonWithCache(requestUrl, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: 0,
          Cookie: 'PHPSESSID=' + route.params.sid,
        },
      });
      this.setState({categories: responseJson.categories});

      this.props.navigation.setOptions({
        title: 'Knižné série',
      });
    } catch (error) {
      console.error(error);
    }
  };

  renderItem = (item, index) => {
    if (this.state.categories[index].id) {
      //let artwork =  apiURL + "data/" + this.state.categories[index]["id"] + "_category.png";
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
  };

  onCategoryPress = (item) => {
    const {route, navigation} = this.props;
    //console.log(route.params.url)
    navigation.navigate('category_detail', {
      url: route.params.url,
      personId: this.state.categories[item].id,
      title: this.state.categories[item].name,
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
    if (this.state.categories.length > 0) {
      return (
        <FlatList
          style={styles.container}
          data={this.state.categories}
          renderItem={({item, index}) => this.renderItem(item, index)}
          contentContainerStyle={{
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
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
