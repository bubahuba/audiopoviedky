import type {NavigationProp, ParamListBase} from '@react-navigation/native';
import ScrollToTopHeaderTitle from '../components/ScrollToTopHeaderTitle';

export function setScrollToTopHeaderTitle(
  navigation: NavigationProp<ParamListBase>,
  title: string,
  onScrollToTop: () => void,
): void {
  navigation.setOptions({
    headerTitle: () => (
      <ScrollToTopHeaderTitle title={title} onPress={onScrollToTop} />
    ),
  });
}
