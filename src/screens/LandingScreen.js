import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Button} from 'react-native-elements';

export default class LandingScreen extends Component {
  render() {
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
        <View style={styles.predplatne}>
          <Button
            titleStyle={styles.buttonTextStyle}
            title="Prihlásiť sa"
            buttonStyle={styles.button}
            onPress={() => this.props.navigation.toggleDrawer()}
          />
          <Button
            titleStyle={styles.buttonSecondaryTextStyle}
            title="Prehrať ukážky"
            buttonStyle={styles.buttonSecondary}
            onPress={() => this.props.navigation.toggleDrawer()}
          />
          <Text
            style={styles.hyperlink}
            onPress={() =>
              this.props.navigation.navigate('register', {url: 'registracia'})
            }>
            Vytvoriť konto
          </Text>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
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
    width: 220,
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
  predplatne: {
    flex: 1,
    paddingVertical: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predplatneText: {
    fontFamily: 'Comfortaa',
    fontSize: 20,
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
    color: '#c7a7a2',
  },
  headerStyle: {
    flex: 1,
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingBottom: 40,
    backgroundColor: '#271809',
  },
});
