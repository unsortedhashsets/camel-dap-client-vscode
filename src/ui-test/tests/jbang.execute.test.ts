import * as path from 'path';
import {
    ActivityBar,
    after,
    before,
    EditorView,
    SideBarView,
    ViewControl,
    ViewSection,
    VSBrowser,
    WebDriver,
} from 'vscode-uitests-tooling';
import {
    CAMEL_ROUTE_YAML_WITH_SPACE,
    CAMEL_RUN_ACTION_LABEL,
    CAMEL_RUN_DEBUG_ACTION_LABEL,
    waitUntilTerminalHasText,
    TEST_ARRAY_RUN,
    TEST_ARRAY_RUN_DEBUG,
    disconnectDebugger,
    killTerminal,
    executeCommandInContextMenu,
    executeCommand,
} from '../utils';

describe('JBang commands execution', function () {
    this.timeout(240000);

    let editorView: EditorView;
    let driver: WebDriver;

    before('Before setup', async function () {
        driver = VSBrowser.instance.driver;
    });

    after('After cleanup', async function () {
        await new EditorView().closeAllEditors();
    });

    beforeEach('Before each test', async function () {
        await (await new ActivityBar().getViewControl('Explorer') as ViewControl).openView();
        await VSBrowser.instance.openResources(path.resolve('src', 'ui-test', 'resources'));
        await VSBrowser.instance.waitForWorkbench();

        const section = await new SideBarView().getContent().getSection('resources') as ViewSection;
        await section.openItem(CAMEL_ROUTE_YAML_WITH_SPACE);

        editorView = new EditorView();
        await driver.wait(async function () {
            return (await editorView.getOpenEditorTitles()).find(title => title === CAMEL_ROUTE_YAML_WITH_SPACE);
        }, 5000);
    });

    afterEach('After each test', async function () {
        await killTerminal();
    });

    it(`Execute command '${CAMEL_RUN_ACTION_LABEL}' in command palette`, async function () {
        await executeCommand(CAMEL_RUN_ACTION_LABEL);
        await waitUntilTerminalHasText(driver, TEST_ARRAY_RUN);
    });

    it(`Execute command '${CAMEL_RUN_DEBUG_ACTION_LABEL}' in command palette`, async function () {
        await executeCommand(CAMEL_RUN_DEBUG_ACTION_LABEL);
        await waitUntilTerminalHasText(driver, TEST_ARRAY_RUN_DEBUG);
        await (await new ActivityBar().getViewControl('Run and Debug') as ViewControl).closeView();
        await disconnectDebugger(driver);
    });

    (process.platform === 'darwin' ? it.skip : it)(`Execute command '${CAMEL_RUN_ACTION_LABEL}' in context menu`, async function () {
        await executeCommandInContextMenu(CAMEL_RUN_ACTION_LABEL, CAMEL_ROUTE_YAML_WITH_SPACE);
        await waitUntilTerminalHasText(driver, TEST_ARRAY_RUN);
    });

    (process.platform === 'darwin' ? it.skip : it)(`Execute command '${CAMEL_RUN_DEBUG_ACTION_LABEL}' in context menu`, async function () {
        await executeCommandInContextMenu(CAMEL_RUN_DEBUG_ACTION_LABEL, CAMEL_ROUTE_YAML_WITH_SPACE);
        await waitUntilTerminalHasText(driver, TEST_ARRAY_RUN_DEBUG);
        await (await new ActivityBar().getViewControl('Run and Debug') as ViewControl).closeView();
        await disconnectDebugger(driver);
    });
});
