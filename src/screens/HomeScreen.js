import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {Icon, Button} from 'react-native-elements';
import {jsCoreDateCreator} from '../services';
import {fetchJsonWithCache} from '../services/apiCache';
import {SafeAreaView} from 'react-native-safe-area-context';
import HomeGlobalPlayer from '../components/HomeGlobalPlayer';
import {
  getPlaybackState,
  hasActiveTrack,
  subscribe,
} from '../services/globalPlayback';

const apiURL = 'https://audiopoviedky.sk/';

export default class HomeScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      stream: null,
      sid: props.route.params.sid,
      email: props.route.params.credentials.email,
      isPaid: false,
      isLoading: true,
      playback: getPlaybackState(),
      windowDimensions: Dimensions.get('window'),
    };
  }
  refreshStatus = () => {
    const {route} = this.props;
    this.setState({isLoading: true});

    fetchJsonWithCache(apiURL + route.params.url + '/?app', {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: 'PHPSESSID=' + route.params.sid,
    })
      .then((responseJson) => {
        if (responseJson.stream?.length) {
          this.setState({stream: responseJson.stream[0]}, () => {
            let now = new Date(Date.now());
            let paid = jsCoreDateCreator(this.state.stream.duration);
            this.setState({isPaid: paid > now, isLoading: false});
          });
        } else {
          this.setState({isPaid: false, isLoading: false});
        }
      })
      .catch((error) => {
        console.error(error);
        this.setState({isLoading: false});
      });
  };
  componentDidMount = () => {
    const {navigation} = this.props;
    this.unsubscribePlayback = subscribe((playback) => {
      this.setState({playback});
    });
    this.dimensionsSubscription = Dimensions.addEventListener('change', ({window}) => {
      this.setState({windowDimensions: window});
    });
    this.refreshStatus();
    this._willUpdate = navigation.addListener('focus', () => {
      this.refreshStatus();
    });
  };

  componentWillUnmount() {
    this.unsubscribePlayback?.();
    this.dimensionsSubscription?.remove();
    if (this._willUpdate.remove !== undefined) {
      this._willUpdate.remove();
    }
  }
  render() {
    let duration = null;
    if (this.state.stream) {
      duration = jsCoreDateCreator(this.state.stream.duration);
    }

    const {isLoading, isPaid, windowDimensions} = this.state;
    const showPlayer = hasActiveTrack();
    const isLandscape = windowDimensions.width > windowDimensions.height;

    return (
      <SafeAreaView
        style={styles.cont}
        edges={isLandscape ? ['bottom', 'left', 'right'] : ['bottom']}>
        <View style={styles.screen}>
          {showPlayer ? (
            <HomeGlobalPlayer
              navigation={this.props.navigation}
              sid={this.state.sid}
            />
          ) : (
            <SafeAreaView
              edges={isLandscape ? ['top', 'left', 'right'] : ['top']}
              style={styles.headerSafeArea}>
              <TouchableOpacity
                onPress={() => this.props.navigation.toggleDrawer()}
                style={[
                  styles.headerStyle,
                  isLandscape && styles.headerStyleLandscape,
                ]}
                activeOpacity={0.8}>
                <Image
                  source={require('../assets/audiopoviedky-logo.png')}
                  style={[
                    styles.imageStyle,
                    isLandscape && styles.imageStyleLandscape,
                  ]}
                />
                <Text
                  style={[
                    styles.headerTextStyle,
                    isLandscape && styles.headerTextStyleLandscape,
                  ]}>
                  Audiopoviedky.sk
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          )}

          <View
            style={[
              styles.contentBody,
              isLandscape && styles.contentBodyLandscape,
            ]}>
            {isLoading && (
              <ActivityIndicator size="large" color="#261710" />
            )}

            {!isLoading && (
              <View
                style={[
                  styles.contentStack,
                  isLandscape && styles.contentStackLandscape,
                ]}>
                {isPaid && duration && (
                  <View
                    style={[
                      styles.statusCard,
                      isLandscape && styles.statusCardLandscape,
                    ]}>
                    <Icon
                      name="check-circle"
                      type="material"
                      color="#2e7d32"
                      size={56}
                    />
                    <View style={styles.statusTextGroup}>
                      <Text style={styles.statusLabel}>Predplatné do</Text>
                      <Text style={styles.statusDate}>
                        {duration.getDate() +
                          '. ' +
                          (duration.getMonth() + 1) +
                          '. ' +
                          duration.getFullYear()}
                      </Text>
                    </View>
                  </View>
                )}

                {!isPaid && duration && (
                  <View
                    style={[
                      styles.statusCard,
                      isLandscape && styles.statusCardLandscape,
                    ]}>
                    <Icon
                      name="error-outline"
                      type="material"
                      color="#c62828"
                      size={56}
                    />
                    <View style={styles.statusTextGroup}>
                      <Text style={styles.statusLabel}>Predplatné skončilo</Text>
                      <Text style={styles.statusDate}>
                        {duration.toLocaleDateString('sk-SK')}
                      </Text>
                    </View>
                  </View>
                )}

                <View
                  style={[
                    styles.actions,
                    isLandscape && styles.actionsLandscape,
                  ]}>
                  {!isPaid && (
                    <Button
                      titleStyle={styles.buttonTextStyle}
                      title="Predplatiť"
                      buttonStyle={styles.button}
                      onPress={() =>
                        this.props.navigation.navigate('nakupy', {
                          url: 'nakupy',
                          sid: this.state.sid,
                        })
                      }
                    />
                  )}
                  <Button
                    titleStyle={
                      isPaid
                        ? styles.buttonTextStyle
                        : styles.buttonSecondaryTextStyle
                    }
                    title={isPaid ? 'Vybrať poviedku' : 'Prehrať ukážky'}
                    buttonStyle={isPaid ? styles.button : styles.buttonSecondary}
                    onPress={() => this.props.navigation.toggleDrawer()}
                  />
                  {isPaid && (
                    <Text
                      style={[
                        styles.hyperlink,
                        isLandscape && styles.hyperlinkLandscape,
                      ]}
                      onPress={() =>
                        this.props.navigation.navigate('nakupy', {
                          url: 'nakupy',
                          sid: this.state.sid,
                        })
                      }>
                      Predĺžiť predplatné
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  contentBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  contentBodyLandscape: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  contentStack: {
    alignItems: 'center',
    width: '100%',
  },
  contentStackLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: 'auto',
  },
  statusCardLandscape: {
    marginBottom: 0,
    marginRight: 32,
    flexShrink: 1,
  },
  statusTextGroup: {
    alignItems: 'flex-start',
    marginLeft: 16,
  },
  statusLabel: {
    fontFamily: 'Comfortaa',
    fontSize: 18,
    color: '#261710',
    marginBottom: 4,
  },
  statusDate: {
    fontFamily: 'Comfortaa',
    fontSize: 28,
    color: '#261710',
    textAlign: 'left',
  },
  actions: {
    alignItems: 'center',
    width: '100%',
  },
  actionsLandscape: {
    width: 'auto',
    alignItems: 'center',
    flexShrink: 0,
  },
  hyperlink: {
    marginTop: 20,
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#261710',
    textDecorationLine: 'underline',
  },
  hyperlinkLandscape: {
    marginTop: 8,
  },
  imageStyle: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  imageStyleLandscape: {
    width: 56,
    height: 56,
    marginBottom: 0,
    marginRight: 12,
  },
  button: {
    marginVertical: 8,
    paddingVertical: 12,
    backgroundColor: '#271809',
    borderRadius: 10,
    paddingHorizontal: 30,
    borderWidth: 2,
    width: 240,
    borderColor: '#271809',
  },
  buttonTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#fff',
  },
  buttonSecondary: {
    paddingHorizontal: 30,
    marginVertical: 8,
    paddingVertical: 12,
    width: 240,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#271809',
  },
  buttonSecondaryTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#271809',
  },
  cont: {
    backgroundColor: '#c7a7a2',
    flex: 1,
  },
  headerTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
    color: '#c7a7a2',
  },
  headerSafeArea: {
    backgroundColor: '#271809',
  },
  headerStyle: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#271809',
  },
  headerStyleLandscape: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTextStyleLandscape: {
    fontSize: 18,
  },
});
