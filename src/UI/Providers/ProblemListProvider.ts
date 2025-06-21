import * as vscode from 'vscode';
import ProblemItem from '../models/ProblemItem';
export default class LeetCodeProblemProvider implements vscode.TreeDataProvider<ProblemItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProblemItem | void>();
  readonly onDidChangeTreeData: vscode.Event<ProblemItem | void> = this._onDidChangeTreeData.event;

  getTreeItem(element: ProblemItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ProblemItem): Thenable<ProblemItem[]> {
    if (!element) {
      // Root nodes (categories)
      return Promise.resolve([
        new ProblemItem('Array', vscode.TreeItemCollapsibleState.Collapsed),
        new ProblemItem('Dynamic Programming', vscode.TreeItemCollapsibleState.Collapsed)
      ]);
    }

    // Children based on category
    if (element.label === 'Array') {
      return Promise.resolve([
        new ProblemItem('Two Sum', vscode.TreeItemCollapsibleState.None, {
          command: 'vscode.open',
          title: 'Open Problem',
          arguments: [vscode.Uri.parse('https://leetcode.com/problems/two-sum')]
        }),
        new ProblemItem('Best Time to Buy and Sell Stock', vscode.TreeItemCollapsibleState.None, {
          command: 'vscode.open',
          title: 'Open Problem',
          arguments: [vscode.Uri.parse('https://leetcode.com/problems/best-time-to-buy-and-sell-stock')]
        })
      ]);
    }

    if (element.label === 'Dynamic Programming') {
      return Promise.resolve([
        new ProblemItem('Climbing Stairs', vscode.TreeItemCollapsibleState.None, {
          command: 'vscode.open',
          title: 'Open Problem',
          arguments: [vscode.Uri.parse('https://leetcode.com/problems/climbing-stairs')]
        })
      ]);
    }

    return Promise.resolve([]);
  }
}