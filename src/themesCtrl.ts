import { h, type VNode } from "snabbdom";

import { type OpenModal, Modal } from "./modal";
import { type ThemeKey, puzzleThemes } from "./themes";
import { themesMenu } from "./view";
import { type PgnFilerSortExportOptions, type WithoutFilters } from "./pgn";

interface ThemeFilters {
  modal: Modal;
  filters: Set<ThemeKey>;
}

export class ThemeCtrl {
  // first level of sets for OR within a group, second set for AND between groups
  private themes: ThemeFilters[];
  // the empty set allows to have an "add new filter" button
  private wip: ThemeFilters;

  constructor(readonly redraw: () => void) {
    // DEBUG
    this.themes = [].map((tf) => ({
      modal: new Modal(this.redraw),
      filters: tf,
    }));
    this.wip = {
      modal: new Modal(this.redraw),
      filters: new Set<ThemeKey>(),
    };
  }

  toOpts(wo: WithoutFilters): PgnFilerSortExportOptions {
    return {
      ...wo,
      themeFilters: this.themes.map((tf) => tf.filters),
    };
  }

  view(): VNode[] {
    const includingWip = [...this.themes, this.wip];
    return includingWip.flatMap((themeFilter: ThemeFilters, i) => {
      const content = themesMenu(themeFilter.filters, this.redraw.bind(this));
      const onClose = () => {
        this.themes = includingWip.filter(
          (tf: ThemeFilters) => tf.filters.size > 0,
        );
        // if it's not empty, it has been added to the `opts.themeFilters`
        // and we need to create a new empty one, to show the "+ add filter" button
        if (this.wip.filters.size > 0) {
          this.wip = {
            modal: new Modal(this.redraw),
            filters: new Set<ThemeKey>(),
          };
        }
        this.redraw();
      };
      const button = this.displayAlreadyFilteredThemes(themeFilter.filters);
      const returnedNode = [themeFilter.modal.view(content, onClose, button)];
      if (i < includingWip.length - 1) {
        returnedNode.push(h("div.divider", "OR"));
      }
      return returnedNode;
    });
  }

  private displayAlreadyFilteredThemes(
    themes: Set<ThemeKey>,
  ): (openModal: OpenModal) => VNode {
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
}
