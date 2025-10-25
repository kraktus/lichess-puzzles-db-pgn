import { h, type VNode, type VNodeChildren } from "snabbdom";

// modal with an `X`/cross close button
export function makeModal(
  content: VNode,
  onClose?: () => void,
  // override button aspect by providing a function taking callback
  // to open the `modal` and returning a `VNode` for the custom button
  button?: (openModal: () => void) => VNode,
): VNode {
  // could also be based on hash of content
  const modalId = window.crypto.randomUUID();
  // @ts-ignore
  const openModal = () => document.getElementById(modalId).showModal();
  return h("div", [
    // Open button
    button
      ? button(openModal)
      : h(
          "button.btn",
          {
            on: {
              click: openModal,
            },
          },
          "Open modal",
        ),

    // The modal itself
    h(
      "dialog.modal",
      {
        attrs: { id: modalId },
      },
      [
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
              "button.btn.btn-sm.btn-circle.btn-ghost.absolute.right-2.top-2",
              "✕",
            ),
          ),
          content,
        ]),
      ],
    ),
  ]);
}
