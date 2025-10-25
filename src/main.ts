import "./style.css";
import {
  init,
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  h,
  type VNode,
} from "snabbdom";

import { capitalizeFirstLetter } from "./util";
import { type ThemeKey, puzzleThemes } from "./themes";
import { section, themesMenu } from "./view";
import { makeModal } from "./modal";

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  attributesModule,
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

const VERSION = "v0.0.1";
console.log(VERSION);

const floorPuzzleRating = 400;
const ceilingPuzzleRating = 4000; // TODO check that

type SortBy = "rating" | "popularity";

class PgnFilerSortExportOptions {
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
    this.themeFilters = [
      new Set([
        "opening",
        "middlegame",
        "endgame",
        "rookEndgame",
        "bishopEndgame",
        "pawnEndgame",
        "knightEndgame",
        "queenEndgame",
        "queenRookEndgame",
      ]),
    ];
    this.minRating = floorPuzzleRating;
    this.maxRating = ceilingPuzzleRating;
    this.includeTags = true;
    this.includeComments = false;
  }
}
// whether each dropdown is opened
interface DropdownsState {
  filter: boolean;
  sortBy: boolean;
  exportOptions: boolean;
}

const footer = h("div.dropup", [
  h("button.dropbtn", "v: latest"),
  h("div.dropup-content", [
    h(
      "a",
      {
        attrs: {
          href: "/li-network/v0-1.html",
        },
      },
      VERSION,
    ),
  ]),
]);
const rangeInput = (
  title: string,
  color: string,
  min: number,
  max: number,
  value: number,
  onInput: (e: any) => void = (_) => {},
  opts?: { invert: boolean },
) =>
  h("div", [
    h("label.label", h("span.label-text", title)),
    h(
      // we use `transform -scale-x-100` to get a right-to-left slider
      // but then values are inverted, so we have to do some math
      `input.range.range-${color}.w-full${opts?.invert ? " transform -scale-x-100" : ""}`,
      {
        attrs: {
          type: "range",
          min: min,
          max: max,
          value: value,
        },
        on: {
          input: onInput,
        },
      },
    ),
    h("div.flex.justify-between.text-xs.opacity-70", [
      h("span", floorPuzzleRating),
      h("span", ceilingPuzzleRating),
    ]),
  ]);

class Controller {
  ops: PgnFilerSortExportOptions;
  dropdowns: DropdownsState;
  wipFilter: Set<ThemeKey>;

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.ops = new PgnFilerSortExportOptions();
    this.dropdowns = {
      filter: true,
      sortBy: true,
      exportOptions: true,
    };
    // the empty set allows to have an "add new filter" button
    this.wipFilter = new Set();

    this.old = elem;
  }
  redraw() {
    this.old = patch(this.old, this.view());
  }

  private allDropdownsExpanded() {
    for (const d of Object.values(this.dropdowns)) {
      if (!d) return false;
    }
    return true;
  }
  view(): VNode {
    return h("div.max-w-4xl.mx-auto.py-10.px-4", [
      h("h1.text-2xl.mb-8.text-center", "Lichess Puzzles to PGN"),
      // Collapsible Sections
      h("div.space-y-4", [
        !this.allDropdownsExpanded()
          ? h(
              "div.flex.justify-end",
              h(
                "button.text-sm underline",
                {
                  on: {
                    click: () => {
                      for (const key of Object.keys(this.dropdowns)) {
                        // @ts-ignore
                        this.dropdowns[key] = true;
                      }
                      this.redraw();
                    },
                  },
                },
                "Expand all",
              ),
            )
          : null,
        // Filter Section
        section("Filter", this.dropdowns.filter, [
          // Min Rating
          rangeInput(
            `Minimum Rating: ${this.ops.minRating}`,
            "primary",
            floorPuzzleRating,
            ceilingPuzzleRating,
            ceilingPuzzleRating - this.ops.minRating + floorPuzzleRating,
            (e: any) => {
              this.ops.minRating =
                ceilingPuzzleRating -
                Number(e.target.value) +
                floorPuzzleRating;
              this.redraw();
            },
            { invert: true },
          ),
          // Max Rating
          rangeInput(
            `Maximum Rating: ${this.ops.maxRating}`,
            "secondary",
            floorPuzzleRating,
            ceilingPuzzleRating,
            this.ops.maxRating,
            this.simpleOptsUpdate("maxRating"),
          ),
          this.ops.minRating > this.ops.maxRating
            ? h(
                "div.alert alert-error alert-soft",
                {
                  attrs: { role: "alert" },
                },
                h(
                  "span",
                  "Minimum rating cannot be greater than maximum rating.",
                ),
              )
            : null,
          // Themes
          h("label.label", h("span.label-text", "Filter by themes")),
          ...this.selectThemeFilters(),
          //this.testThemes(new Set(["mate", "mateIn1"])),
          // Max Puzzles
          h("div", [
            h(
              "div",
              h(
                "label.label",
                h("span.label-text", "Maximum Number of Puzzles"),
              ),
            ),
            // <fieldset class="fieldset">
            // <input type="number" class="input" placeholder="Type here" />
            h("input.input.validator", {
              attrs: {
                type: "number",
                min: 1,
                value: this.ops.maxPuzzles ?? "",
              },
              on: {
                // no need to redraw here, already shown on the screen
                input: (e: any) => {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (val >= 1) this.ops.maxPuzzles = val;
                  else this.ops.maxPuzzles = undefined;
                },
              },
            }),
          ]),
        ]),
        ,
        // Sort Section
        section("Sort by", this.dropdowns.sortBy, [
          this.radioSort("rating", "primary"),
          h("label.cursor-pointer.flex.items-center.gap-2", [
            h("input.radio.radio-secondary", {
              attrs: { type: "radio", name: "sort" },
              on: {
                change: this.setSort("popularity"),
              },
            }),
            h("span", "Popularity"),
          ]),
        ]),

        // Include Section
        section("Export options", this.dropdowns.exportOptions, [
          h("label.cursor-pointer.flex.items-center.gap-2", [
            h("input.checkbox.checkbox-primary", {
              attrs: { type: "checkbox" },
            }),
            h("span", "Puzzle characteristics as PGN tags"),
          ]),
          h("label.cursor-pointer.flex.items-center.gap-2", [
            h("input.checkbox.checkbox-secondary", {
              attrs: { type: "checkbox" },
            }),
            h("span", "Puzzle characteristics as PGN comment"),
          ]),
        ]),
      ]),

      // Action Button
      h("div.text-center.mt-8", [
        h("button.btn.btn-primary.btn-wide", "Generate PGN"),
      ]),
      footer,
    ]);
  }

  private selectThemeFilters(): VNode[] {
    const includingWip = [...this.ops.themeFilters, this.wipFilter];
    return includingWip.flatMap((themeFilter: Set<ThemeKey>, i) => {
      // .bind(this) might not been needed but JS is such a pain I prefer to cover for it
      const content = themesMenu(themeFilter, this.redraw.bind(this));
      const onClose = () => {
        this.ops.themeFilters = includingWip.filter(
          (tf: Set<ThemeKey>) => tf.size > 0,
        );
        // if it's not empty, it has been added to the `ops.themeFilters`
        // and we need to create a new empty one, to show the "+ add filter" button
        if (this.wipFilter.size > 0) {
          this.wipFilter = new Set();
        }
        this.redraw();
      };
      const button = this.displayAlreadyFilteredThemes(themeFilter);
      const returnedNode = [makeModal(content, onClose, button)];
      if (i < includingWip.length - 1) {
        returnedNode.push(h("span.font-bold.mx-2", "OR"));
      }
      return returnedNode;
    });
  }

  private displayAlreadyFilteredThemes(
    themes: Set<ThemeKey>,
  ): (openModal: () => void) => VNode {
    return (openModal) =>
      h(
        "button.bg-base-200.rounded-box.p-10.w-full.flex.flex-wrap",
        {
          on: {
            click: openModal,
          },
          class: {
            "cursor-pointer": true,
          },
        },
        themes.size > 0
          ? Array.from(themes).flatMap((themeKey, i) => {
              const badge = [
                h("div.badge.badge-outline", puzzleThemes[themeKey].name),
              ];
              if (i < themes.size - 1) {
                badge.push(h("span.font-bold.mx-2", "AND"));
              }
              return badge;
            })
          : h(
              "div.badge.badge-dash badge-primary w-full p-4",
              "+ filter new themes",
            ),
      );
  }

  private bind(f: (e: any) => void) {
    return (e: any) => {
      // @ts-ignore
      f(e);
      this.redraw();
    };
  }

  private radioSort = (key: SortBy, color: string) =>
    h("label.cursor-pointer.flex.items-center.gap-2", [
      // FIXME it's discouraged to dynamically create class due to tailwind class purging that may remove it
      // I think for DaisyUI it's fine though
      h(`input.radio.radio-${color}`, {
        attrs: { type: "radio", name: "sort" },
        on: {
          change: this.setSort(key),
        },
      }),
      h("span", capitalizeFirstLetter(key)),
    ]);

  private setSort = (key: SortBy) => () => (this.ops.sortBy = key);

  private simpleOptsUpdate(key: keyof PgnFilerSortExportOptions) {
    return this.bind((e: any) => {
      const target = (e.target as HTMLInputElement).value;
      console.log("simple update with key and target", key, target);
      // @ts-ignore
      if (target) this.ops[key] = Number((e.target as HTMLInputElement).value);
      // @ts-ignore
      else this.ops[key] = undefined;
    });
  }
}

const container = document.getElementById("container")!;
const ctrl = new Controller(container);
ctrl.redraw();
