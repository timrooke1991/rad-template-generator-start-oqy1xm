import { Config, Generator, Schema } from './meta-models';
import { buildNameVariations } from './name-variations';

// CHALLENGE: Update reducer template to be dynamic
const generate = (schema: Schema, { scope }: Config) => {
  const { ref, refs, model, models } = buildNameVariations(schema);
  const constantCase = refs.toUpperCase();

  const template = `
import { Album } from '@acme/api-interfaces';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';

import * as AlbumsActions from './albums.actions';

export const ALBUMS_FEATURE_KEY = 'albums';

export interface AlbumsState extends EntityState<Album> {
  selectedId?: string | number; // which Albums record has been selected
  loaded: boolean; // has the Albums list been loaded
  error?: string | null; // last known error (if any)
}

export interface AlbumsPartialState {
  readonly [ALBUMS_FEATURE_KEY]: AlbumsState;
}

export const albumsAdapter: EntityAdapter<Album> = createEntityAdapter<Album>();

export const initialAlbumsState: AlbumsState = albumsAdapter.getInitialState({
  // set initial required properties
  loaded: false
});

const onFailure = (state, { error }) => ({ ...state, error});

const _albumsReducer = createReducer(
  initialAlbumsState,
  on(AlbumsActions.selectAlbum, (state, { selectedId }) =>
    Object.assign({}, state, { selectedId })
  ),
  on(AlbumsActions.resetSelectedAlbum, state =>
    Object.assign({}, state, { selectedId: null })
  ),
  on(AlbumsActions.resetAlbums, state => albumsAdapter.removeAll(state)),
  // Load albums
  on(AlbumsActions.loadAlbums, state => ({ ...state, loaded: false, error: null })),
  on(AlbumsActions.loadAlbumsSuccess, (state, { albums }) =>
    albumsAdapter.setAll(albums, { ...state, loaded: true })
  ),
  on(AlbumsActions.loadAlbumsFailure, onFailure),
  // Load album
  on(AlbumsActions.loadAlbum, state =>
    ({ ...state, loaded: false, error: null })
  ),
  on(AlbumsActions.loadAlbumSuccess, (state, { album }) =>
    albumsAdapter.upsertOne(album, { ...state, loaded: true })
  ),
  on(AlbumsActions.loadAlbumFailure, onFailure),
  // Add album
  on(AlbumsActions.createAlbumSuccess, (state, { album }) =>
    albumsAdapter.addOne(album, state)
  ),
  on(AlbumsActions.createAlbumFailure, onFailure),
  // Update album
  on(AlbumsActions.updateAlbumSuccess, (state, { album }) =>
    albumsAdapter.updateOne({ id: album.id, changes: album }, state)
  ),
  on(AlbumsActions.updateAlbumFailure, onFailure),
  // Delete album
  on(AlbumsActions.deleteAlbumSuccess, (state, { album }) =>
    albumsAdapter.removeOne(album.id, state)
  ),
  on(AlbumsActions.deleteAlbumFailure, onFailure),
);

export function albumsReducer(state: AlbumsState | undefined, action: Action) {
  return _albumsReducer(state, action);
}
  `;

  return {
    template,
    title: `Albums Reducer`,
    fileName: `libs/core-state/src/lib/albums/albums.reducer.ts`,
  };
};

export const ReducerGenerator: Generator = {
  generate,
};
