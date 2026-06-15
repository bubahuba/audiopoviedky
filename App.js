import React from 'react';
import {StyleSheet, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';

import NakupyScreen from './src/screens/NakupyScreen';
import LandingScreen from './src/screens/LandingScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PlatbaScreen from './src/screens/PlatbaScreen';
import HomeScreen from './src/screens/HomeScreen';
import DrawerScreen from './src/screens/DrawerScreen';
import ListScreen from './src/screens/ListScreen';
import PersonListScreen from './src/screens/PersonListScreen';
import CategoryListScreen from './src/screens/CategoryListScreen';
import PersonDetailScreen from './src/screens/PersonDetailScreen';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerContent(props) {
  return <DrawerScreen {...props} />;
}

function AudiopoviedkyStack() {
  return (
    <Stack.Navigator
      screenOptions={() => ({
        headerTintColor: '#fff',
        headerStyle: styles.headerStyle,
        headerTitleStyle: styles.headerTextStyle,
        headerBackTitle: 'Späť',
        headerBackTitleStyle: styles.headerStyleBack,
      })}
      initialRouteName="Landing"
      //mode="modal"
    >
      <Stack.Screen
        name="Landing"
        component={LandingScreen}
        options={({navigation, route}) => ({
          title: null,
        })}
      />
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={({navigation, route}) => ({
          title: null,
          headerLeft: () => <View style={styles.emptyButton} />,
          headerRight: () => <View style={styles.emptyButton} />,
          gestureEnabled: false,
        })}
      />
      <Stack.Screen
        name="register"
        component={RegisterScreen}
        options={{
          title: 'Registrácia',
          headerTitleStyle: [
            styles.headerTextStyle,
            {fontSize: 18, lineHeight: 24},
          ],
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="platba"
        component={PlatbaScreen}
        options={{
          title: 'Spôsob platby',
          headerTitleStyle: [
            styles.headerTextStyle,
            {fontSize: 18, lineHeight: 24},
          ],
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="nakupy"
        component={NakupyScreen}
        options={{
          title: 'Predplatné',
          headerTitleStyle: [
            styles.headerTextStyle,
            {fontSize: 18, lineHeight: 24},
          ],
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="najkratsie"
        component={ListScreen}
        options={{
          title: 'Najkratšie poviedky',
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="najnovsie"
        component={ListScreen}
        options={{
          title: 'Najnovšie poviedky',
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="najpopularnejsie"
        component={ListScreen}
        options={{
          title: 'Najpopulárnejšie poviedky',
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="najdlhsie"
        component={ListScreen}
        options={{
          title: 'Najdlhšie poviedky',
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="person_list"
        component={PersonListScreen}
        options={{
          title: null,
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="person_detail"
        component={PersonDetailScreen}
        options={{
          title: null,
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="category_list"
        component={CategoryListScreen}
        options={{
          title: 'Knižné série',
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
      <Stack.Screen
        name="category_detail"
        component={PersonDetailScreen}
        options={{
          title: null,
          headerRight: () => <View style={styles.emptyButton} />,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Drawer.Navigator drawerType="slide" drawerContent={DrawerContent}>
        <Drawer.Screen
          name="Home"
          component={AudiopoviedkyStack}
          initialParams={{user: 'me'}}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
}
const styles = StyleSheet.create({
  headerTextStyle: {
    fontFamily: 'Comfortaa',
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  headerStyleBack: {
    fontFamily: 'Comfortaa',
    fontSize: 12,
  },
  headerStyle: {
    backgroundColor: '#271809',
    borderBottomWidth: 0,
    shadowRadius: 0,
    shadowOffset: {
      height: 0,
    },
  },
  emptyButton: {
    width: 40,
    height: 40,
  },
});
