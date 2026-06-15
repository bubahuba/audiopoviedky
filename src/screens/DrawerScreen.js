/* eslint-disable react-hooks/rules-of-hooks */
import React, {Component, useRef} from 'react';
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

import AsyncStorage from '@react-native-community/async-storage';

const Divider = (props) => {
  return <View style={[styles.divider, props.style]} />;
};

export default class DrawerScreen extends Component {
  constructor(props) {
    super(props);
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
  LoginForm = () => {
    if (!this.state.sid) {
      const ref_passw = useRef();
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
              ref_passw.current.focus();
            }}
            ref={(c) => {
              this.inputEmail = c;
            }}
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
            ref={ref_passw}
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
              this.props.navigation.navigate('HomeScreen', {
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
    //console.log(formData);
    this.setState({isLoading: true});
    await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'include', // include, *same-origin, omit
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
      body: 'email=' + formData.email + '&passw=' + formData.passw,
      //redirect: 'follow', // manual, *follow, error
      //referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      //body: JSON.stringify(formData), // body data type must match "Content-Type" header
    })
      .then(async (res) => await res.json())
      .then(async (resJson) => {
        await this.setState(resJson, () => {
          this.state.sid &&
            navigation.navigate('HomeScreen', {
              url: 'nakupy',
              sid: this.state.sid,
              credentials: this.state.credentials,
            });
          this.setState({isLoading: false});
        });
        const items = [
          ['@loginEmail', this.state.credentials.email],
          ['@loginPass', this.state.credentials.passw],
        ];
        await AsyncStorage.multiSet(items);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  componentDidMount = async () => {
    await AsyncStorage.multiGet(['@loginEmail', '@loginPass'], this.cb);
  };
  cb = (err, data) => {
    if (err) {
      console.log(err.stack);
    }
    //console.log(data, "from storage")
    if (data[0][1]) {
      this.setName(data[0][1]);
      this.setPass(data[1][1]);
      this.goLogin();
    } else {
      AsyncStorage.getAllKeys().then((keys) => AsyncStorage.multiRemove(keys));
    }
  };
  logOut = async () => {
    let url = 'https://audiopoviedky.sk/prihlasenie/odhlasenie?app';
    fetch(url);
    const {credentials} = this.state;
    credentials.email = credentials.passw = '';
    this.setState({sid: null}, () => {
      AsyncStorage.getAllKeys().then((keys) => AsyncStorage.multiRemove(keys));
      this.props.navigation.navigate('Landing');
    });
  };
  render() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <this.LoginForm />
        <View style={styles.empty} />
        <TouchableOpacity
          onPress={() =>
            this.props.navigation.navigate('najnovsie', {
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
            this.props.navigation.navigate('najpopularnejsie', {
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
            this.props.navigation.navigate('najkratsie', {
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
            this.props.navigation.navigate('najdlhsie', {
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
            this.props.navigation.navigate('person_list', {
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
            this.props.navigation.navigate('person_list', {
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
            this.props.navigation.navigate('category_list', {
              url: 'kategorie',
              sid: this.state.sid,
            })
          }
          style={styles.textHolder}>
          <Text style={styles.textline}>Knižné série</Text>
        </TouchableOpacity>
      </ScrollView>
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
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
