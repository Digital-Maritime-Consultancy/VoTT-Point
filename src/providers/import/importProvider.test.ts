import { AnnotationImportCheckResult, ImportProvider } from "./importProvider";
import { IProject, AssetState, IAsset, IImportFormat } from "../../models/applicationState";
import { ImportProviderFactory } from "./importProviderFactory";
import MockFactory from "../../common/mockFactory";
import registerProviders from "../../registerProviders";
import _ from "lodash";
import registerMixins from "../../registerMixins";
import { AssetProviderFactory } from "../storage/assetProviderFactory";
import { AssetService } from "../../services/assetService";
import projectActions from "../../redux/actions/projectActions";

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

});

class TestImportProvider extends ImportProvider {
    public import(project: IProject, source: IImportFormat, actions: projectActions): Promise<IProject> {
        throw new Error("Method not implemented.");
    }
    public check(project: IProject, source: IImportFormat): Promise<AnnotationImportCheckResult> {
        throw new Error("Method not implemented.");
    }


    public getAssetProvider() {
        return this.assetProvider;
    }

    public getStorageProvider() {
        return this.storageProvider;
    }
}
