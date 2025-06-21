import {
  WebviewViewProvider,
  WebviewView,
  Webview,
  Uri,
  EventEmitter,
  window,
} from "vscode";
import * as fs from "fs";
// import { Utils } from "utils";

// import * as ReactDOMServer from "react-dom/server";
import { Utils } from "../Utils/Nonce";

export class LeftPanelWebview implements WebviewViewProvider {
  constructor(
    private readonly extensionPath: Uri,
    private data: any,
    private _view: any = null
  ) {}
  private onDidChangeTreeData: EventEmitter<any | undefined | null | void> =
    new EventEmitter<any | undefined | null | void>();

  refresh(context: any): void {
    this.onDidChangeTreeData.fire(null);
    this._view.webview.html = this._getHtmlForWebview(this._view?.webview);
  }

  //called when a view first becomes visible
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionPath],
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    this._view = webviewView;
    this.activateMessageListener();
  }

  private activateMessageListener() {
    this._view.webview.onDidReceiveMessage((message: any) => {
      switch (message.action) {
        case "SHOW_WARNING_LOG":
          window.showWarningMessage(message.data.message);
          break;
        default:
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: Webview) {
    const scriptUri = webview.asWebviewUri(
      Uri.joinPath(this.extensionPath, "src", "UI", "static", "script.js")
    );
	const dataUri = webview.asWebviewUri(
		Uri.joinPath(this.extensionPath,'src','data','category_wise_questions.js')
	);
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    // Script to handle user action

    // Use a nonce to only allow a specific script to be run.
    // const nonce = Utils.getNonce();

    return `
		<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>LeetCode Problems</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 1rem;
        background-color: rgb(19, 19, 19);
      }

      h3 {
        margin-top: 0.5rem;
        cursor: pointer;
        background-color: #4caf50;
        color: white;
        padding: 5px;
        border-radius: 6px;
      }

      .category,
      .problem {
        margin: 10px 0;
      }

      .problems,
      .parse-btn-wrapper {
        display: none;
        padding-left: 20px;
      }

      .problem-title {
        cursor: pointer;
        background-color: #171717;
        padding: 8px;
        border-radius: 6px;
        margin: 5px 0;
      }

      .parse-btn {
        margin-top: 5px;
        padding: 6px 12px;
        background-color: #2196f3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      }

      .parse-btn:hover {
        background-color: #1976d2;
      }
    </style>
  </head>
  <body>
    <h1>
      <img
        src="https://img.icons8.com/?size=160&id=wDGo581Ea5Nf&format=png"
        style="width: 30px; filter: invert()"
        alt=""
      />
      Problem List
    </h1>

    <div id="container"></div>
    <script src="${dataUri}"></script>
    <script nonce="" src="${scriptUri}"></script>
  </body>
</html>

`;
  }
}
