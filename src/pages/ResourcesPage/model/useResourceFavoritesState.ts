import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { selectUid } from "src/entities/auth/model";
import {
  useGetUserResourceFavoritesQuery,
  useToggleUserResourceFavoriteMutation,
} from "src/entities/resourceFavorites";

export function useResourceFavoritesState() {
  const uid = useSelector(selectUid);
  const isPrivate = Boolean(uid);
  const {
    data: favoritesData,
    isFetching: favIsFetching,
    isError: favIsError,
    refetch: refetchFavorites,
  } = useGetUserResourceFavoritesQuery(
    { uid: uid ?? "" },
    {
      skip: !isPrivate,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
      refetchOnReconnect: true,
    },
  );

  const [toggleFavorite] = useToggleUserResourceFavoriteMutation();
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const favoriteIds = useMemo(() => {
    if (!isPrivate) return new Set<string>();
    return new Set(favoritesData?.ids ?? []);
  }, [favoritesData?.ids, isPrivate]);

  const onToggleFavorite = useCallback(
    async (resourceId: string) => {
      if (!isPrivate || !uid) return;

      setPendingIds((prev) => {
        const next = new Set(prev);
        next.add(resourceId);
        return next;
      });

      try {
        await toggleFavorite({ uid, resourceId }).unwrap();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(resourceId);
          return next;
        });
      }
    },
    [isPrivate, toggleFavorite, uid],
  );

  const isFavorite = useCallback(
    (resourceId: string) => {
      if (!isPrivate) return false;
      return favoriteIds.has(resourceId);
    },
    [favoriteIds, isPrivate],
  );

  const isPending = useCallback(
    (resourceId: string) => pendingIds.has(resourceId),
    [pendingIds],
  );

  return {
    favoriteIds,
    favIsError,
    favIsFetching,
    isFavorite,
    isPending,
    isPrivate,
    onToggleFavorite,
    refetchFavorites,
    uid,
  };
}
