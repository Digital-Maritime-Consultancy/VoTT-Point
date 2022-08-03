import _ from "lodash";
import { IFileInfo, IProject, IProviderOptions } from "../../models/applicationState";
import Guard from "../../common/guard";
import { constants } from "../../common/constants";
import HtmlFileReader from "../../common/htmlFileReader";
import { ImportProvider } from "./importProvider";

const XMLParser = require("react-xml-parser");

/**
 * CVAT Xml Import Provider options
 */
export interface ICvatXmlImportProviderOptions extends IProviderOptions {
    imageFolderPath: string;
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
    public async import(fileText: IFileInfo): Promise<void> {
        try {
            const xml = new XMLParser().parseFromString(fileText.content);
            console.log(xml);
            
        } catch (e) {
            throw new Error(e.message);
        }
        /*
        const results = await this.getAssetsForImport();

        const exportObject = { ...this.project };
        exportObject.assets = _.keyBy(results, (assetMetadata) => assetMetadata.asset.id) as any;

        // We don't need these fields in the export JSON
        delete exportObject.sourceConnection;
        delete exportObject.targetConnection;
        delete exportObject.exportFormat;

        const fileName = `${this.project.name.replace(/\s/g, "-")}${constants.xmlFileExtention}`;
        await this.storageProvider.writeText(fileName, JSON.stringify(exportObject, null, 4));
        */
    }
}
