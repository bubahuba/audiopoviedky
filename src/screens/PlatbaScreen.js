import React, {Component} from 'react';
import {StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

const apiURL = 'https://audiopoviedky.sk/';

export default class Platbascreen extends Component {
  constructor(props) {
    super(props);
    const {route} = props;
    this.state = {
      url: apiURL + route.params.url + '/?app&stream=' + route.params.stream,
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
    // const headers = {
    //   Cache: 'no-cache',
    //   Cookie: 'PHPSESSID=' + this.state.sid,
    //   'Content-type': 'application/x-www-form-urlencoded',
    //   Accept: 'text/html',
    // };
    return (
      <WebView
        nativeConfig={{props: {webContentsDebuggingEnabled: true}}}
        sharedCookiesEnabled={true}
        source={{
          uri: this.state.url,
          method: 'post',
          //headers: Platform.OS === 'ios' ? headers : null,
          //credentials: 'include',
          body: 'PHPSESSID=' + this.state.sid,
        }}
        injectedJavaScriptBeforeContentLoaded={injectCookieJS}
        // onLoadStart={(navState) =>
        //   this.setState({url: navState.nativeEvent.url})
        // }
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
