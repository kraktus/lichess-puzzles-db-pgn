import { h, type VNode, type VNodeChildren } from "snabbdom";

import { themeByCateg, type PuzzleTheme } from "./themes";

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

const lia = (theme: PuzzleTheme): VNode =>
  h("li", h("a", { attrs: { title: theme.desc } }, theme.name));
const ul = (content: VNodeChildren): VNode => h("ul.menu-dropdown", content);

// export const themesMenu = (...x: any) =>
//   h("ul.menu.lg:menu-horizontal.rounded-box.lg:mb-64", [
//     h("li", h("a", "Item 1")),
//     h("li", [
//       h("details", [
//         h("summary", "x"),
//         h("ul", [
//           h("li", h("a", "Submenu 1")),
//           h("li", h("a", "Submenu 2")),
//           h("li", [
//             h("details", [
//               h("summary", "Parent"),
//               h("ul", [h("li", h("a", "item 1")), h("li", h("a", "item 2"))]),
//             ]),
//           ]),
//         ]),
//       ]),
//     ]),
//     h("li", h("a", "Item 3")),
//   ]);

export const themesMenu = (...x: any) =>
  h(
    "ul.menu.lg:menu-horizontal.rounded-box.lg:mb-64",
    Object.entries(themeByCateg).map(([categ, themes]) =>
      h("li", h("details", [h("summary", categ), h("ul", themes.map(lia))])),
    ),
  );

// export const themesMenuKlass = (currentFilters: Set<Theme>) =>
//   Object.entries(puzzleCategories).map(([categ, themes]) =>
//     h("ul.menu bg-base-100 rounded-box lg:min-w-max", [
//       h("span.menu-dropdown-toggle", categ),
//       ul(themes.map((theme) => lia(theme))),
//     ]),
//   );
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

// const detailsElement = h("details", { attrs: { open: true } }, [
//   h("summary", "Summary Text"),
//   h("p", "This is the content inside the details element."),
// ]);
