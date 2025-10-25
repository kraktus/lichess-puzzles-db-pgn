import { h, type VNode, type VNodeChildren } from "snabbdom";

import { themeByCateg, type PuzzleTheme, type ThemeKey } from "./themes";
import { ifAny, toggleElm } from "./util";

// modal with an `X`/cross close button
// also closes by clicking outside
export class ModalX {
  private modal?: HTMLDialogElement;

  private modalId: string;
  private content: VNode;

  constructor(content: VNode) {
    this.modalId = window.crypto.randomUUID();
    this.content = content;
  }

  view() {
    return h("div", [
      // Open button
      h(
        "button.btn",
        {
          on: {
            click: () => this.modal?.showModal(),
          },
        },
        "Open modal",
      ),

      // The modal itself
      h(
        "dialog.modal",
        {
          attrs: { id: this.modalId },
          hook: {
            insert: (vnode: any) => {
              this.modal = vnode.elm as HTMLDialogElement;
            },
          },
        },
        [
          h("div.modal-box w-11/12 max-w-5xl h-[80vh]", [
            // ✕ close button (top right)
            h(
              "form",
              { attrs: { method: "dialog" } },
              h(
                "button.btn.btn-sm.btn-circle.btn-ghost.absolute.right-2.top-2",
                "✕",
              ),
            ),
            this.content,
          ]),
        ],
      ),
    ]);
  }
}

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
          class: { "menu-active": filtered.has(theme.key) },
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

// <ul class="menu lg:menu-horizontal rounded-box lg:mb-64">
//   <li><a>Item 1</a></li>
//   <li>
//     <details open>
//       <summary>Parent item</summary>
//       <ul>
//         <li><a>Submenu 1</a></li>
//         <li><a>Submenu 2</a></li>
//         <li>
//           <details open>
//             <summary>Parent</summary>
//             <ul>
//               <li><a>item 1</a></li>
//               <li><a>item 2</a></li>
//             </ul>
//           </details>
//         </li>
//       </ul>
//     </details>
//   </li>
//   <li><a>Item 3</a></li>
// </ul>
