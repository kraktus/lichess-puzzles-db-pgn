// `ReadableByteStreamController` is needed by @huggingface/hub.downloadFile with xet: true
// and safari does not support it natively
// if (typeof ReadableByteStreamController === "undefined") {
//   await import("web-streams-polyfill/polyfill");
// }

import { h, type VNode } from "snabbdom";

import {
  capitalizeFirstLetter,
  downloadTextFile,
  downloadStreamingTextFile,
  isMobile,
  isTouchDevice,
} from "./util";
import { type ThemeKey, puzzleThemes } from "./themes";
import {
  section,
  themesMenu,
  footer,
  Status,
  checkboxPGNInclude,
} from "./view";
import { log, addExceptionListeners } from "./log";
import { type OpenModal, Modal } from "./modal";
import { Db } from "./db";
import { Parquet } from "./parquet";
import {
  ceilingPuzzleRating,
  floorPuzzleRating,
  type SortBy,
  type PgnFilerSortExportOptions,
  type WithoutFilters,
  defaultWithoutFilters,
} from "./pgn";
import { ThemeCtrl } from "./themesCtrl";
import { VERSION } from "./version";
import { patch } from "./patch";

// whether each dropdown is opened
interface DropdownsState {
  filter: boolean;
  sortBy: boolean;
  exportOptions: boolean;
}

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

interface Modals {
  log: Modal;
}

class Controller {
  private db: Db;

  opts: WithoutFilters;
  themeCtrl: ThemeCtrl;
  parquet: Parquet;
  dropdowns: DropdownsState;
  status: Status;
  modals: Modals;

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement, db: Db) {
    this.old = elem;

    this.db = db;
    this.status = new Status(this.redraw.bind(this));
    this.opts = defaultWithoutFilters();
    this.themeCtrl = new ThemeCtrl(this.redraw.bind(this));
    this.parquet = new Parquet(
      this.db,
      this.status,
      isMobile() ? 50_000 : 1000_000,
    );
    // DEBUG to true
    this.dropdowns = {
      filter: true,
      sortBy: false,
      exportOptions: true,
    };

    this.modals = {
      log: new Modal(this.redraw.bind(this)),
    };
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

      this.parquet.downloadNeeded({ ifAlreadyWip: false })
        ? h(
            "div.flex.justify-center", // parent with flex and horizontal centering
            [
              h(
                "button.btn btn-accent p-4",
                {
                  on: {
                    click: () => {
                      this.parquet.download().then(() => this.redraw());
                      this.redraw();
                    },
                  },
                },
                "start downloading the puzzle database",
              ),
            ],
          )
        : null,
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
                      this.dropdowns = {
                        filter: true,
                        sortBy: true,
                        exportOptions: true,
                      };
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
            `Minimum Rating: ${this.opts.minRating}`,
            "primary",
            floorPuzzleRating,
            ceilingPuzzleRating,
            ceilingPuzzleRating - this.opts.minRating + floorPuzzleRating,
            (e: any) => {
              this.opts.minRating =
                ceilingPuzzleRating -
                Number(e.target.value) +
                floorPuzzleRating;
              this.redraw();
            },
            { invert: true },
          ),
          // Max Rating
          rangeInput(
            `Maximum Rating: ${this.opts.maxRating}`,
            "secondary",
            floorPuzzleRating,
            ceilingPuzzleRating,
            this.opts.maxRating,
            this.simpleOptsUpdate("maxRating"),
          ),
          this.opts.minRating > this.opts.maxRating
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
          ...this.themeCtrl.view(),
          // Max Puzzles
          h("div", [
            h(
              "div",
              h(
                "label.label",
                h("span.label-text", "Maximum Number of Puzzles"),
              ),
            ),
            h("input.input.validator", {
              attrs: {
                type: "number",
                min: 1,
                value: this.opts.maxPuzzles ?? "",
              },
              on: {
                // no need to redraw here, already shown on the screen
                input: (e: any) => {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (val >= 1) this.opts.maxPuzzles = val;
                  else this.opts.maxPuzzles = undefined;
                },
              },
            }),
          ]),
        ]),
        ,
        // Sort Section
        section("Sort by", this.dropdowns.sortBy, [
          this.radioSort(this.opts.sortBy == "rating", "rating", "primary"),
          this.radioSort(
            this.opts.sortBy == "popularity",
            "popularity",
            "secondary",
          ),
        ]),

        // Include Section
        section("Export options", this.dropdowns.exportOptions, [
          checkboxPGNInclude(
            "checkbox-primary",
            "Puzzle characteristics as PGN tags",
            this.opts.includeTags,
            (checked) => {
              this.opts.includeTags = checked;
            },
          ),
          checkboxPGNInclude(
            "checkbox-secondary",
            "Puzzle characteristics as PGN comment",
            this.opts.includeComments,
            (checked) => {
              this.opts.includeComments = checked;
            },
          ),
        ]),
        h("details.dropdown dropdown-end w-full", [
          h(
            "summary.btn btn-ghost rounded-field text-sm underline color-bg ",
            "Advanced",
          ),
          h("ul.menu dropdown-content bg-base-100 w-full", [
            h("li", VERSION),
            h(
              "li",
              h(
                "button.btn button-ghost underline text-error",
                {
                  on: {
                    click: () => {
                      this.db.clearDb().then((_) =>
                        // refresh page
                        window.location.reload(),
                      );
                    },
                  },
                },
                "Clear all data",
              ),
            ),
            h(
              "li",
              h("div", [
                h(
                  "div",
                  h("label.label", h("span.label-text", "Parquet chunk size")),
                ),
                h("input.input.validator", {
                  attrs: {
                    type: "number",
                    min: 1,
                    value: this.parquet.rowReadChunkSize,
                  },
                  on: {
                    // no need to redraw here, already shown on the screen
                    input: (e: any) => {
                      this.parquet.rowReadChunkSize = Number(
                        (e.target as HTMLInputElement).value,
                      );
                    },
                  },
                }),
              ]),
            ),
            h(
              "li",
              h("div", [
                h("div", h("label.label", h("span.label-text", "Show logs"))),
                this.modals.log.view(() =>
                  h("div", [
                    `Browser: ${navigator.userAgent}\n` +
                      `Cores: ${navigator.hardwareConcurrency}, ` +
                      `Touch: ${isTouchDevice()} ${navigator.maxTouchPoints}, ` +
                      `Screen: ${window.screen.width}x${window.screen.height}, ` +
                      ("lichessTools" in window
                        ? "Extension: Lichess Tools, "
                        : "") +
                      `Browser lang: ${navigator.language}, `,
                    ...log
                      .cachedGet()
                      .map((line) =>
                        h("pre.whitespace-pre-wrap.break-words.text-sm", line),
                      ),
                  ]),
                ),
              ]),
            ),
          ]),
        ]),
      ]),
      // Action Button
      h("div.text-center.mt-8 mb-8", [
        this.status.view() ??
          h(
            "button.btn.btn-primary.btn-wide",
            {
              on: {
                click: () => {
                  this.status.show = true;
                  this.parquet
                    .pgnPipeline(this.themeCtrl.toOpts(this.opts))
                    .then(() => {
                      this.status.update("Preparing download...");
                      downloadStreamingTextFile({
                        iterator: this.parquet.exportPgnChunks(),
                        filename: "lichess-puzzles.pgn",
                        mimeType: "application/vnd.chess-pgn",
                      }).then(() => {
                        this.status.show = false;
                        this.redraw();
                      });
                    });
                  this.redraw();
                },
              },
            },
            "Generate PGN",
          ),
      ]),
      footer,
    ]);
  }

  private bind(f: (e: any) => void) {
    return (e: any) => {
      // @ts-ignore
      f(e);
      this.redraw();
    };
  }

  private radioSort = (checked: boolean, key: SortBy, color: string) =>
    h("label.cursor-pointer.flex.items-center.gap-2", [
      // FIXME it's discouraged to dynamically create class due to tailwind class purging that may remove it
      // I think for DaisyUI it's fine though
      h(`input.radio.radio-${color}`, {
        attrs: { type: "radio", name: "sort", checked },
        on: {
          change: this.setSort(key),
        },
      }),
      h("span", capitalizeFirstLetter(key)),
    ]);

  private setSort = (key: SortBy) => () => (this.opts.sortBy = key);

  private simpleOptsUpdate(key: keyof PgnFilerSortExportOptions) {
    return this.bind((e: any) => {
      const target = (e.target as HTMLInputElement).value;
      log.log(`simple update with key {${key}}, target {${target}}`);
      // @ts-ignore
      if (target) this.opts[key] = Number((e.target as HTMLInputElement).value);
      // @ts-ignore
      else this.opts[key] = undefined;
    });
  }
}

export function main() {
  console.log(VERSION);
  addExceptionListeners();
  const container = document.getElementById("container")!;
  Db.open({ deleteTmp: true }).then((db) => {
    log.init(db);
    const ctrl = new Controller(container, db);
    ctrl.redraw();
  });
}
