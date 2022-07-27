import _ from "lodash";
import { IProject, IProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import { constants } from "../../common/constants";
import HtmlFileReader from "../../common/htmlFileReader";
import { ImportProvider } from "./importProvider";

/**
 * CVAT Xml Import Provider options
 */
export interface ICvatXmlImportProviderOptions extends IProviderOptions {
    /** Whether or not to include binary assets in target connection */
    includeImages: boolean;
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

    /**
     * Import project to VoTT JSON format
     */
    public async import(): Promise<void> {
        const results = await this.getAssetsForImport();

        const exportObject = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id) as any;

        // We don't need these fields in the export JSON
        delete exportObject.sourceConnection;
        delete exportObject.targetConnection;
        delete exportObject.exportFormat;

        const fileName = `${this.project.name.replace(/\s/g, "-")}${constants.exportFileExtension}`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
    }
}
