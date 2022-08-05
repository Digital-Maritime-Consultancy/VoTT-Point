import { AssetState } from './../../models/applicationState';
import _ from "lodash";
import { IFileInfo, IImportFormat, IProject, IProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import { constants } from "../../common/constants";
import HtmlFileReader from "../../common/htmlFileReader";
import { AnnotationImportCheckResult, ImportProvider } from "./importProvider";
import { createNewAssetMetadata, fetchImageInfo, fetchTagInfo } from "./cvatXmlToAssetConverter";
import { addRegions, createAssetMetadata } from "./projectImporter";
import { AssetService } from "../../services/assetService";
import IProjectActions from '../../redux/actions/projectActions';

const XMLParser = require("react-xml-parser");

/**
 * CVAT Xml Import Provider options
 */
export interface ICvatXmlImportProviderOptions extends IProviderOptions {
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

    public async check(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<AnnotationImportCheckResult> {
        Guard.null(project);

        if (!file) {
            return AnnotationImportCheckResult.NotValid;
        }
        const projectAssets = await actions.loadAssets(project);
        const xml = new XMLParser().parseFromString(file.content);
        const assetMetadata = fetchImageInfo(xml);
        return projectAssets.filter(asset =>
            assetMetadata.filter(afi =>
                decodeURIComponent(asset.name) === decodeURIComponent(afi["name"])
                ).length).length > 0 ?
                AnnotationImportCheckResult.Valid :
                AnnotationImportCheckResult.NoImageMatched;
    }

    /**
     * Import project to VoTT JSON format
     */
    public async import(project: IProject, file: IFileInfo, actions: IProjectActions): Promise<IProject> {
        Guard.null(project);
        const result = await this.check(project, file, actions);
        if (result === AnnotationImportCheckResult.Valid) {
            try {
                const xml = new XMLParser().parseFromString(file.content);
                const projectAssets = await actions.loadAssets(project);
                const assetsToBeImported = createNewAssetMetadata(xml, projectAssets);
                const originalAssets = await this.getAssetsForImport();

                // insert tags to project
                const tags = fetchTagInfo(xml);
                tags.forEach(tag => project.tags.filter(t => t.name === tag.name).length === 0 &&
                    project.tags.push(tag));

                console.log(assetsToBeImported);
                assetsToBeImported.forEach(asset => {
                    let found = false;
                    console.log(asset);
                    // investigate the original assets to integrate imported regions into
                    originalAssets.forEach(async originalAsset => {
                        if (asset.asset.name === originalAsset.asset.name) {
                            originalAsset = addRegions(originalAsset, asset.regions);
                            await actions.saveAssetMetadata(project, originalAsset);
                            found = true;
                        }
                    });
                    // there are cases of images without asset metadata (not stored as files)
                    if (!found) {
                        // in this case it should be still in the scope of the project
                        const projectAssets = _.values(project.assets);
                        projectAssets.forEach(async assetInProject => {
                            if (assetInProject && assetInProject.name === asset.asset.name) {
                                // in such case we will create a metadata with given regions
                                const assetMetadata =
                                    await createAssetMetadata(
                                        assetInProject,
                                        AssetState.TaggedRectangle,
                                        asset.regions);
                                await actions.saveAssetMetadata(project, assetMetadata);
                            }
                        });
                    }
                });
            } catch (e) {
                throw new Error(e.message);
            }
        }

        return project;
    }
}
