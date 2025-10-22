import { h, type VNode, type VNodeChildren } from "snabbdom";

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
