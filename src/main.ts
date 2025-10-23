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

import { type ThemeKey } from "./themes";
import { section, themesMenu } from "./view";

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

class PgnFilerSortExportOptions {
  // first level of sets for OR within a group, second set for AND between groups
  themeFilters: Set<ThemeKey>[];
  minRating: number;
  maxRating: number;
  maxPuzzles?: number;

  // if nothing set, unordered, in the order of retrieval
  sortBy?: "rating" | "popularity";

  includeTags: boolean;
  includeComments: boolean;

  constructor() {
    this.themeFilters = [];
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

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.ops = new PgnFilerSortExportOptions();
    this.dropdowns = {
      filter: true,
      sortBy: true,
      exportOptions: true,
    };

    this.old = elem;
  }
  redraw() {
    this.old = patch(this.old, this.view());
  }
  view(): VNode {
    return h("div.max-w-4xl.mx-auto.py-10.px-4", [
      h("h1.text-2xl.mb-8.text-center", "Lichess Puzzles to PGN"),
      // Collapsible Sections
      h("div.space-y-4", [
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
            (e: any) => {
              this.ops.maxRating = Number(e.target.value);
              this.redraw();
            },
          ),
          this.ops.minRating > this.ops.maxRating
            ? h(
                "div.alert.alert-error.alert-soft",
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
          // h("div", [
          //   h("label.label", h("span.label-text", "Theme")),
          //   h("select.select.select-bordered.w-full", [
          //     h(
          //       "option",
          //       { attrs: { disabled: true, selected: true } },
          //       "Choose a theme",
          //     ),
          //     h("option", "Pin"),
          //     h("option", "Fork"),
          //     h("option", "Discovered Attack"),
          //     h("option", "Endgame"),
          //     h("option", "Opening Trap"),
          //   ]),
          // ]),
          h("span", themesMenu(new Set())),
          // Max Puzzles
          h("div", [
            h("label.label", h("span.label-text", "Maximum Number of Puzzles")),
            h("input.range.range-accent", {
              attrs: { type: "range", min: 10, max: 5000, value: 1000 },
            }),
            h("div.flex.justify-between.text-xs.opacity-70", [
              h("span", "10"),
              h("span", "5000"),
            ]),
          ]),
        ]),
        ,
        // Sort Section
        section("Sort by", this.dropdowns.sortBy, [
          h("label.cursor-pointer.flex.items-center.gap-2", [
            h("input.radio.radio-primary", {
              attrs: { type: "radio", name: "sort" },
            }),
            h("span", "Rating"),
          ]),
          h("label.cursor-pointer.flex.items-center.gap-2", [
            h("input.radio.radio-secondary", {
              attrs: { type: "radio", name: "sort" },
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
    ]);
  }

  private bind(f: (e: any) => void) {
    return (e: any) => {
      // @ts-ignore
      f(e);
      this.redraw();
    };
  }

  // private simpleSimulUpdate(key: string) {
  //   return this.bind((e: any) => {
  //     // @ts-ignore
  //     this.config.simulation[key] = Number(
  //       (e.target as HTMLInputElement).value,
  //     );
  //   });
  // }

  // private simpleConfigUpdate(key: any) {
  //   return this.bind((e: any) => {
  //     // @ts-ignore
  //     this.config[key] = Number((e.target as HTMLInputElement).value);
  //   });
  // }
}

const container = document.getElementById("container")!;
const ctrl = new Controller(container);
ctrl.redraw();
