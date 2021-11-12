import { IAssetMetadata, ModelPathType, IActiveLearningSettings, AssetState } from "../models/applicationState";
import { ObjectDetection } from "../providers/activeLearning/objectDetection";
import Guard from "../common/guard";
import { isElectron } from "../common/hostProcess";
import { Env } from "../common/environment";

import axios from 'axios';

export class PointToRectService {
    private connected: boolean = false;

    constructor(private url: string) {
        Guard.null(url);
    }

    public isConnected() {
        return this.connected;
    }

    public async process(assetMetadata: IAssetMetadata): Promise<IAssetMetadata> {
        Guard.null(assetMetadata);

        // If the canvas or asset are invalid return asset metadata
        if (!(assetMetadata.asset && assetMetadata.asset.size)) {
            return assetMetadata;
        }
        // should be calculated
        const predictedRegions = await this.submit(assetMetadata);

        const updatedRegions = [...assetMetadata.regions];
        predictedRegions.forEach((prediction) => {
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
                state: updatedRegions.length > 0 ? AssetState.Tagged : AssetState.Visited,
                predicted: true,
            },
        } as IAssetMetadata;
    }

    public async ensureConnected(): Promise<void> {
        if (this.connected) {
            return Promise.resolve();
        }

        await this.connect()
        .then((response) => {
            if(response.status === 200){
                this.connected = true;
            }
            else {
                this.connected = false;
            }
        })
        .catch((error) => {
            this.connected = false;
        });
    }

    private async connect() {
        return await axios.get(this.url);
    }

    private async submit(body: any) {
        /*
        let modelPath = "";
        if (this.settings.modelPathType === ModelPathType.Coco) {
            if (isElectron()) {
                const appPath = this.getAppPath();

                if (Env.get() !== "production") {
                    modelPath = appPath + "/cocoSSDModel";
                } else {
                    modelPath = appPath + "/../../cocoSSDModel";
                }
            } else {
                modelPath = "https://vott.blob.core.windows.net/coco-ssd-model";
            }
        } else if (this.settings.modelPathType === ModelPathType.File) {
            if (isElectron()) {
                modelPath = this.settings.modelPath;
            }
        } else {
            modelPath = this.settings.modelUrl;
        }
        */
       
        await axios({
            method: 'post',
            url: this.url + '/process',
            data: body,
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(function (response) {
          console.log(response.data.regions);
          return [];
        })
        .catch(function (error) {
          console.log(error);
          return [];
        });
        return [];
    }

    private getAppPath = () => {
        const remote = (window as any).require("electron").remote as Electron.Remote;
        return remote.app.getAppPath();
    }
}
