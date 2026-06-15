import {Component} from 'react';

export default class Screen extends Component {
  constructor(props) {
    super(props);
  }
  navigateTo = (path, data) => {
    this.props.navigation.navigate(path, data);
  };
}
