import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import { mount, ReactWrapper } from "enzyme";
import { AnyAction, Store } from "redux";
import { IApplicationState, IProject } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import createReduxStore from "../../../../redux/store/store";
import MockFactory from "../../../../common/mockFactory";

jest.mock("../../../../services/projectService");
import ProjectService from "../../../../services/projectService";

jest.mock("../../../../providers/import/importProviderFactory");
import { ImportProviderFactory } from "../../../../providers/import/importProviderFactory";
import ImportPage, { IImportPageProps } from "./importPage";

describe("Import Page", () => {
    const importProviderRegistrations = MockFactory.createImportProviderRegistrations();
    let projectServiceMock: jest.Mocked<typeof ProjectService> = null;

    function createComponent(store, props: IImportPageProps): ReactWrapper<IImportPageProps> {
        return mount(
            <Provider store={store}>
                <Router>
                    <ImportPage {...props} />
                </Router>
            </Provider>,
        );
    }

    beforeAll(() => {
        Object.defineProperty(ImportProviderFactory, "providers", {
            get: jest.fn(() => importProviderRegistrations),
        });
        Object.defineProperty(ImportProviderFactory, "defaultProvider", {
            get: jest.fn(() => importProviderRegistrations[0]),
        });
    });

    beforeEach(() => {
        projectServiceMock = ProjectService as jest.Mocked<typeof ProjectService>;
        projectServiceMock.prototype.load = jest.fn((project) => Promise.resolve(project));
    });

    it("Sets project state from redux store", () => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);
        const importPage = wrapper.find(ImportPage).childAt(0);

        expect(loadProjectSpy).not.toBeCalled();
        expect(importPage.prop("project")).toEqual(testProject);
    });

    it("Sets project state from route params", async (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, false);
        const props = createProps(testProject.id);
        const loadProjectSpy = jest.spyOn(props.actions, "loadProject");

        const wrapper = createComponent(store, props);

        setImmediate(() => {
            const importPage = wrapper.find(ImportPage).childAt(0).instance() as ImportPage;
            expect(importPage.props.project).toEqual(testProject);
            expect(loadProjectSpy).toHaveBeenCalledWith(testProject);
            done();
        });
    });

    it("Calls save project actions on form submit", (done) => {
        const testProject = MockFactory.createTestProject("TestProject");
        const store = createStore(testProject, true);
        const props = createProps(testProject.id);

        const saveProjectSpy = jest.spyOn(props.actions, "saveProject");
        const importProjectSpy = jest.spyOn(props.actions, "importProject");

        ImportProviderFactory.create = jest.fn(() => {
            return {
                import: jest.fn(() => Promise.resolve()),
            };
        });

        projectServiceMock.prototype.save = jest.fn((project) => Promise.resolve(project));

        const wrapper = createComponent(store, props);
        wrapper.find("form").simulate("submit");
        wrapper.update();

        setImmediate(() => {
            expect(saveProjectSpy).toBeCalled();
            expect(importProjectSpy).not.toBeCalled();
            expect(props.history.goBack).toBeCalled();

            const state = store.getState() as IApplicationState;
            expect(state.currentProject.importFormat).not.toBeNull();
            done();
        });
    });
});

function createProps(projectId: string): IImportPageProps {
    return {
        project: null,
        recentProjects: [],
        history: {
            length: 0,
            action: null,
            location: null,
            push: jest.fn(),
            replace: jest.fn(),
            go: jest.fn(),
            goBack: jest.fn(),
            goForward: jest.fn(),
            block: jest.fn(),
            listen: jest.fn(),
            createHref: jest.fn(),
        },
        location: {
            hash: null,
            pathname: null,
            search: null,
            state: null,
        },
        actions: (projectActions as any) as IProjectActions,
        match: {
            params: {
                projectId,
            },
            isExact: true,
            path: `https://localhost:3000/projects/${projectId}/import`,
            url: `https://localhost:3000/projects/${projectId}/import`,
        },
    };
}

function createStore(project: IProject, setCurrentProject: boolean = false): Store<any, AnyAction> {
    const initialState: IApplicationState = {
        currentProject: setCurrentProject ? project : null,
        appSettings: MockFactory.appSettings(),
        connections: [],
        recentProjects: [project],
    };

    return createReduxStore(initialState);
}
