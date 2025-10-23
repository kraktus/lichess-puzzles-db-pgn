import { h, type VNode, type VNodeChildren } from "snabbdom";
import { OrderedSet } from "immutable";

import { puzzleCategories, type Theme } from "./themes";

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

const lia = (content: VNodeChildren): VNode => h("li", h("a", content));
const ul = (content: VNodeChildren): VNode => h("ul", content);

export const themesMenu = (currentFilters: OrderedSet<Theme>) =>
  h(
    "ul.menu xl:menu-horizontal bg-base-100 rounded-box lg:min-w-max space-y-6",
    Object.entries(puzzleCategories).map(([categ, themes]) =>
      h("a", [h("summary", categ), ul(themes.map((theme) => lia(theme)))]),
    ),
  );
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
