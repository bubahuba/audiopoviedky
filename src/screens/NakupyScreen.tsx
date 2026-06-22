import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {API_URL, type PromoResponse} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';

type Props = RootStackScreenProps<'nakupy'>;

interface NakupyScreenState {
  promo: string | null;
  promoResult: string | null;
  isWaiting: boolean;
  sid: string;
}

export default class NakupyScreen extends Component<Props, NakupyScreenState> {
  constructor(props: Props) {
    super(props);
    const {route} = props;
    this.state = {
      promo: null,
      promoResult: null,
      isWaiting: false,
      sid: route.params.sid,
    };
  }

  setPromo = (value: string) => {
    this.setState({promo: value});
  };

  focusedInput = () => {};

  blurredInput = () => {};

  checkPromo = async () => {
    const {route} = this.props;
    if (!this.state.promo) {
      return;
    }
    this.setState({isWaiting: true, promoResult: 'Overujem kód'});
    try {
      const response = await fetch(
        `${API_URL}${route.params.url}/promo/?app&code=${this.state.promo}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Cache: 'no-cache',
            Cookie: 'PHPSESSID=' + route.params.sid,
          },
          credentials: 'omit',
        },
      );
      const responseJson = (await response.json()) as PromoResponse;
      this.setState(
        {
          promoResult:
            responseJson.result === 'OK'
              ? responseJson.msg ?? responseJson.result
              : responseJson.result,
          isWaiting: false,
        },
        () => {
          if (responseJson.result === 'OK') {
            setTimeout(this.props.navigation.goBack, 1000);
          }
        },
      );
    } catch (error) {
      console.error(error);
      this.setState({isWaiting: false});
    }
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.container} style={styles.cont}>
        <View style={styles.headerStyle}>
          <View style={styles.promoCont}>
            <TextInput
              placeholder={'promo kód'}
              style={styles.input}
              secureTextEntry={false}
              onChangeText={(value) => this.setPromo(value)}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor="#261710"
              returnKeyType={'go'}
              onFocus={this.focusedInput}
              onBlur={this.blurredInput}
            />
            {this.state.isWaiting === false ? (
              <TouchableOpacity onPress={() => this.checkPromo()}>
                <Image
                  source={require('../assets/audiopoviedky-logo.png')}
                  style={styles.imageStyle}
                />
              </TouchableOpacity>
            ) : (
              <ActivityIndicator
                size="large"
                color="#261710"
                style={styles.imageStyle}
              />
            )}
          </View>
          {this.state.promoResult && (
            <Text style={styles.headerTextStyle}>{this.state.promoResult}</Text>
          )}
          {!this.state.promoResult && (
            <Text style={styles.headerTextStyle}>Ďakujeme!</Text>
          )}
        </View>
        <View style={styles.predplatne}>
          <Text style={styles.navyste}>Navýšte si predplatné o</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              this.props.navigation.navigate('platba', {
                url: 'nakupy/vybrat-platbu',
                sid: this.state.sid,
                stream: 91,
                headerTitle: 'Platba 9,90 €',
              })
            }>
            <Text style={styles.buttonTextStyle}>12 mesiacov</Text>
            <View style={[styles.buttonSecondary, styles.buttonPrice]}>
              <Text
                style={[
                  styles.buttonSecondaryTextStyle,
                  styles.buttonPriceText,
                ]}>
                9,90 €
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() =>
              this.props.navigation.navigate('platba', {
                url: 'nakupy/vybrat-platbu',
                sid: this.state.sid,
                stream: 86,
                headerTitle: 'Platba 5,90 €',
              })
            }>
            <Text style={styles.buttonSecondaryTextStyle}>6 mesiacov</Text>
            <View style={[styles.button, styles.buttonPrice]}>
              <Text style={[styles.buttonTextStyle, styles.buttonPriceText]}>
                5,90 €
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  promoCont: {
    marginVertical: 30,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  navyste: {
    marginBottom: 10,
  },
  buttonPrice: {
    paddingHorizontal: 5,
    margin: 0,
    marginLeft: 10,
    flexGrow: 0,
    maxWidth: 70,
    fontSize: 16,
    justifyContent: 'center',
  },
  buttonPriceText: {
    fontSize: 16,
  },
  imageStyle: {
    width: 100,
    height: 100,
  },
  input: {
    borderRadius: 50,
    width: '80%',
    height: 100,
    paddingHorizontal: 10,
    fontSize: 30,
    backgroundColor: '#FFFFFF80',
    textAlign: 'center',
    marginRight: -100,
    paddingRight: 100,
  },
  button: {
    marginVertical: 10,
    paddingVertical: 10,
    backgroundColor: '#271809',
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 2,
    width: 240,
    borderColor: '#271809',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
    color: '#fff',
  },
  buttonSecondary: {
    paddingHorizontal: 10,
    marginVertical: 10,
    paddingVertical: 10,
    width: 240,
    backgroundColor: '#c7a7a2',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#271809',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonSecondaryTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
    color: '#271809',
  },
  predplatne: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'center',
    color: '#c7a7a2',
  },
  headerStyle: {
    flex: 1,
    alignItems: 'stretch',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingBottom: 20,
    backgroundColor: '#271809',
  },
});
