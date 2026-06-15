import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Icon, Button} from 'react-native-elements';
import {jsCoreDateCreator} from '../services';

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
    };
  }
  refreshStatus = () => {
    let {email} = this.state;
    const {route} = this.props;
    this.setState({isLoading: true});

    fetch(apiURL + route.params.url + '/?app', {
      method: 'POST',
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/x-www-form-urlencoded',
        //Cache: 'no-cache',
        //Cookie: 'PHPSESSID=' + route.params.sid,
      },
      //credentials: 'include',
      body: 'PHPSESSID=' + route.params.sid,
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.stream.length) {
          this.setState({stream: responseJson.stream[0]}, () => {
            let now = new Date(Date.now());
            let paid = jsCoreDateCreator(this.state.stream.duration);
            //console.log(paid.getTime() > now.getTime());
            this.setState({isPaid: paid > now, isLoading: false});
          });
        } else {
          this.setState({isPaid: false, isLoading: false});
        }
        this.props.navigation.setOptions({
          title: email,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  };
  componentDidMount = () => {
    const {navigation} = this.props;
    this.refreshStatus();
    this._willUpdate = navigation.addListener('focus', () => {
      // do something

      this.refreshStatus();
    });
  };

  componentWillUnmount() {
    if (this._willUpdate.remove !== undefined) {
      this._willUpdate.remove();
    }
  }
  render() {
    let duration = null;
    if (this.state.stream) {
      duration = jsCoreDateCreator(this.state.stream.duration);
    }

    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.cont}>
        <TouchableOpacity
          onPress={() => this.props.navigation.toggleDrawer()}
          style={styles.headerStyle}>
          <Image
            source={require('../assets/audiopoviedky-logo.png')}
            style={styles.imageStyle}
          />
          <Text style={styles.headerTextStyle}>Audiopoviedky.sk</Text>
        </TouchableOpacity>
        {this.state.isLoading && (
          <ActivityIndicator
            size="large"
            color="#261710"
            style={styles.predplatne}
          />
        )}
        {!this.state.isLoading && this.state.isPaid && (
          <View style={styles.predplatne}>
            <View>
              <Icon
                style={styles.predplatneIcon}
                name="check"
                color="green"
                size={64}
              />
            </View>
            <View>
              <Text style={styles.predplatneText}>Predplatné do</Text>
              <Text
                numberOfLines={4}
                style={[styles.predplatneText, styles.predplatneTextBigger]}>
                {duration.getDate() +
                  '. ' +
                  (duration.getMonth() + 1) +
                  '. ' +
                  duration.getFullYear()}
              </Text>
            </View>
          </View>
        )}
        {!this.state.isLoading && !this.state.isPaid && duration && (
          <View style={styles.predplatne}>
            <View>
              <Icon
                style={styles.predplatneIcon}
                name="warning"
                color="red"
                size={64}
              />
            </View>
            <View>
              <Text style={styles.predplatneText}>Predplatné skončilo</Text>
              <Text
                style={[styles.predplatneText, styles.predplatneTextBigger]}>
                {duration.toLocaleDateString('sk-SK')}
              </Text>
            </View>
          </View>
        )}
        {!this.state.isLoading && (
          <View style={styles.buttonCont}>
            {!this.state.isPaid && (
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
                this.state.isPaid
                  ? styles.buttonTextStyle
                  : styles.buttonSecondaryTextStyle
              }
              title={this.state.isPaid ? 'Vybrať poviedku' : 'Prehrať ukážky'}
              buttonStyle={
                this.state.isPaid ? styles.button : styles.buttonSecondary
              }
              onPress={() => this.props.navigation.toggleDrawer()}
            />
            {this.state.isPaid && (
              <Text
                style={[styles.hyperlink]}
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
        )}
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  buttonCont: {
    flex: 1,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hyperlink: {
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
  imageStyle: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  button: {
    marginVertical: 10,
    paddingVertical: 10,
    backgroundColor: '#271809',
    borderRadius: 10,
    paddingHorizontal: 30,
    borderWidth: 2,
    width: 220,
    borderColor: '#271809',
  },
  buttonTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#fff',
  },
  buttonSecondary: {
    paddingHorizontal: 30,
    marginVertical: 10,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    width: 220,
    borderColor: '#271809',
  },
  buttonSecondaryTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#271809',
  },
  predplatne: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  predplatneText: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
  },
  predplatneTextBigger: {
    fontFamily: 'Comfortaa',
    fontSize: 32,
  },
  predplatneIcon: {
    fontSize: 64,
    marginRight: 20,
    color: 'white',
  },
  container: {
    alignItems: 'stretch',
    flexGrow: 1,
  },
  cont: {
    backgroundColor: '#c7a7a2',
    flex: 1,
  },
  headerTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
    paddingBottom: 40,
    color: '#c7a7a2',
  },
  headerStyle: {
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#271809',
    flex: 1,
  },
});
