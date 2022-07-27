import { ImportProviderFactory } from "./importProviderFactory";
import { ImportProvider } from "./importProvider";
import { IProject } from "../../models/applicationState";
import MockFactory from "../../common/mockFactory";

describe("Import Provider Factory", () => {
    const testProject: IProject = MockFactory.createTestProject("TestProject");

    it("registers new import providers", () => {
        expect(Object.keys(ImportProviderFactory.providers).length).toEqual(0);
        ImportProviderFactory.register({
            name: "testProvider",
            displayName: "Test Provider",
            factory: (project) => new TestImportProvider(project),
        });
        expect(Object.keys(ImportProviderFactory.providers).length).toEqual(1);
        expect(ImportProviderFactory.providers["testProvider"].displayName).toEqual("Test Provider");
    });

    it("creates a new instance of the provider", () => {
        ImportProviderFactory.register({
            name: "testProvider",
            displayName: "Test Provider",
            factory: (project) => new TestImportProvider(project),
        });
        const provider = ImportProviderFactory.create(
            "testProvider",
            testProject,
            testProject.importFormat.providerOptions,
        );

        expect(provider).not.toBeNull();
        expect(provider).toBeInstanceOf(TestImportProvider);
    });

    it("ensures default is correct", () => {
        expect(Object.keys(ImportProviderFactory.providers).length).toEqual(1);
        ImportProviderFactory.register({
            name: "testProvider2",
            displayName: "Second Test Provider",
            factory: (project) => new TestImportProvider(project),
        });
        ImportProviderFactory.register({
            name: "testProvider3",
            displayName: "Third Test Provider",
            factory: (project) => new TestImportProvider(project),
        });
        expect(Object.keys(ImportProviderFactory.providers).length).toEqual(3);
        expect(ImportProviderFactory.defaultProvider).not.toBeNull();
        expect(ImportProviderFactory.defaultProvider.name).toEqual("testProvider");
        expect(ImportProviderFactory.defaultProvider.displayName).toEqual("Test Provider");

    });

    it("throws error if provider is not found", () => {
        expect(() => ImportProviderFactory.create(
            "unknown",
            testProject,
            testProject.importFormat.providerOptions,
        )).toThrowError();
    });
});

class TestImportProvider extends ImportProvider {
    public project: IProject;

    public import(): Promise<void> {
        throw new Error("Method not implemented.");
    }
}