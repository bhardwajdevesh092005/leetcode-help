import * as vscode from 'vscode';
import LeetCodeProblemProvider from './UI/Providers/ProblemListProvider';
export function activate(context: vscode.ExtensionContext) {
//   const provider = new LeetCodeSidebarProvider(context);
  const treeDataProvider = new LeetCodeProblemProvider();
  vscode.window.registerTreeDataProvider('leetcodeSidebarView', treeDataProvider);
}
// class LeetCodeSidebarProvider implements vscode.WebviewViewProvider {
//   constructor(private context: vscode.ExtensionContext) {}

//   resolveWebviewView(webviewView: vscode.WebviewView) {
//     const webview = webviewView.webview;

//     webview.options = {
//       enableScripts: true,
//       localResourceRoots: [
//         vscode.Uri.file(path.join(this.context.extensionPath, 'media'))
//       ]
//     };

//     webview.html = this.getHtml(webview);
//   }

//   private getHtml(webview: vscode.Webview): string {
//     const styleUri = webview.asWebviewUri(
//       vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'style.css'))
//     );

//     return `
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//         <meta charset="UTF-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1.0">
//         <title>LeetCode Sidebar</title>
//         <style>
//           body {
//             font-family: sans-serif;
//             padding: 10px;
//           }
//           button {
//             padding: 8px 12px;
//             font-size: 14px;
//           }
//         </style>
//       </head>
//       <body>
//         <h2>LeetCode Helper</h2>
//         <p>This is a custom sidebar Webview!</p>

//         <script>
//         </script>
//       </body>
//       </html>
//     `;
//   }
// }