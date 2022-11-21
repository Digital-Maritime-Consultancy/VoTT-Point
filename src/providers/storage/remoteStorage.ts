import { IStorageProvider } from "./storageProviderFactory";
import { IAsset, AssetType, StorageType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";
import axios from "axios";
import connectionJson from "../../assets/defaultConnection.json";
import Guard from "../../common/guard";

const shortid = require('shortid');

/**
 * Options for Remote Storage
 * @member url - URL for the server
 */
export interface IRemoteStorageOptions {
    url: string;
    taskId: string;
    taskServerUrl: string;
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
    public storageType: StorageType = StorageType.Cloud;

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
        const containerName = shortid.generate();
        await this.createContainer(containerName);
    }

    /**
     * Reads text from specified blob
     * @param blobName - Name of blob in container
     */
    public async readText(blobName: string): Promise<string> {
        try {
            const apiUrl = `${this.getUrl()}/${blobName}`;
            const response = await axios.get(apiUrl);
            if (response && response.status === 200) {
                return JSON.stringify(response.data);
            }
        } catch (e) {
            if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return "";
            }
        }
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
        Guard.empty(this.getUrl());

        try {
            const config = { headers: {'Content-Type': 'application/json'} };
            const apiUrl = `${this.getUrl()}/${blobName}`;
            await axios.put(apiUrl, content, config);
        } catch (e) {
            if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return;
            }

            throw e;
        }
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
        Guard.null(blobName);
        Guard.empty(this.getUrl());

        try {
            const apiUrl = `${this.getUrl()}/${blobName}`;
            await axios.delete(apiUrl).catch(() => null);
        } catch (e) {
            if (e.statusCode === 404) {
                alert("Data not found");
                return;
            }
            else if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return;
            }

            throw e;
        }
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
        try {
            const apiUrl = this.getUrl().includes('task') ? `${this.getUrl()}/all` : `${this.getUrl()}`;
            const config = { headers: {"Access-Control-Allow-Origin": "*"} };
            return await axios.get(apiUrl, config)
                .then(response => response ? response.data.map(d => d.uuid ? d.uuid : d.id) : []).catch(e => []);
        } catch (e) {
            if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return [];
            }
        }
        return result;
    }

    /**
     * Lists the containers with in the Azure Blob Storage account
     * @param path - NOT USED IN CURRENT IMPLEMENTATION. Lists containers in storage account.
     * Path does not really make sense in this scenario. Included to satisfy interface
     */
    public async listContainers(path: string) {
        const result = [];

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
            const apiUrl = `${this.getUrl()}`;
            const config = { headers: {"Access-Control-Allow-Origin": "*"} };
            await axios.get(apiUrl, config).then(response => console.log(response)).catch(err => console.log(err));
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
        try {
            const apiUrl = `${this.getUrl()}/${containerName}`;
            await axios.delete(apiUrl);
        } catch (e) {
            if (e.statusCode === 409) {
                alert("Error reaching to the server");
                return;
            }

            throw e;
        }
    }

    /**
     * Retrieves assets from Bing Image Search based on options provided
     */
     public async getAssets(): Promise<IAsset[]> {
        Guard.null(this.options.taskId);

        const apiUrl = `${this.options.taskServerUrl}?uuid=${this.options.taskId}`;

        await axios.get(apiUrl, {
            headers: {
                "Accept": "application/json",
            },
        }).then((response: any) => {
            const items = [];
            const imgServerUrl = connectionJson && connectionJson.providerOptions.imageServerUrl ?
                connectionJson.providerOptions.imageServerUrl : this.getUrl();
            if (response && response.status === 200 && response.data) {
                for (let key in response.data.imageList) {
                    let value = response.data.imageList[key];
                    items.push(`${imgServerUrl}/${value}`);
                }
                return items
                    .map((filePath) => AssetService.createAssetFromFilePath(filePath))
                    .filter((asset) => asset.type !== AssetType.Unknown);
            }
        }).catch(() => alert("Can't connect to Remote storage. Is it active now?"));

        return [];
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
    public getUrl(): string {
        return this.options.url.replace(/\/$/, "");
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
