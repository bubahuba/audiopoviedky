import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {API_URL} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';

type Props = RootStackScreenProps<'register'>;

export default class RegisterScreen extends Component<Props> {
  render() {
    const url = API_URL + this.props.route.params.url + '?app';
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
