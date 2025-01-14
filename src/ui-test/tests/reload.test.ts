import * as path from 'path';
import {
    ActivityBar,
    after,
    before,
    EditorView,
    SideBarView,
    VSBrowser,
    WebDriver,
    resources,
    workspaces
} from 'vscode-uitests-tooling';
import {
    CAMEL_RUN_ACTION_LABEL,
    waitUntilTerminalHasText,
    TEST_ARRAY_RUN,
    executeCommand,
    killTerminal,
    TEST_MESSAGE,
    CAMEL_ROUTE_YAML_WITH_SPACE,
    CAMEL_ROUTE_YAML_WITH_SPACE_COPY,
    replaceTextInCodeEditor,
    DEFAULT_BODY,
    TEST_BODY,
    DEFAULT_HEADER,
    TEST_HEADER,
    DEFAULT_PROPERTY,
    TEST_PROPERTY,
    clearTerminal,
} from '../utils';

describe('Jbang commands with automatic reload', function () {
    this.timeout(300000);

    let driver: WebDriver;
    let resourceManager: resources.IResourceManager;

    before(async function () {
        driver = VSBrowser.instance.driver;

        resourceManager = resources.createResourceManager(
            VSBrowser.instance,
            workspaces.createWorkspace(VSBrowser.instance, 'src/ui-test/resources'),
            'src/ui-test/resources'
        );
        await resourceManager.copy(CAMEL_ROUTE_YAML_WITH_SPACE, CAMEL_ROUTE_YAML_WITH_SPACE_COPY);

        await VSBrowser.instance.openResources(path.resolve('src', 'ui-test', 'resources'));

        await (await new ActivityBar().getViewControl('Explorer')).openView();

        const section = await new SideBarView().getContent().getSection('resources');
        await section.openItem(CAMEL_ROUTE_YAML_WITH_SPACE_COPY);

        const editorView = new EditorView();
        await driver.wait(async function () {
            return (await editorView.getOpenEditorTitles()).find(title => title === CAMEL_ROUTE_YAML_WITH_SPACE_COPY);
        }, 5000);

        await executeCommand(CAMEL_RUN_ACTION_LABEL);
        await waitUntilTerminalHasText(driver, TEST_ARRAY_RUN);
    });

    after(async function () {
        await killTerminal();
        await new EditorView().closeAllEditors();
        // Necessary try block to avoid "EBUSY" error on windows instances 
        // File can be hold by the Java process for a bit more time
        await driver.wait(async () => {
            try {
                return await resourceManager.delete(CAMEL_ROUTE_YAML_WITH_SPACE_COPY) === undefined;
            } catch {
                return false;
            }
        }, 60000);
    });

    beforeEach(async function () {
        await clearTerminal();
    });

    it(`Replace body with automatic reload`, async function () {
        await driver.wait(async () => { return await replaceTextInCodeEditor(DEFAULT_BODY, TEST_BODY); }, 60000);

        await waitUntilTerminalHasText(driver, [`${DEFAULT_HEADER}: ${TEST_BODY} ${DEFAULT_PROPERTY}`]);
    });

    it(`Replace header with automatic reload`, async function () {
        await driver.wait(async () => { return await replaceTextInCodeEditor(DEFAULT_HEADER, TEST_HEADER); }, 60000);

        await waitUntilTerminalHasText(driver, [`${TEST_HEADER}: ${TEST_BODY} ${DEFAULT_PROPERTY}`]);
    });

    it(`Replace Exchange Property with automatic reload`, async function () {
        await driver.wait(async () => { return await replaceTextInCodeEditor(DEFAULT_PROPERTY, TEST_PROPERTY); }, 60000);

        await waitUntilTerminalHasText(driver, [TEST_MESSAGE]);
    });
});
