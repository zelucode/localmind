import { describe, expect, it } from 'vitest';
import { DEFAULT_BOOKMARKS } from './defaultBookmarks';

describe('DEFAULT_BOOKMARKS', () => {
  it('ships with no pre-starred bookmarks, so Favorites only holds the user\'s picks', () => {
    expect(DEFAULT_BOOKMARKS.filter((b) => b.isFavorite)).toEqual([]);
  });
});
