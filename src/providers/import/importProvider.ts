import Guard from "../../common/guard";
import {
    IProject, IImportFormat, IAssetMetadata, IAsset,
    AssetState, AssetType, IFileInfo, IRegion, RegionType,
} from "../../models/applicationState";
import { IStorageProvider, StorageProviderFactory } from "../storage/storageProviderFactory";
import { IAssetProvider, AssetProviderFactory } from "../storage/assetProviderFactory";
import _ from "lodash";
import { AssetService } from "../../services/assetService";
import IProjectActions from "../../redux/actions/projectActions";
import HtmlFileReader from "../../common/htmlFileReader";

export interface IImportAssetResult {
    asset: IAssetMetadata;
    success: boolean;
    error?: string;
}

export interface IImportResults {
    completed: IImportAssetResult[];
    errors: IImportAssetResult[];
    count: number;
}

/**
 * @name - IImportProvider
 * @description - Defines the required interface for all VoTT import providers
 */
export interface IImportProvider {
    /**
     * Gets or set the project to be imported
     */
    project: IProject;

    /**
     * Imports the configured project for specified import configuration
     */
    import(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<number>;
    /**
     * Pre-check import outcome
     */
    check(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<number>;
    save?(importFormat: IImportFormat): Promise<any>;
}

/**
 * Base class implementation for all VoTT import providers
 * Provides quick access to the configured projects asset & storage providers
 */
export abstract class ImportProvider implements IImportProvider {
    private storageProviderInstance: IStorageProvider;
    private assetProviderInstance: IAssetProvider;
    private assetService: AssetService;

    constructor(public project: IProject) {
        Guard.null(project);
        this.assetService = new AssetService(this.project);
    }

    public abstract import(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<number>;

    public abstract check(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<number>;

    /**
     * Gets the assets that are configured to be imported based on the configured asset state
     */
    public async getAssetsForImport(): Promise<IAssetMetadata[]> {
        let predicate: (asset: IAsset) => boolean = null;

        const getProjectAssets = () => Promise.resolve(_.values(this.project.assets));
        const getAllAssets = async () => {
            const projectAssets = await getProjectAssets();

            return _(projectAssets)
                .concat((await this.assetProvider.getAssets()))
                .uniqBy((asset) => asset.id)
                .value();
        };

        let getAssetsFunc: () => Promise<IAsset[]> = getProjectAssets;

        getAssetsFunc = getAllAssets;
        predicate = () => true;

        return (await getAssetsFunc())
            .filter((asset) => asset.type !== AssetType.Video)
            .filter(predicate)
            .mapAsync(async (asset) => await this.assetService.getAssetMetadata(asset));
    }

    /**
     * Generate regions based on V1 Project asset metadata
     * @param metadata - Asset Metadata from asset created from file path
     * @param regions - Regions
     */
    public addRegions(metadata: IAssetMetadata, regions: IRegion[]): IAssetMetadata {
        regions.forEach((region) => {
            const generatedRegion: IRegion = {
                id: region.id,
                type: RegionType.Rectangle,
                tags: region.tags,
                points: region.points,
                boundingBox: region.boundingBox,
                attributes: region.attributes,
            };
            metadata.regions.push(generatedRegion);
        });
        return metadata;
    }

    /**
     * Creates an asset metadata for the specified asset
     * @param asset The converted v2 asset
     * @param assetState The new v2 asset state
     * @param frameRegions The v1 asset regions
     * @param parent The v2 parent asset (Used for video assets)
     */
    public async createAssetMetadata(
        asset: IAsset,
        assetState: AssetState,
        regions: IRegion[],
        parent?: IAsset,
    ): Promise<IAssetMetadata> {
        const metadata = await this.assetService.getAssetMetadata(asset);
        this.addRegions(metadata, regions);
        metadata.asset.state = assetState;

        if (parent) {
            metadata.asset.parent = parent;
        }

        if (!metadata.asset.size) {
            metadata.asset.size = await HtmlFileReader.readAssetAttributes(asset);
        }

        return metadata;
    }

    /**
     * Gets the storage provider for the current project
     */
    protected get storageProvider(): IStorageProvider {
        if (this.storageProviderInstance) {
            return this.storageProviderInstance;
        }

        this.storageProviderInstance = StorageProviderFactory.create(
            this.project.targetConnection.providerType,
            this.project.targetConnection.providerOptions,
        );

        return this.storageProviderInstance;
    }

    /**
     * Gets the asset provider for the current project
     */
    protected get assetProvider(): IAssetProvider {
        if (this.assetProviderInstance) {
            return this.assetProviderInstance;
        }

        this.assetProviderInstance = AssetProviderFactory.create(
            this.project.sourceConnection.providerType,
            this.project.sourceConnection.providerOptions,
        );

        return this.assetProviderInstance;
    }
}
