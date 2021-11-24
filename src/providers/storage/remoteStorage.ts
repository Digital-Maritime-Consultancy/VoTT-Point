import { IStorageProvider } from "./storageProviderFactory";
import { IAsset, AssetType, StorageType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import axios from "axios";
import { Aborter } from "@azure/storage-blob";

/**
 * Options for Remote Storage
 * @member url - URL for the server
 * @member url4p2r - URL for point to rect service
 * @member accountName - Name of Storage Account
 * @member containerName - Name of targeted container
 * @member createContainer - Option for creating container in `initialize()`
 * @member sas - Shared Access Signature (SAS) token for accessing Azure Blob Storage
 * @member oauthToken - Not yet implemented. Optional token for accessing Azure Blob Storage
 */
export interface IRemoteStorageOptions {
    url: string;
    accountName: string;
    containerName: string;
    createContainer: boolean;
    url4p2r: string;
    sas?: string;
    oauthToken?: string;
}

/**
 * Storage Provider for Azure Blob Storage
 */
export class RemoteStorage implements IStorageProvider {

    /**
     * Storage type
     * @returns - StorageType.Cloud
     */
    public storageType: StorageType = StorageType.Other;
    public assetType: string = 'images';

    constructor(private options?: IRemoteStorageOptions) { }

    /**
     * Initialize connection to Blob Storage account & container
     * If `createContainer` was specified in options, this function
     * creates the container. Otherwise, validates that container
     * is contained in list of containers
     * @throws - Error if container does not exist or not able to
     * connect to Azure Blob Storage
     */
    public async initialize(): Promise<void> {
        const containerName = this.options.containerName;
        if (this.options.createContainer) {
            await this.createContainer(containerName);
        } else {
            const containers = await this.listContainers(null);
            if (containers.indexOf(containerName) === -1) {
                throw new Error(`Container "${containerName}" does not exist`);
            }
        }
    }

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string): Promise<string> {
        /*
        const blockBlobURL = this.getBlockBlobURL(blobName);
        const downloadResponse = await blockBlobURL.download(Aborter.none, 0);

        return await this.bodyToString(downloadResponse);
        */
       return "";
    }

    /**
     * Reads Buffer from specified blob
     * @param blobName - Name of blob in container
     */
    public async readBinary(blobName: string) {
        const text = await this.readText(blobName);
        return Buffer.from(text);
    }

    /**
     * Writes text to blob in container
     * @param blobName - Name of blob in container
     * @param content - Content to write to blob (string or Buffer)
     */
    public async writeText(blobName: string, content: string | Buffer) {

    }

    /**
     * Writes buffer to blob in container
     * @param blobName - Name of blob in container
     * @param content - Buffer to write to blob
     */
    public writeBinary(blobName: string, content: Buffer) {
        return this.writeText(blobName, content);
    }

    /**
     * Deletes file from container
     * @param blobName - Name of blob in container
     */
    public async deleteFile(blobName: string): Promise<void> {

    }

    /**
     * Lists files in container
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Only uses container
     * as specified in Azure Cloud Storage Options. Included to satisfy
     * Storage Provider interface
     * @param ext - Extension of files to filter on when retrieving files
     * from container
     */
    public async listFiles(path: string, ext?: string): Promise<string[]> {
        const result: string[] = [];

        return result;
    }

    /**
     * Lists the containers with in the Azure Blob Storage account
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Lists containers in storage account.
     * Path does not really make sense in this scenario. Included to satisfy interface
     */
    public async listContainers(path: string) {
        const result: string[] = [];

        return result;
    }

    /**
     * Creates container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async createContainer(containerName: string): Promise<void> {
        try {
            await axios.get(this.getAccountUrl())
            .then(res => {
              console.log(res);
            })
        } catch (e) {
            if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return;
            }

            throw e;
        }
    }

    /**
     * Deletes container specified in Azure Cloud Storage options
     * @param containerName - NOT USED IN CURRENT IMPLEMENTATION. Because `containerName`
     * is a required attribute of the Azure Cloud Storage options used to instantiate the
     * provider, this function creates that container. Included to satisfy interface
     */
    public async deleteContainer(containerName: string): Promise<void> {
        //await this.getAccountUrl().delete(Aborter.none);
    }

    /**
     * Retrieves assets from Bing Image Search based on options provided
     */
     public async getAssets(): Promise<IAsset[]> {
        const apiUrl = `${this.getAccountUrl()}/${this.options.containerName}`;

        const response = await axios.get(apiUrl, {
            headers: {
                "Accept": "application/json",
            },
        });

        const items = response.data.value.map((item) => apiUrl + "/" + item.contentUrl);
        
        return items
            .map((filePath) => AssetService.createAssetFromFilePath(filePath))
            .filter((asset) => asset.type !== AssetType.Unknown);
    }

    /**
     *
     * @param url - URL for Azure Blob
     */
    public getFileName(url: string) {
        const pathParts = url.split("/");
        return pathParts[pathParts.length - 1].split("?")[0];
    }

    /**
     * @returns - URL for Azure Blob Storage account with SAS token appended if specified
     */
    public getAccountUrl(): string {
        return this.options.url.endsWith("/")
        ? `${this.options.url}${this.assetType}`
        : `${this.options.url}/${this.assetType}`;
    }

    private getUrl(blobName: string): string {
        return this.getAccountUrl();
    }

    private async bodyToString(
        response: {
            readableStreamBody?: NodeJS.ReadableStream;
            blobBody?: Promise<Blob>;
        },
        // tslint:disable-next-line:variable-name
        _length?: number,
    ): Promise<string> {
        const blob = await response.blobBody!;
        return this.blobToString(blob);
    }

    private async blobToString(blob: Blob): Promise<string> {
        const fileReader = new FileReader();

        return new Promise<string>((resolve, reject) => {
            fileReader.onloadend = (ev: any) => {
                resolve(ev.target!.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsText(blob);
        });
    }
}
