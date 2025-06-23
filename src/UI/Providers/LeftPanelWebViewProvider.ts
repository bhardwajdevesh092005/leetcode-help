import {
  WebviewViewProvider,
  WebviewView,
  Webview,
  Uri,
  EventEmitter,
  window,
  workspace,
  ViewColumn,
  commands,
} from "vscode";
import { exec } from "child_process";
import path from "path";
import * as fs from "fs";
import extractSolutionClassBlock from "../Utils/extractCode";
let run_command = "g++ -std=c++17 -o solution ./solution.cpp && ./solution";
// import * as ReactDOMServer from "react-dom/server";

export class LeftPanelWebview implements WebviewViewProvider {
  constructor(
    private readonly extensionPath: Uri,
    private data: any,
    private _view: any = null,
    private language: string|undefined = "C++"
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

  private async runShellCommandForUser(command:string) {
  try {
    const workspaceFolders = workspace.workspaceFolders;
    if (!workspaceFolders) {
      window.showErrorMessage("Open a folder first to run the code.");
      return;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    exec(command, { cwd: rootPath }, (error, stdout, stderr) => {
      if (error) {
        window.showErrorMessage(`❌ Error: ${stderr}`);
      } else {
        window.showInformationMessage(`✅ Run complete:\n${stdout}`);
      }
    });

  } catch (err: any) {
    window.showErrorMessage("Unexpected error while running command: " + err.message);
  }
}

  private async parseQuestionAndWrieToFile({ title, slug }: { title: string, slug: string }) {
    try{
      this.language = await window.showQuickPick(['C++', 'Java', 'Python'], {
        placeHolder: 'Select a language to parse the question',
      });

      if (!this.language) {
        window.showWarningMessage('No language selected');
        return;
      } 

      const quesApiUri = 'http://localhost:3000/questions/' + slug + '/getCode/' + this.language;

      const res = await fetch(quesApiUri);
      if (!res.ok) {
        console.log(`HTTP error! status: ${res.status}`);
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data:any = await res.json();
      // console.log(data);
      run_command = data.command;
      const workspaceFolder = workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        window.showErrorMessage("No workspace folder found.");
        return;
      }

      const extMap: Record<string, string> = {
        "JavaScript": "js",
        "TypeScript": "ts",
        "Python": "py",
        "Java": "java",
        "C++": "cpp",
      };
      await commands.executeCommand('vscode.setEditorLayout', {
        orientation: 0, // horizontal split (left and right columns)
        groups: [
          { size: 0.75 }, // Left column (main file like solution.cpp)
          {
            size: 0.25, // Right column
            groups: [
              { size: 0.5 }, // Top-right: input.txt
              { size: 0.5 }, // Bottom-right: output.txt
            ]
          }
        ]
      });
      const extension = extMap[this.language] || "txt";
      const fileName = `solution.${extension}`;
      const filePath = path.join(workspaceFolder.uri.fsPath, fileName);
      const inputFileName = "input.txt";
      const inputFilePath = path.join(workspaceFolder.uri.fsPath, inputFileName);
      const outPutFilePath = path.join(workspaceFolder.uri.fsPath, "output.txt");
      fs.writeFileSync(filePath, data.code, "utf8");
      fs.writeFileSync(inputFilePath, data.input, "utf8");
      // fs.writeFileSync(outPutFilePath, "", "utf8");
      const fileUri = Uri.file(filePath);
      const doc = await workspace.openTextDocument(fileUri);
      const mainFile = window.showTextDocument(doc, {
        viewColumn: ViewColumn.One,
        preview: false,
      });

      const inputDoc = await workspace.openTextDocument(Uri.file(inputFilePath));
      const inputEditor = await window.showTextDocument(inputDoc, {
        viewColumn: ViewColumn.Two,
        preview: false,
        preserveFocus: false,
      });

      const outputDoc = await workspace.openTextDocument(Uri.file(outPutFilePath));
      await window.showTextDocument(outputDoc, {
        viewColumn: ViewColumn.Three,
        preview: false,
        preserveFocus: false,
      });

      window.showInformationMessage(`Parsed "${title}" in ${this.language}.`);
    }catch (error) {
      console.error(error);
      window.showErrorMessage("Failed to fetch or write the question data.");
    }
  }

  private async submitCodeToLeetCode() {
    try {
      const workspaceFolder = workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        window.showErrorMessage("No workspace folder found.");
        return;
      }

      const filePath = path.join(workspaceFolder.uri.fsPath, "solution.cpp");
      console.log(filePath);
      if (!fs.existsSync(filePath)) {
        window.showErrorMessage("solution.cpp file not found in the workspace.");
        return;
      }
      const userCode = fs.readFileSync(filePath, "utf8");
      console.log(userCode);
      const solutionClassBlock = extractSolutionClassBlock(userCode,this.language);
      if (!solutionClassBlock) {
        window.showErrorMessage("Solution class not found in the code.");
        return;
      }else{
        console.log(solutionClassBlock);
      }
    }catch(error:any){
      window.showErrorMessage(error);
    }
  }

  private activateMessageListener() {
    this._view.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.action) {
        case "SHOW_WARNING_LOG":
          window.showWarningMessage(message.data.message);
          break;
        case 'PARSE_QUESTION':
          await this.parseQuestionAndWrieToFile(message.data);
          break;
        case 'RUN_CODE':
          await this.runShellCommandForUser(run_command);
          break;
        case 'SUBMIT_CODE':
          await this.submitCodeToLeetCode();
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
      #run_btn{
        background-color:rgb(215, 161, 59);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        margin-bottom: 10px;
        cursor: pointer;
      }
      #run_btn:hover{
        background-color: rgb(162, 239, 95);
      }
      #submit{
        background-color:rgb(148, 223, 78);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        margin-bottom: 10px;
        cursor: pointer;
      } 
      #submit:hover{
        background-color: rgb(243, 191, 89);
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
    <button id = "run_btn"> Run Code </button>
    <button id = "submit"> Submit to LeetCode </button>
    <input
      type="text"
      id="searchBar"
      placeholder="Search problems..."
      style="
        width: 80%;
        padding: 10px;
        margin-bottom: 20px;
        border-radius: 6px;
        border: 1px solid #ccc;
        font-size: 14px;
    /* Optional dark theme support */
        background-color: #1e1e1e;
        color: white;
      "
    />
    <div id="container"></div>
    <script src="${dataUri}"></script>
    <script src="https://cdn.jsdelivr.net/npm/fuse.js@6.6.2"></script>
    <script nonce="" src="${scriptUri}"></script>
  </body>
</html>
`;
  }
}
