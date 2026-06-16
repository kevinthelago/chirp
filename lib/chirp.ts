/**
 * Canonical chirp shape with embedded author fields.
 * Used by ChirpCard, home-feed, explore, and profiles — keep it stable.
 */
export type ChirpWithAuthor = {
  id: string;
  text: string;
  createdAt: Date;
  author: {
    id: string;
    handle: string;
    displayName: string;
  };
};
