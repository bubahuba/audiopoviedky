import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {Button} from 'react-native-elements';
import {SafeAreaView} from 'react-native-safe-area-context';

import {
  saveAuthSession,
  loadAuthSession,
  clearAuthSession,
} from '../services/authStorage';
import {fetchJsonWithCache} from '../services/apiCache';

const Divider = (props) => {
  return <View style={[styles.divider, props.style]} />;
};

export default class DrawerScreen extends Component {
  constructor(props) {
    super(props);
    this.emailInputRef = React.createRef();
    this.passwordInputRef = React.createRef();
    this.state = {
      credentials: {
        email: '',
        passw: '',
      },
      sid: null,
      isLoading: false,
    };
  }

  focusedInput = (c) => {
    c.currentTarget.setNativeProps({
      style: {backgroundColor: 'white'},
    });
  };

  blurredInput = (c) => {
    c.currentTarget.setNativeProps({
      style: {backgroundColor: '#FFFFFF80'},
    });
  };

  setName = (value) => {
    const {credentials} = this.state;
    credentials.email = value;
  };
  setPass = (value) => {
    const {credentials} = this.state;
    credentials.passw = value;
  };
  renderLoginForm = () => {
    if (!this.state.sid) {
      return (
        <>
          <TextInput
            placeholder={'email'}
            style={styles.input}
            onChangeText={(value) => this.setName(value)}
            autoCapitalize="none"
            placeholderTextColor="#261710"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => {
              this.passwordInputRef.current?.focus();
            }}
            ref={this.emailInputRef}
            onFocus={this.focusedInput}
            onBlur={this.blurredInput}
          />
          <TextInput
            placeholder={'heslo'}
            style={styles.input}
            secureTextEntry={true}
            onChangeText={(value) => this.setPass(value)}
            autoCapitalize="none"
            placeholderTextColor="#261710"
            ref={this.passwordInputRef}
            returnKeyType={'go'}
            onSubmitEditing={() => this.goLogin()}
            onFocus={this.focusedInput}
            onBlur={this.blurredInput}
          />
          {/*<Text style={styles.hyperlink} onPress={() => this.props.navigation.navigate("register", { url: "reistracia"})}>Vytvoriť konto</Text>*/}

          {!this.state.isLoading && (
            <Button
              titleStyle={styles.buttonTextStyle}
              buttonStyle={styles.button}
              title={'Prihlásiť sa'}
              onPress={this.goLogin}
            />
          )}
          {this.state.isLoading && (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={styles.button}
            />
          )}
        </>
      );
    } else {
      return (
        <>
          <Text
            style={[styles.header]}
            onPress={() =>
              this.navigateToStack('HomeScreen', {
                url: 'nakupy',
                sid: this.state.sid,
                credentials: this.state.credentials,
              })
            }>
            {this.state.credentials.email}
          </Text>
          <Button
            titleStyle={styles.buttonTextStyle}
            buttonStyle={styles.button}
            title={'Odhlásiť'}
            onPress={this.logOut}
          />
        </>
      );
    }
  };
  goLogin = async () => {
    const {navigation} = this.props;
    let formData = this.state.credentials;
    let url = 'https://audiopoviedky.sk/prihlasenie?app';
    this.setState({isLoading: true});

    try {
      const resJson = await fetchJsonWithCache(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'include',
        headers: {
          'Content-type': 'application/x-www-form-urlencoded',
        },
        body: 'email=' + formData.email + '&passw=' + formData.passw,
      });

      await this.setState(resJson, async () => {
        if (this.state.sid) {
          await saveAuthSession({
            sid: this.state.sid,
            credentials: this.state.credentials,
          });
          navigation.navigate('Home', {
            screen: 'HomeScreen',
            params: {
              url: 'nakupy',
              sid: this.state.sid,
              credentials: this.state.credentials,
            },
          });
          navigation.closeDrawer();
        }
        this.setState({isLoading: false});
      });
    } catch (error) {
      console.error(error);
      this.setState({isLoading: false});
    }
  };
  componentDidMount = async () => {
    const session = await loadAuthSession();
    if (session?.sid) {
      this.setState({
        sid: session.sid,
        credentials: session.credentials,
      });
      return;
    }

    if (session?.credentials?.email) {
      this.setName(session.credentials.email);
      this.setPass(session.credentials.passw);
      this.goLogin();
    }
  };
  navigateToStack = (screen, params) => {
    const {navigation} = this.props;
    navigation.navigate('Home', {screen, params});
    navigation.closeDrawer();
  };

  logOut = async () => {
    let url = 'https://audiopoviedky.sk/prihlasenie/odhlasenie?app';
    fetch(url).catch(() => {});
    const {credentials} = this.state;
    credentials.email = credentials.passw = '';
    await clearAuthSession();
    this.setState({sid: null}, () => {
      this.navigateToStack('Landing');
    });
  };
  render() {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}>
          {this.renderLoginForm()}
          <View style={styles.empty} />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('najnovsie', {
              url: 'audio',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Najnovšie poviedky</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('najpopularnejsie', {
              url: 'audio/najpopularnejsie',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Najpopulárnejšie poviedky</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('najkratsie', {
              url: 'audio/najkratsie',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Najkratšie poviedky</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('najdlhsie', {
              url: 'audio/najdlhsie',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Najdlhšie poviedky</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('person_list', {
              url: 'autori',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Autori</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('person_list', {
              url: 'interpreti',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Interpreti</Text>
        </TouchableOpacity>
        <Divider />
        <TouchableOpacity
          onPress={() =>
            this.navigateToStack('category_list', {
              url: 'kategorie',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Knižné série</Text>
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 15,
  },
  hyperlink: {
    marginVertical: 10,
    textDecorationLine: 'underline',
  },
  textline: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Comfortaa',
    paddingVertical: 10,
    fontSize: 14,
  },
  textHolder: {
    flexDirection: 'row',
    width: '80%',
  },
  container: {
    backgroundColor: '#c7a7a2',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingBottom: 24,
  },
  button: {
    marginVertical: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
    width: 220,
    backgroundColor: '#271809',
    borderRadius: 10,
  },
  buttonTextStyle: {
    fontFamily: 'Comfortaa',
    fontSize: 16,
    color: '#fff',
  },
  input: {
    borderColor: '#261710',
    borderWidth: 2,
    borderRadius: 5,
    width: '80%',
    height: 40,
    marginBottom: 10,
    backgroundColor: '#FFFFFF80',
    textAlign: 'center',
  },
  header: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#261710',
    width: '80%',
  },
});
