import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {API_URL} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';

type Props = RootStackScreenProps<'platba'>;

interface PlatbaScreenState {
  url: string;
  sid: string;
}

export default class PlatbaScreen extends Component<Props, PlatbaScreenState> {
  constructor(props: Props) {
    super(props);
    const {route} = props;
    this.state = {
      url: `${API_URL}${route.params.url}/?app&stream=${route.params.stream}`,
      sid: route.params.sid,
    };
  }

  componentDidMount = () => {
    const {route, navigation} = this.props;
    navigation.setOptions({
      title: route.params.headerTitle,
    });
  };

  render() {
    const injectCookieJS = `
        document.cookie = "PHPSESSID=${this.state.sid}; path=/";
     `;
    return (
      <WebView
        nativeConfig={{props: {webContentsDebuggingEnabled: true}}}
        sharedCookiesEnabled={true}
        source={{
          uri: this.state.url,
          method: 'post',
          body: 'PHPSESSID=' + this.state.sid,
        }}
        injectedJavaScriptBeforeContentLoaded={injectCookieJS}
        containerStyle={styles.cont}
      />
    );
  }
}

const styles = StyleSheet.create({
  cont: {
    flex: 1,
  },
});
