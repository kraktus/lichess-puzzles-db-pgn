import { h, type VNode, type VNodeChildren } from "snabbdom";

// modal with an `X`/cross close button
export class ModalX {
  private modalId: string;
  private content: VNode;
  private onClose?: () => void;
  // override button aspect by providing a function taking callback
  // to open the `modal` and returning a `VNode` for the custom button
  private button?: (openModal: () => void) => VNode;

  constructor(
    content: VNode,
    onClose?: () => void,
    button?: (openModal: () => void) => VNode,
  ) {
    // could also be based on hash of content
    this.modalId = window.crypto.randomUUID();
    this.content = content;
    this.onClose = onClose;
    this.button = button;
  }

  view() {
    // @ts-ignore
    const openModal = () => document.getElementById(this.modalId).showModal();
    return h("div", [
      // Open button
      this.button
        ? this.button(openModal)
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
          attrs: { id: this.modalId },
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
                on: this.onClose
                  ? {
                      click: this.onClose,
                    }
                  : {},
              },
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
