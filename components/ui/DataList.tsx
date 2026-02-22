/**
 * DataList: FlatList wrapper with pull-to-refresh, loading, error, empty.
 * Pagination-ready via onEndReached.
 */

import {
  FlatList,
  RefreshControl,
  View,
  StyleSheet,
  type FlatListProps,
  type ListRenderItem,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

type DataListProps<T> = Omit<FlatListProps<T>, 'data' | 'renderItem'> & {
  data: T[] | undefined;
  renderItem: ListRenderItem<T>;
  loading?: boolean;
  error?: string | null;
  emptyTitle?: string;
  emptyMessage?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  keyExtractor: (item: T, index: number) => string;
};

export function DataList<T>({
  data,
  renderItem,
  loading = false,
  error = null,
  emptyTitle = 'No items',
  emptyMessage,
  onRefresh,
  refreshing = false,
  keyExtractor,
  contentContainerStyle,
  ListEmptyComponent,
  ...rest
}: DataListProps<T>) {
  const { colors: c, spacing } = useTheme();

  if (loading && (!data || data.length === 0)) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <View style={[styles.centered, { padding: spacing[6] }]}>
        <EmptyState title="Something went wrong" message={error} />
      </View>
    );
  }

  const listData = data ?? [];
  const empty = listData.length === 0;

  return (
    <FlatList
      data={listData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        empty && { flexGrow: 1 },
        { paddingBottom: spacing[8] },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary[600]}
          />
        ) : undefined
      }
      ListEmptyComponent={
        ListEmptyComponent ??
        (empty ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : null)
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center' },
});
