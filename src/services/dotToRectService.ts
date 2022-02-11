import { IAssetMetadata, ModelPathType, IActiveLearningSettings, AssetState } from "../models/applicationState";
import { ObjectDetection } from "../providers/activeLearning/objectDetection";
import Guard from "../common/guard";
import { isElectron } from "../common/hostProcess";
import { Env } from "../common/environment";

import axios from 'axios';
import { reject } from "lodash";

export class DotToRectService {
    private connected: boolean = false;

    constructor(private url: string) {
        Guard.null(url);
    }

    public async isConnected() {
        return this.connected;
    }

    public async process(assetMetadata: IAssetMetadata): Promise<IAssetMetadata> {
        Guard.null(assetMetadata);

        // If the canvas or asset are invalid return asset metadata
        if (!(assetMetadata.asset && assetMetadata.asset.size)) {
            return assetMetadata;
        }
        // should be calculated
        const predicted = await this.submit(assetMetadata);
        
        if (predicted && predicted.regions) {
            // update the one with the same ID blindly
            const updatedRegions = assetMetadata.regions.map(region => 
                predicted.regions.find(r => r.id === region.id ) ?
                    predicted.regions.find(r => r.id === region.id ) : region);
            
            predicted.regions.forEach((prediction) => {
                const matchingRegion = updatedRegions.find((region) => {
                    return region.boundingBox
                        && region.boundingBox.left === prediction.boundingBox.left
                        && region.boundingBox.top === prediction.boundingBox.top
                        && region.boundingBox.width === prediction.boundingBox.width
                        && region.boundingBox.height === prediction.boundingBox.height;
                });
                if (updatedRegions.length === 0 || !matchingRegion) {
                    updatedRegions.push(prediction);
                }
            });
    
            return {
                ...assetMetadata,
                regions: updatedRegions,
                asset: {
                    ...assetMetadata.asset,
                    state: updatedRegions.length >= assetMetadata.regions.length ?
                        AssetState.TaggedRectangle : AssetState.TaggedDot,
                },
            } as IAssetMetadata;
        }
    }

    public async ensureConnected(): Promise<boolean> {
        return await new Promise<boolean>((resolve, reject) => {
            this.connect()
            .then((response) => {
                if (response.status === 200) {
                    this.connected = true;
                    resolve(true);
                }
                else {
                    this.connected = false;
                    reject("Problem with server connection - " + response.status);
                }
            })
            .catch((error) => {
                this.connected = false;
                reject("Server connection failed");
            });
        });
    }

    private async connect() {
        return await axios.get(this.url);
    }

    private async submit(body: IAssetMetadata): Promise<IAssetMetadata> {
        return await axios({
            method: 'post',
            url: this.url + '/process',
            data: body,
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(function (response) {
                return response.data;
            })
            .catch(function (error) {
                console.log(error);
                return [];
            });
    }

    private getAppPath = () => {
        const remote = (window as any).require("electron").remote as Electron.Remote;
        return remote.app.getAppPath();
    }
}
