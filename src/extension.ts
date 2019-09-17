"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as cp from 'child_process';

var neoVimSyncLoggingEnabled = false;

export function dumpInConsole(msg: string) {
    if (neoVimSyncLoggingEnabled) {
        console.log(msg);
    }
}

let stdout: string, stderr: string, error: Error | null;
///managed build now only support to invoke on save
export function touchFile(swiftBinPath: string, params: string[]) {
    stdout = "";
    stderr = "";
    error = null;
    const sb = cp.spawn(swiftBinPath, params, { shell: true });
    sb.stdout.on("out", data => {
        stdout += data;
        dumpInConsole("***nvim sync data*** " + data);
    });
    sb.stderr.on("data", data => {
        stderr += data;
        dumpInConsole("***nvim sync err***" + data);
    });
    sb.on("error", function(err: Error) {
        dumpInConsole("***nvim sync error*** " + err.message);
        error = err;
    });

    sb.on("exit", function(code, signal) {
        dumpInConsole(`***nvim sync exited*** code: ${code}, signal: ${signal}`);
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate({ subscriptions }: vscode.ExtensionContext) {

    let lastChangedFile: string = "";

    // When a file changes get the name from `filepath`
    const thing = vscode.workspace.onDidChangeTextDocument((filepath) => {
        // if enabled is not defined or false then don't do anything...
        const isEnabled: boolean | undefined = vscode.workspace.getConfiguration().get("NeoVimSync.enabled");
        const nvimLocation: string | undefined = vscode.workspace.getConfiguration().get("NeoVimSync.nvimLocation");
        const loggingEnabled: boolean | undefined  = vscode.workspace.getConfiguration().get("NeoVimSync.loggingEnabled");
        if (loggingEnabled != undefined) {
            neoVimSyncLoggingEnabled = loggingEnabled
        }

        dumpInConsole("NeoVimSync didChange: " + filepath);

        if (!isEnabled) {
            dumpInConsole("NeoVimSync disabled");
            return;
        } else if (!nvimLocation) {
            vscode.window.showInformationMessage("No nvim location in settings: Set `NeoVimSync.nvimLocation`");
            return;
        }

        // Get file name
        const splitFilePath = filepath.document.fileName.split("\\");
        const fileName = splitFilePath[splitFilePath.length-1];
        
        // If we're not equal to what was stored last time save name of the file.
        if (fileName !== lastChangedFile) {
            dumpInConsole("NeoVimSync touch: " + fileName);
            touchFile("/usr/local/bin/nvim", ["--noplugin", "--headless", "+q!", fileName]);
            lastChangedFile = fileName;
        }
    });

    subscriptions.push(thing);
}

// this method is called when your extension is deactivated
export function deactivate() {
    dumpInConsole("NeoVimSync deactivate");
}
