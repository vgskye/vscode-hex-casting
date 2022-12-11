import * as vscode from "vscode";
import untypedRegistry from "./data/registry.json";

interface PatternInfo {
    name: string;
    modName: string;
    image: {
        filename: string;
        height: number;
        width: number;
    } | null;
    direction: string | null;
    pattern: string | null;
    args: string | null;
    url: string | null;
}

const rootSection = "hex-casting";

const output = vscode.window.createOutputChannel("Hex Casting");
let appendNewline = vscode.workspace.getConfiguration(rootSection).get<boolean>("appendNewline")!;

const selector: vscode.DocumentSelector = [
    { scheme: "file", language: "hexcasting" },
    { scheme: "untitled", language: "hexcasting" },
];

const registry: { [translation: string]: PatternInfo } = untypedRegistry;

const themePaths = {
    [vscode.ColorThemeKind.Dark]: "dark/",
    [vscode.ColorThemeKind.HighContrast]: "dark/",
    [vscode.ColorThemeKind.HighContrastLight]: "light/",
    [vscode.ColorThemeKind.Light]: "light/",
};

// maxImageSize overrides maxImageHeight
function makeDocumentation(
    translation: string,
    { modName, image, direction, pattern, url }: PatternInfo,
    maxImageWidth?: number,
    maxImageHeight?: number,
): vscode.MarkdownString {
    let result = new vscode.MarkdownString(
        url != null ? `**[${translation}](${url})**` : `**${translation}**`,
    ).appendMarkdown(` (${modName})`);

    const { kind: themeKind } = vscode.window.activeColorTheme;
    // this feels sketchy. is there a better way to do this?
    result.baseUri = vscode.Uri.file(__dirname.replace(/out$/, "") + "images/patterns/" + themePaths[themeKind]);
    result.supportHtml = true;

    if (image != null) {
        const { filename, width, height } = image;
        maxImageWidth = Math.min(width, maxImageWidth ?? width);
        maxImageHeight = Math.min(height, maxImageHeight ?? height);

        let sizedWidth = maxImageWidth;
        let sizedHeight = (maxImageWidth * height) / width;

        if (sizedHeight > maxImageHeight) {
            sizedWidth = (maxImageHeight * width) / height;
            sizedHeight = maxImageHeight;
        }

        const style = `width="${sizedWidth}" height="${sizedHeight}"`;

        result = result.appendMarkdown(`\n\n<img src="${filename}" alt="Stroke order for ${translation}" ${style}/>`);
    }

    if (direction != null && pattern != null) result = result.appendMarkdown(`\n\n\`${direction} ${pattern}\``);

    return result;
}

function makeCompletionItem(translation: string, hasParam: boolean, patternInfo?: PatternInfo): vscode.CompletionItem {
    patternInfo = patternInfo ?? registry[translation];
    const { name, args } = patternInfo;

    return {
        label: {
            label: translation,
            description: name,
        },
        detail: args ?? undefined,
        documentation: makeDocumentation(translation, patternInfo, 300, 300),
        kind: vscode.CompletionItemKind.Function,
        insertText: translation + (hasParam ? ": " : appendNewline ? "\n" : ""),
    };
}

function makeCompletionItems(
    translation: string,
    hasParam: boolean,
    patternInfo?: PatternInfo,
): vscode.CompletionItem[] {
    patternInfo = patternInfo ?? registry[translation];
    const { name } = patternInfo;

    const base = makeCompletionItem(translation, hasParam, patternInfo);
    return [base, { ...base, filterText: name, sortText: "~" + translation }];
}

function makeCompletionList(): vscode.CompletionItem[] {
    return Object.entries(registry)
        .filter(([name]) => name != "escape")
        .flatMap<vscode.CompletionItem>(([translation, patternInfo]) =>
            makeCompletionItems(translation, ["mask", "number"].includes(patternInfo.name), patternInfo),
        );
}

let completionList: vscode.CompletionItem[] = makeCompletionList();

function shouldSkipCompletions(line: string): boolean {
    return /\S\s/.test(line.replace("Consideration:", ""));
}

class PatternCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext,
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        const lineStart = position.with({ character: 0 });
        const rangeStart = document.getWordRangeAtPosition(position)?.start ?? position;
        const line = document.getText(new vscode.Range(lineStart, rangeStart));
        if (shouldSkipCompletions(line)) return;

        return [...completionList, ...makeCompletionItems("Consideration", !line.includes("Consideration:"))];
    }
}

class SpecialCompletionItemProvider implements vscode.CompletionItemProvider {
    constructor(public translation: string, public regex: RegExp) {}

    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext,
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        const range = document.getWordRangeAtPosition(position, this.regex);
        if (range === undefined) return;

        const lineStart = position.with({ character: 0 });
        const line = document.getText(new vscode.Range(lineStart, range.start));
        if (shouldSkipCompletions(line)) return;

        const text = document.getText(range);
        const label = `${this.translation}: ${text}`;
        const patternInfo = registry[this.translation];

        return [
            {
                ...makeCompletionItem(label, false, patternInfo),
                kind: undefined,
                range,
                preselect: true,
                filterText: text,
                insertText: label + (appendNewline ? "\n" : ""),
            },
        ];
    }
}

class PatternHoverProvider implements vscode.HoverProvider {
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
    ): vscode.ProviderResult<vscode.Hover> {
        const range = document.getWordRangeAtPosition(position);
        if (range === undefined) return;

        const translation = document
            .getText(range)
            .replace(/(?<=Bookkeeper's Gambit):\s*[v-]+|(?<=Numerical Reflection):\s*-?[0-9]+/, "")
            .trim();
        if (!(translation in registry)) return;

        const patternInfo = registry[translation];
        const { args } = patternInfo;

        return {
            contents: [
                ...(args ? [new vscode.MarkdownString(args)] : []),
                makeDocumentation(translation, patternInfo, undefined, 180),
            ],
        };
    }
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            selector,
            new PatternCompletionItemProvider(),
            ..."abcdefghijklmnopqrstuvwxyz0123456789\\", // \ is just so the consideration snippet will trigger
        ),
        vscode.languages.registerCompletionItemProvider(
            selector,
            new SpecialCompletionItemProvider("Numerical Reflection", /-?\d+/),
            ..."-0123456789",
        ),
        vscode.languages.registerCompletionItemProvider(
            selector,
            new SpecialCompletionItemProvider("Bookkeeper's Gambit", /[v\-]+/),
            ..."v-",
        ),
        vscode.languages.registerHoverProvider(selector, new PatternHoverProvider()),
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration("hex-casting.appendNewline")) {
                appendNewline = vscode.workspace.getConfiguration(rootSection).get<boolean>("appendNewline")!;
                completionList = makeCompletionList();
            }
        }),
        vscode.window.onDidChangeActiveColorTheme((e) => {
            completionList = makeCompletionList();
        }),
    );
}

export function deactivate() {}
