import {
  h,
  type VNode,
  type VNodeChildren,
  type VNodeChildElement,
} from "snabbdom";
import { patch } from "./patch";

export type OpenModal = (_: any, vnode: VNode) => void;

// modal with an `X`/cross close button
export class Modal {
  private opened: boolean;
  constructor(readonly redraw: () => void) {
    this.opened = false;
  }

  view(
    // function allowing lazy content generation
    content: VNodeChildren | (() => VNodeChildren),
    onClose?: () => void,
    // override button aspect by providing a function taking callback
    // to open the `modal` and returning a `VNode` for the custom button
    button?: (openModal: OpenModal) => VNode,
  ): VNode {
    const openModal = () => {
      this.opened = true;
      this.redraw();
    };

    const modalView = () =>
      // The modal itself
      h(
        "dialog.modal",
        {
          hook: {
            insert: (vnode) => {
              // @ts-ignore
              vnode.elm.showModal();
            },
          },
        },
        [
          h("div.modal-box w-11/12 max-w-5xl h-[80vh]", [
            // ✕ close button (top right)
            h(
              "form",
              {
                attrs: { method: "dialog" },
                on: {
                  click: () => {
                    onClose?.();
                    this.opened = false;
                    this.redraw();
                  },
                },
              },
              h(
                "button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2",
                "✕",
              ),
            ),
            typeof content === "function" ? content() : content,
          ]),
        ],
      );

    return this.opened
      ? modalView()
      : h("div", [
          // Open button
          button?.(openModal) ??
            h(
              "button.btn",
              {
                on: {
                  click: openModal,
                },
              },
              "Open modal",
            ),
        ]);
  }
}
