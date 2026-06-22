import React from 'react';
import {RefreshControl} from 'react-native';

interface ListRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

export default function ListRefreshControl({
  refreshing,
  onRefresh,
}: ListRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#271809"
      colors={['#271809']}
    />
  );
}
