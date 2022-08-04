import HtmlFileReader from "../../common/htmlFileReader";
import { AssetState, IAsset, IAssetMetadata, IRegion, RegionType } from "../../models/applicationState";

/**
 * Generate regions based on V1 Project asset metadata
 * @param metadata - Asset Metadata from asset created from file path
 * @param regions - Regions
 */
export function addRegions(metadata: IAssetMetadata, regions: IRegion[]): IAssetMetadata {
    regions.forEach((region) => {
        const generatedRegion: IRegion = {
            id: region.id,
            type: RegionType.Rectangle,
            tags: region.tags,
            points: region.points,
            boundingBox: region.boundingBox,
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
export async function createAssetMetadata(
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