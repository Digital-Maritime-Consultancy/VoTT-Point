import { ImportProvider } from "./importProvider";
import { IProject, AssetState, IAsset } from "../../models/applicationState";
import { ImportProviderFactory } from "./importProviderFactory";
import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import _ from "lodash";
import registerMixins from "../../registerMixins";
import { AssetProviderFactory } from "../storage/assetProviderFactory";
import { AssetService } from "../../services/assetService";

registerMixins();

describe("Import Provider Base", () => {
    let testProject: IProject = null;
    const testAssets = MockFactory.createTestAssets(10, 1);

    beforeAll(() => {
        AssetProviderFactory.create = jest.fn(() => {
            return {
                getAssets: jest.fn(() => Promise.resolve(testAssets)),
            };
        });

        AssetService.prototype.getAssetMetadata = jest.fn((asset: IAsset) => {
            return {
                asset: { ...asset },
                regions: [],
            };
        });

        testProject = {
            ...MockFactory.createTestProject("TestProject"),
            assets: {
                "asset-1": MockFactory.createTestAsset("1", AssetState.TaggedDot),
                "asset-2": MockFactory.createTestAsset("2", AssetState.TaggedDot),
                "asset-3": MockFactory.createTestAsset("3", AssetState.Visited),
                "asset-4": MockFactory.createTestAsset("4", AssetState.NotVisited),
            },
        };
    });

    it("initializes the asset and storage providers", () => {
        registerProviders();

        ImportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestImportProvider(project),
        });
        const exportProvider = ImportProviderFactory.create("test", testProject) as TestImportProvider;
        const assetProvider = exportProvider.getAssetProvider();
        const storageProvider = exportProvider.getStorageProvider();

        expect(assetProvider).not.toBeNull();
        expect(storageProvider).not.toBeNull();
    });

    it("Imports all frames", async () => {
        registerProviders();

        ImportProviderFactory.register({
            name: "test",
            displayName: "Test DisplayName",
            factory: (project) => new TestImportProvider(project),
        });

        const exportProvider = ImportProviderFactory.create("test", testProject) as TestImportProvider;
        const assetsToImport = await exportProvider.getAssetsForImport();
        expect(assetsToImport.length).toEqual(testAssets.length);
    });
});

class TestImportProvider extends ImportProvider {
    public import(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public getAssetProvider() {
        return this.assetProvider;
    }

    public getStorageProvider() {
        return this.storageProvider;
    }
}
