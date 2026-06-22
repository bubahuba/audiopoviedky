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
import {formatDurationSk} from '../services';

export default class CategoryItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: this.props.isOpen ? true : false,
      dimensions: Dimensions.get('screen'),
    };
  }
  secondsToHms = (d) => formatDurationSk(d);

  render() {
    //const metaTags = JSON.parse(this.props.item.meta);
    return (
      <View style={styles.listItem}>
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
                    minHeight: 100,
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
              source={require('../assets/audiopoviedky-logo.png')}
            />
            {this.props.onPress && this.state.isOpen && (
              <TouchableOpacity
                onPress={this.props.onPress.bind(this, this.props.listKey)}
                style={{padding: 4}}>
                <Icon
                  name="play-circle"
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
            {this.props.item.duration && (
              <Text>
                Dĺžka:{' '}
                <Text style={{fontWeight: 'bold'}}>
                  {this.secondsToHms(this.props.item.duration)}
                </Text>
              </Text>
            )}
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
    backgroundColor: '#271809',
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
  header: {
    fontSize: 16,
    paddingVertical: 4,
    fontFamily: 'Comfortaa',
  },
});
