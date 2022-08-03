import shortid from "shortid";
import { IAssetMetadata, IRegion, ITag, RegionType } from "../../models/applicationState";
import { AssetService } from "../../services/assetService";

export function fetchTagInfo(xml: XMLDocument) {
    const tags = Array.from(xml.getElementsByTagName('labels')[0].children).map(element => 
        { return { name: element.getElementsByTagName('name')[0]['value'],
            color: element.getElementsByTagName('color')[0]['value']
        } as ITag;}
    );
    return tags;
}

export function fetchImageInfo(xml: XMLDocument): object {
    return Array.from(xml.getElementsByTagName('image')).map(element => element.attributes );
}

export function fetchAssetInfo(xml: XMLDocument): IAssetMetadata[] {
    const filePath = "";
    return Array.from(xml.getElementsByTagName('image'))
        .map((element: Element) => {
            const regions = [];
            Array.from(element.children)
                .forEach((tag: Element) => regions.push(fetchAnnotationInfo(tag)))
            const asset = AssetService.createAssetFromFilePath(filePath + '/' + element.attributes['name']);
            return {
                asset,
                regions,
            } as IAssetMetadata;
        });
}

export function fetchAnnotationInfo(tagElement: Element): IRegion {
    const xbr = parseFloat(tagElement.attributes["xbr"]);
    const ybr = parseFloat(tagElement.attributes["ybr"]);
    const xtl = parseFloat(tagElement.attributes["xtl"]);
    const ytl = parseFloat(tagElement.attributes["ytl"]);
    return {
        id: shortid.generate(),
        type: RegionType.Rectangle,
        tags: [tagElement.attributes["label"]],
        points: [
            {
                x: xbr,
                y: ybr,
            },
            {
                x: xbr,
                y: ytl,
            },
            {
                x: xtl,
                y: ytl,
            },
            {
                x: xtl,
                y: ybr,
            },
        ],
        boundingBox: {
            height: ybr - ytl,
            width: xbr - xtl,
            left: xtl,
            top: ytl,
        },
    };
}