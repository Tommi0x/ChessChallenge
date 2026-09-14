import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type PieceDropHandlerArgs, type PieceHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { stauntyPieces } from './stauntyPieces';

const SELECTED_SQUARE_STYLE: CSSProperties = {
  backgroundColor: 'color-mix(in srgb, var(--accent) 45%, transparent)',
};
const MOVE_DOT_STYLE: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(0, 0, 0, 0.28) 19%, transparent 20%)',
};
const CAPTURE_RING_STYLE: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle, transparent 0%, transparent 79%, rgba(0, 0, 0, 0.28) 80%, rgba(0, 0, 0, 0.28) 90%, transparent 91%)',
};

export const GameBoard = memo(function GameBoard({ fen, canInteract, onPieceDrop }: {
  fen: string;
  canInteract: boolean;
  onPieceDrop(from: string, to: string): boolean;
}) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  // Every move (the player's or the Bot's) changes the fen, and a stale
  // selection pointing at a square from the position before it makes no sense.
  // Adjusted during render rather than in an effect, per React's guidance for
  // resetting state when an input changes — no extra render, no flash of the
  // stale selection.
  const [fenAtSelection, setFenAtSelection] = useState(fen);
  if (fen !== fenAtSelection) {
    setFenAtSelection(fen);
    setSelectedSquare(null);
  }

  const legalMoves = selectedSquare ? new Chess(fen).moves({ square: selectedSquare, verbose: true }) : [];
  const squareStyles: Record<string, CSSProperties> = {};
  if (selectedSquare) {
    squareStyles[selectedSquare] = SELECTED_SQUARE_STYLE;
    for (const move of legalMoves) {
      squareStyles[move.to] = move.captured ? CAPTURE_RING_STYLE : MOVE_DOT_STYLE;
    }
  }

  function handleDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    const moved = targetSquare ? onPieceDrop(sourceSquare, targetSquare) : false;
    // A drop that misses a legal square never changes the fen, so nothing else
    // would clear the grabbed piece's highlights — clear them here regardless
    // of whether the move landed.
    setSelectedSquare(null);
    return moved;
  }

  function handleDragStart({ square }: PieceHandlerArgs) {
    // Grabbing a piece shows its legal moves the same way selecting it by
    // click does; dragging a different piece than the one already selected
    // just switches which one is highlighted.
    if (canInteract && square) setSelectedSquare(square as Square);
  }

  function handleSquareClick({ piece, square }: SquareHandlerArgs) {
    if (!canInteract) return;

    if (selectedSquare && legalMoves.some((move) => move.to === square)) {
      onPieceDrop(selectedSquare, square);
      setSelectedSquare(null);
      return;
    }

    const clickedOwnPiece = piece !== null && piece.pieceType.startsWith('w');
    setSelectedSquare(clickedOwnPiece && square !== selectedSquare ? (square as Square) : null);
  }

  return (
    <Chessboard
      options={{
        position: fen,
        pieces: stauntyPieces,
        onPieceDrop: handleDrop,
        onPieceDrag: handleDragStart,
        onPieceDragCancel: () => setSelectedSquare(null),
        onSquareClick: handleSquareClick,
        squareStyles,
        allowDragging: canInteract,
        animationDurationInMs: 225,
        // Notation sits absolutely-positioned in the same square as the piece, which
        // paints it above a piece's static box regardless of DOM order — push it behind.
        alphaNotationStyle: { zIndex: -1 },
        numericNotationStyle: { zIndex: -1 },
      }}
    />
  );
});
