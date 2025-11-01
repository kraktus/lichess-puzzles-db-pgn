import { parseFen, makeFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci, Chess, type Move } from "chessops";
import {
  type Game as PgnGame,
  type PgnNodeData,
  makePgn,
  extend,
  defaultGame,
  defaultHeaders,
  isChildNode,
} from "chessops/pgn";

import { type PuzzleRecord, puzzleRecordToStr } from "./parquet";
import { type ThemeKey } from "./themes";

export const floorPuzzleRating = 400;
export const ceilingPuzzleRating = 4000; // TODO check that

export type SortBy = "rating" | "popularity";

export class PgnFilerSortExportOptions {
  // first level of sets for OR within a group, second set for AND between groups
  themeFilters: Set<ThemeKey>[];
  minRating: number;
  maxRating: number;
  maxPuzzles?: number;

  // if nothing set, unordered, in the order of retrieval
  sortBy?: SortBy;

  includeTags: boolean;
  includeComments: boolean;

  constructor() {
    // DEBUG
    this.themeFilters = [new Set(["opening"])];
    this.minRating = floorPuzzleRating;
    this.maxRating = ceilingPuzzleRating;
    this.includeTags = true;
    this.includeComments = false;
    this.maxPuzzles = 10; // DEBUG
  }
}
export const filterPuzzle = (
  p: PuzzleRecord,
  options: PgnFilerSortExportOptions,
): boolean =>
  p.Rating >= options.minRating &&
  p.Rating <= options.maxRating &&
  (options.themeFilters.length === 0 ||
    options.themeFilters.some((group) =>
      [...group].every((theme) => p.Themes.includes(theme)),
    ));

const playUnchecked = (pos: Chess, move: string) => {
  const uciMove = parseUci(move);
  if (!uciMove) throw new Error(`Invalid UCI move: ${move}`);
  pos.play(uciMove);
};

export function puzzleToPGN(
  puzzle: PuzzleRecord,
  options: PgnFilerSortExportOptions,
): string {
  const beforeStart = parseFen(puzzle.FEN).unwrap();
  const pos = Chess.fromSetup(beforeStart).unwrap();
  const [firstMove, ...moves] = puzzle.Moves.split(" ");
  // Play opponent's move first to get the puzzle initial position
  // as documented https://database.lichess.org/#puzzles
  playUnchecked(pos, firstMove);

  const game: PgnGame<PgnNodeData> = defaultGame(() => {
    const overridendHeaders = defaultHeaders();
    overridendHeaders.set(
      "Site",
      "https://kraktus.github.io/lichess-puzzles-db-pgn/",
    );
    return overridendHeaders;
  });

  game.headers.set("FEN", makeFen(pos.toSetup()));

  if (options.includeTags) {
    game.headers.set("PuzzleId", puzzle.PuzzleId);
    game.headers.set("PuzzleRating", String(puzzle.Rating));
    game.headers.set("PuzzlePopularity", String(puzzle.Popularity));
    game.headers.set("PuzzleThemes", puzzle.Themes.join(", "));
  }

  const sans = moves.map((moveStr) => {
    const move = parseUci(moveStr);
    if (!move) throw new Error(`Invalid UCI move: ${moveStr}`);
    const san = makeSan(pos, move);
    pos.play(move);
    return { san };
  });
  extend(game.moves, sans);

  if (options.includeComments) {
    const endNode = game.moves.end();
    if (isChildNode(endNode)) {
      // FIXME not working
      endNode.data.comments = puzzleRecordToStr(puzzle);
    } else {
      throw new Error(
        "Expected end node to be a child node (meaning one move)",
      );
    }
  }

  // 5️⃣ Generate final PGN
  return makePgn(game);
}
