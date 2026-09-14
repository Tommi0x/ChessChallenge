import type { PieceRenderObject } from 'react-chessboard';

// "Staunty" piece set by sadsnake1 (CC BY-NC-SA 4.0), vendored from
// https://github.com/lichess-org/lila/tree/master/public/piece/staunty
const PIECE_KEYS = ['wP', 'wR', 'wN', 'wB', 'wQ', 'wK', 'bP', 'bR', 'bN', 'bB', 'bQ', 'bK'] as const;

export const stauntyPieces: PieceRenderObject = Object.fromEntries(
  PIECE_KEYS.map((key) => [
    key,
    ({ svgStyle }: { svgStyle?: React.CSSProperties } = {}) => (
      <img
        src={`${import.meta.env.BASE_URL}pieces/staunty/${key}.svg`}
        style={{ width: '100%', height: '100%', ...svgStyle }}
        alt=""
      />
    ),
  ]),
);
