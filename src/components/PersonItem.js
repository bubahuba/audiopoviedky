/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HTML from 'react-native-render-html';

export default class PersonItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: this.props.isOpen ? true : false,
      isPaused: this.props.isPaused ? true : false,
      dimensions: Dimensions.get('screen'),
    };
  }

  render() {
    let metaTags = {};
    try {
      metaTags = JSON.parse(this.props.item.meta || '{}');
    } catch (error) {
      metaTags = {};
    }
    const descriptionHtml = metaTags.long_text;
    const contentWidth = Dimensions.get('window').width;
    return (
      <View style={[styles.listItem, this.props.style]}>
        <TouchableOpacity
          style={[
            {
              flexDirection: this.state.isOpen
                ? this.state.dimensions.width < 600
                  ? 'column'
                  : 'row'
                : 'row',
              minHeight: 100,
            },
          ]}
          onPress={() => {
            this.setState({isOpen: !this.state.isOpen});
          }}>
          <View
            style={[
              styles.artwork,
              this.state.isOpen
                ? {
                    minWidth: this.props.getHeight,
                    minHeight: this.props.getHeight,
                    borderBottomLeftRadius: 0,
                    borderTopLeftRadius: 5,
                    borderTopRightRadius: 5,
                  }
                : {
                    height: 100,
                    width: 100,
                  },
            ]}>
            <Image
              style={[
                styles.artwork,
                {
                  resizeMode: 'cover',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                },
                this.state.isOpen && this.state.dimensions.width < 600
                  ? {
                      borderBottomLeftRadius: 0,
                      borderTopLeftRadius: 5,
                      borderTopRightRadius: 5,
                    }
                  : {},
              ]}
              source={{uri: this.props.artwork}}
            />
            {this.props.onPress && this.state.isOpen && (
              <TouchableOpacity
                onPress={this.props.onPress.bind(this, this.props.listKey)}
                style={{padding: 4}}>
                <Icon
                  name={
                    !this.props.isPaused && this.props.nowPlaying !== null
                      ? 'pause-circle'
                      : 'play-circle'
                  }
                  size={this.state.isOpen ? 60 : 30}
                  color={'#c7a7a2'}
                  style={{position: 'relative'}}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={{padding: 10, flex: 1, justifyContent: 'center'}}>
            <Text style={styles.header}>{this.props.item.name}</Text>
            <TouchableOpacity
              style={[styles.badge, this.state.isOpen ? {marginBottom: 3} : {}]}
              onPress={this.props.onPress.bind(this, this.props.listKey)}>
              <Icon
                name="play-circle"
                size={20}
                color={'#fff'}
                style={{position: 'relative'}}
              />
              <Text style={[styles.badgeText]}>
                {this.props.item.content_count}
              </Text>
            </TouchableOpacity>
            {this.state.isOpen && descriptionHtml ? (
              <HTML
                source={{html: String(descriptionHtml)}}
                contentWidth={contentWidth}
              />
            ) : null}
          </View>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#eaeaea',
  },
  artwork: {
    backgroundColor: '#00000044',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  badge: {
    borderRadius: 10,
    backgroundColor: '#c7a7a2',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    paddingRight: 8,
  },
  badgeText: {
    fontWeight: 'bold',
    paddingLeft: 2,
    color: '#fff',
    top: 1,
  },
  iconPlaying: {
    position: 'relative',
    color: '#271809',
    textShadowColor: '#c7a7a2',
    textShadowRadius: 5,
  },
  icon: {
    position: 'relative',
    color: '#c7a7a2',
  },
  listItem: {
    marginVertical: 5,
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
  listItemPlaying: {
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    backgroundColor: '#c7a7a2',
    shadowRadius: 0,
    elevation: 0,
  },
  header: {
    fontSize: 18,
    paddingVertical: 4,
    fontFamily: 'Comfortaa',
  },
});
