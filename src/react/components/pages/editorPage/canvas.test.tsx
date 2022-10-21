import { mount, ReactWrapper } from "enzyme";
import React from "react";
import { RegionType } from "vott-react";
import MockFactory from "../../../../common/mockFactory";
import { EditorMode, IAssetMetadata, IRegion, IAsset } from "../../../../models/applicationState";
import { AssetPreview, IAssetPreviewProps } from "../../common/assetPreview/assetPreview";
import Canvas, { ICanvasProps } from "./canvas";
import CanvasHelpers from "./canvasHelpers";
import { appInfo } from "../../../../common/appInfo";

jest.mock("@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/CanvasTools.Editor");

jest.mock("@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Region/RegionsManager");
import Confirm, { IConfirmProps } from "../../common/confirm/confirm";
import { SelectionMode } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import { Editor } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/CanvasTools.Editor";
import { RegionsManager } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Region/RegionsManager";
import { Rect } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Core/Rect";

describe("Editor Canvas", () => {
    function createComponent(canvasProps?: ICanvasProps, assetPreviewProps?: IAssetPreviewProps)
        : ReactWrapper<ICanvasProps, Canvas> {
        const props = createProps();
        const cProps = canvasProps || props.canvas;
        const aProps = assetPreviewProps || props.assetPreview;
        return mount(
            <Canvas {...cProps}>
                <AssetPreview {...aProps} />
            </Canvas>,
        );
    }

    function getAssetMetadata() {
        const asset: IAsset = {
            ...MockFactory.createTestAsset(),
            size: {
                width: 1600,
                height: 1200,
            },
        };
        return MockFactory.createTestAssetMetadata(asset, MockFactory.createTestRegions());
    }

    function createProps() {
        const canvasProps: ICanvasProps = {
            selectedAsset: getAssetMetadata(),
            onAssetMetadataChanged: jest.fn(),
            onCanvasRendered: jest.fn(),
            editorMode: EditorMode.Rectangle,
            selectedRegions: [],
            project: MockFactory.createTestProject(),
            lockedTags: [],
            initialWorkData: {zoomScale: 1, screenPos: {left: 0, top: 0}},
        };

        const assetPreviewProps: IAssetPreviewProps = {
            asset: getAssetMetadata().asset,
        };

        return {
            canvas: canvasProps,
            assetPreview: assetPreviewProps,
        };
    }

    const copiedRegion = MockFactory.createTestRegion("copiedRegion");

    const editorMock = Editor as any;

    beforeAll(() => {
        let selectionMode = {
            mode: SelectionMode.NONE,
            template: null,
        };

        editorMock.prototype.addContentSource = jest.fn(() => Promise.resolve());
        editorMock.prototype.scaleRegionToSourceSize = jest.fn((regionData: any) => regionData);
        editorMock.prototype.RM = new RegionsManager(null, null);
        editorMock.prototype.AS = {
            enable: jest.fn(),
            disable: jest.fn(),
            setSelectionMode: jest.fn(({ mode, template = null }) => { selectionMode = { mode, template }; }),
            getSelectorSettings: jest.fn(() => selectionMode),
        };

        const clipboard = (navigator as any).clipboard;
        if (!(clipboard && clipboard.writeText)) {
            (navigator as any).clipboard = {
                writeText: jest.fn(() => Promise.resolve()),
                readText: jest.fn(() => Promise.resolve(JSON.stringify([copiedRegion]))),
            };
        }
    });

    function mockSelectedRegions(ids: string[]) {
        editorMock.prototype.RM = {
            ...new RegionsManager(null, null),
            getSelectedRegionsBounds: jest.fn(() => ids.map((id) => {
                return { id };
            })),
        };
    }

});
