import { h, type VNode, type VNodeChildren } from "snabbdom";

import { themeByCateg, type PuzzleTheme, type ThemeKey } from "./themes";
import { ifAny, toggleElm } from "./util";

export const section = (
  title: string,
  opened: boolean,
  children: VNodeChildren,
): VNode =>
  h("div.collapse.collapse-arrow.bg-base-300", [
    h("input", { attrs: { type: "checkbox", checked: opened } }),
    h("div.collapse-title.text-lg.font-semibold", title),
    h("div.collapse-content.space-y-6", children),
  ]);

// `filtered` are themes already selected
export const themesMenu = (
  filtered: Set<ThemeKey>,
  redraw: () => void,
): VNode => {
  const lia = (theme: PuzzleTheme): VNode =>
    h(
      "li",
      h(
        `a`,
        {
          class: {
            "menu-active": filtered.has(theme.key),
            // by default `menu-active` disable cursor pointer
            "cursor-pointer": true,
          },
          attrs: { title: theme.desc },
          on: {
            click: () => {
              toggleElm(filtered, theme.key);
              console.log(filtered);
              redraw();
            },
          },
        },
        theme.name,
      ),
    );
  return h(
    "ul.menu.lg:menu-horizontal.rounded-box.lg:mb-64",
    Object.entries(themeByCateg).map(([categ, themes]) =>
      h(
        "li",
        h(
          "details",
          {
            attrs: {
              open: ifAny(
                themes.map((t) => t.key),
                (k) => filtered.has(k),
              ),
            },
          },
          [h("summary", categ), h("ul", themes.map(lia))],
        ),
      ),
    ),
  );
};

export const footer = h(
  "footer.daisy-footer p-2 text-xs text-neutral-content flex flex-col items-center justify-center text-center",
  [
    h("div.flex.items-center.justify-center.space-x-2", [
      h(
        "a",
        {
          props: {
            href: "https://github.com/kraktus/lichess-puzzles-db-pgn",
            target: "_blank",
          },
          class: {
            link: true,
            "link-hover": true,
            flex: true,
            "items-center": true,
            "justify-center": true,
          },
        },
        [
          h(
            "svg",
            {
              attrs: {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 24 24",
                fill: "currentColor",
                class: "w-4 h-4",
                "aria-label": "GitHub",
              },
            },
            [
              h("path", {
                attrs: {
                  d: "M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.58 0-.287-.01-1.04-.015-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.808 1.305 3.492.997.108-.775.418-1.305.76-1.606-2.665-.304-5.466-1.336-5.466-5.932 0-1.31.468-2.38 1.235-3.22-.124-.303-.535-1.523.117-3.176 0 0 1.008-.323 3.3 1.23a11.48 11.48 0 013.003-.404c1.02.005 2.047.138 3.003.404 2.29-1.553 3.295-1.23 3.295-1.23.653 1.653.242 2.873.12 3.176.77.84 1.233 1.91 1.233 3.22 0 4.61-2.805 5.625-5.475 5.922.43.37.81 1.096.81 2.21 0 1.596-.015 2.884-.015 3.273 0 .321.216.698.825.579C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z",
                },
              }),
            ],
          ),
        ],
      ),
      h(
        "a",
        {
          props: {
            href: "https://github.com/kraktus",
            target: "_blank",
          },
          class: { link: true, "link-hover": true },
        },
        "© Kraktus",
      ),
      h(
        "a",
        {
          props: {
            href: "https://opensource.org/licenses/AGPL",
            target: "_blank",
          },
          class: { link: true, "link-hover": true },
        },
        "AGPL",
      ),
    ]),
    ,
  ],
);
