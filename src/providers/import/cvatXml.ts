import { AssetState, IAsset } from './../../models/applicationState';
import _ from "lodash";
import { IFileInfo, IImportFormat, IProject, IProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import { ImportProvider } from "./importProvider";
import { createNewAssetMetadata, fetchImageInfo, fetchTagInfo } from "./cvatXmlToAssetConverter";
import IProjectActions from '../../redux/actions/projectActions';

const XMLParser = require("react-xml-parser");

/**
 * CVAT Xml Import Provider options
 */
export interface ICvatXmlImportProviderOptions extends IProviderOptions {
}


export function compareFileName(a: string, b: string):boolean {
    return decodeURIComponent(a) === decodeURIComponent(b);
}
/**
 * @name - CVAT Xml Import Provider
 * @description - Imports annotations from a single XML file of CVAT
 */
export class CvatXmlImportProvider extends ImportProvider {
    constructor(project: IProject, options: ICvatXmlImportProviderOptions) {
        super(project);
        Guard.null(options);
    }

    public async check(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<number> {
        Guard.null(project);

        if (!file) {
            return -1;
        }
        const projectAssets = await actions.loadAssets(project);
        const xml = new XMLParser().parseFromString(file.content);
        const assetMetadata = fetchImageInfo(xml);
        return projectAssets.filter(asset =>
            assetMetadata.filter(afi =>
                compareFileName(asset.name, afi["name"])
                ).length).length;
    }

    /**
     * Import project to VoTT JSON format
     */
    public async import(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<IProject> {
        Guard.null(project);
        const projectAssets = await actions.loadAssets(project);
        const importedAssetNames = new Set();
        const result = await this.check(project, file, actions);
        if (result > 0) {
            try {
                const xml = new XMLParser().parseFromString(file.content);
                const assetsToBeImported = createNewAssetMetadata(xml, projectAssets);
                const originalAssets = await this.getAssetsForImport();

                // insert tags to project
                const tags = fetchTagInfo(xml);
                tags.forEach(tag => project.tags.filter(t => t.name === tag.name).length === 0 &&
                    project.tags.push(tag));

                assetsToBeImported.forEach(asset => {
                    let found = false;
                    // investigate the original assets to integrate imported regions into
                    originalAssets.forEach(async originalAsset => {
                        if (!found && asset && asset.asset.name === originalAsset.asset.name) {
                            originalAsset = this.addRegions(originalAsset, asset.regions);
                            importedAssetNames.add(originalAsset.asset.name);
                            await actions.saveAssetMetadata(project, originalAsset);
                            found = true;
                        }
                    });
                    // there are cases of images without asset metadata (not stored as files)
                    if (!found && asset) {
                        // in this case it should be still in the scope of the project
                        projectAssets.forEach(async assetInProject => {
                            if (assetInProject && assetInProject.name === asset.asset.name) {
                                // in such case we will create a metadata with given regions
                                importedAssetNames.add(asset.asset.name);
                                const assetMetadata =
                                    await this.createAssetMetadata(
                                        assetInProject,
                                        AssetState.TaggedRectangle,
                                        asset.regions);
                                await actions.saveAssetMetadata(project, assetMetadata);
                                assetInProject.state = AssetState.TaggedRectangle;
                            }
                        });
                    }
                });
            } catch (e) {
                throw new Error(e.message);
            }
        } else {
            return undefined;
        }

        // update project asset's state if it has been updated
        const updatedAssets = projectAssets.map(asset =>
            Array.from(importedAssetNames.values()).filter
                ((a: string) => compareFileName(a, asset.name)).length > 0 ?
            {...asset, state: asset.state < AssetState.TaggedRectangle ?
                AssetState.TaggedRectangle : asset.state }
            : asset );
        let assetsDict = {};
        updatedAssets.forEach(asset => assetsDict[asset.id] = asset);
        return {...project, assets: assetsDict};
    }
}
