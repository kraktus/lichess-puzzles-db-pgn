import { h, type VNode, type VNodeChildren } from "snabbdom";
import { patch } from "./patch";

export type OpenModal = (_: any, vnode: VNode) => () => void;

// modal with an `X`/cross close button
export function makeModal(
  // function allowing lazy content generation
  content: VNode | (() => VNodeChildren),
  onClose?: () => void,
  // override button aspect by providing a function taking callback
  // to open the `modal` and returning a `VNode` for the custom button
  button?: (openModal: OpenModal) => VNode,
): VNode {
  const modalView = () =>
    // The modal itself
    h("dialog.modal", [
      h("div.modal-box w-11/12 max-w-5xl h-[80vh]", [
        // ✕ close button (top right)
        h(
          "form",
          {
            attrs: { method: "dialog" },
            // the actual closure of the modal is made by DaisyUI/html
            // we only care about business logic here
            on: onClose
              ? {
                  click: onClose,
                }
              : {},
          },
          h(
            "button.btn btn-sm btn-circle btn-ghost absolute right-2 top-2",
            "✕",
          ),
        ),
        typeof content === "function" ? content() : content,
      ]),
    ]);
  let btnElement: HTMLElement;
  let dialog: VNode | HTMLElement;
  const openModal = (_: any, vnode: VNode) => () => {
    console.log("--------------------------");
    const elm = vnode.elm as HTMLElement;
    console.log("dialog before", dialog);
    if (!dialog) {
      dialog = document.createElement("div");
      console.log("btnElm", elm);
      elm?.insertAdjacentElement("afterend", dialog);
    }
    console.log("dialog after creation", dialog);
    dialog = patch(dialog, modalView());
    console.log("dialog after patch", dialog);
    // @ts-ignore
    dialog.elm?.showModal();
  };
  return h("div", [
    // Open button
    button
      ? button(openModal)
      : h(
          "button.btn",
          {
            hook: {
              insert: (vnode: VNode) => {
                console.log("vnode", vnode);
                btnElement = vnode.elm as HTMLElement;
              },
            },
            on: {
              click: (_: any, node: VNode) => openModal(_, node)(),
            },
          },
          "Open modal",
        ),
  ]);
}
