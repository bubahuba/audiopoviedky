import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

const apiURL = 'https://audiopoviedky.sk/';

export default class RegisterScreen extends Component {
  render() {
    const url = apiURL + this.props.route.params.url + '?app';
    return (
      <WebView source={{uri: url}} containerStyle={styles.cont} style={{}} />
    );
  }
}

const styles = StyleSheet.create({
  cont: {
    marginTop: 20,
    flex: 1,
  },
});
