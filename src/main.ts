import "./style.css";
// import './github.css';
// import './graph.ts';
// import { Config, defaultConfig } from './config.ts';
// import { Graph } from './graph.ts';

import {
  init,
  classModule,
  propsModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  h,
  VNode,
} from "snabbdom";

const patch = init([
  // Init patch function with chosen modules
  classModule, // makes it easy to toggle classes
  propsModule, // for setting properties on DOM elements
  attributesModule,
  styleModule, // handles styling on elements with support for animations
  eventListenersModule, // attaches event listeners
]);

class PuzzleOptions {
  minRating?: number;
  maxRating?: number;
  // first level of sets for OR within a group, second set for AND between groups
  themeFilters: Set<Set<string>>;
}

const strong = (v: string | VNode) => h("strong", v);
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
      "v: 0.1",
    ),
  ]),
]);
const rangeInput = (
  min: number,
  max: number,
  step: number,
  value: number,
  onInput: (e: any) => void = (_) => {},
) =>
  h("input", {
    attrs: {
      type: "range",
      min: min,
      max: max,
      step: step,
      value: value,
    },
    on: { input: onInput },
  });

class Controller {
  searchButtonLabel: "Start" | "Stop" | "Restart";
  config: Config;

  old: HTMLElement | VNode;

  constructor(elem: HTMLElement) {
    this.config = defaultConfig;
    //this.searchButtonLabel = 'Start';
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
        h("div.collapse.collapse-arrow.bg-base-300", [
          h("input", { attrs: { type: "checkbox" } }),
          h("div.collapse-title.text-lg.font-semibold", "Filter"),
          h("div.collapse-content.space-y-6", [
            // Min Rating
            h("div", [
              h("label.label", h("span.label-text", "Minimum Rating")),
              h("input.range.range-primary.w-full", {
                attrs: { type: "range", min: 400, max: 2800, value: 2800 },
              }),
              h("div.flex.justify-between.text-xs.opacity-70", [
                h("span", "400"),
                h("span", "2800"),
              ]),
            ]),
            // Max Rating
            h("div", [
              h("label.label", h("span.label-text", "Maximum Rating")),
              h("input.range.range-secondary.w-full", {
                attrs: { type: "range", min: 400, max: 2800, value: 2800 },
              }),
              h("div.flex.justify-between.text-xs.opacity-70", [
                h("span", "400"),
                h("span", "2800"),
              ]),
            ]),
            // Themes
            h("div", [
              h("label.label", h("span.label-text", "Theme")),
              h("select.select.select-bordered.w-full", [
                h(
                  "option",
                  { attrs: { disabled: true, selected: true } },
                  "Choose a theme",
                ),
                h("option", "Pin"),
                h("option", "Fork"),
                h("option", "Discovered Attack"),
                h("option", "Endgame"),
                h("option", "Opening Trap"),
              ]),
            ]),
            // Max Puzzles
            h("div", [
              h(
                "label.label",
                h("span.label-text", "Maximum Number of Puzzles"),
              ),
              h("input.range.range-accent", {
                attrs: { type: "range", min: 10, max: 5000, value: 1000 },
              }),
              h("div.flex.justify-between.text-xs.opacity-70", [
                h("span", "10"),
                h("span", "5000"),
              ]),
            ]),
          ]),
        ]),

        // Sort Section
        h("div.collapse.collapse-arrow.bg-base-300", [
          h("input", { attrs: { type: "checkbox", checked: true } }),
          h("div.collapse-title.text-lg.font-semibold", "Sort by"),
          h("div.collapse-content.space-y-3", [
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
        ]),

        // Include Section
        h("div.collapse.collapse-arrow.bg-base-300", [
          h("input", { attrs: { type: "checkbox" } }),
          h("div.collapse-title.text-lg.font-semibold", "Include"),
          h("div.collapse-content.space-y-3", [
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
      this.graph?.redraw();
    };
  }

  private simpleSimulUpdate(key: string) {
    return this.bind((e: any) => {
      // @ts-ignore
      this.config.simulation[key] = Number(
        (e.target as HTMLInputElement).value,
      );
    });
  }

  private simpleConfigUpdate(key: any) {
    return this.bind((e: any) => {
      // @ts-ignore
      this.config[key] = Number((e.target as HTMLInputElement).value);
    });
  }
}

console.log("v0.2");
const container = document.getElementById("container")!;
const ctrl = new Controller(container);
ctrl.redraw();
