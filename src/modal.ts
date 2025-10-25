import { h, type VNode, type VNodeChildren } from "snabbdom";

// modal with an `X`/cross close button
export class ModalX {
  private modal?: HTMLDialogElement;

  private modalId: string;
  private content: VNode;
  private onClose?: () => void;
  // override button aspect by providing a function taking callback
  // to open the `modal` and returning a `VNode` for the custom button
  private button?: (onClick: () => void) => VNode;

  constructor(
    content: VNode,
    onClose?: () => void,
    button?: (onClick: () => void) => VNode,
  ) {
    this.modalId = window.crypto.randomUUID();
    this.content = content;
    this.onClose = onClose;
    this.button = button;
  }

  view() {
    const onClick = () => this.modal?.showModal();
    return h("div", [
      // Open button
      this.button
        ? this.button(onClick)
        : h(
            "button.btn",
            {
              on: {
                click: onClick,
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
              {
                attrs: { method: "dialog" },
                // the actual closure of the modal is made by DaisyUI/html
                // we only care about business logic here
                on: {
                  click: () => console.log("foo"),
                },
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
