import React, { ReactElement } from "react";
import {
    EditingContext,
    EditorMode,
    IAssetMetadata,
    ICanvasWorkViewData,
    IPoint,
    IProject, IRegion, IScreenPos, ITag, RegionType,
} from "../../../../../models/applicationState";
import { AssetPreview, ContentSource } from "../../../common/assetPreview/assetPreview";
import Confirm from "../../../common/confirm/confirm";
import { Rect } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Core/Rect";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions from "../../../../../redux/actions/projectActions";
import { ToolbarItem } from "../../../toolbar/toolbarItem";
import _ from "lodash";
import { TagInput } from "../../../common/tagInput/tagInput";
import AttributeInput from "../../../common/attributeInput/attributeInput";
import ReactPainter from "react-painter";

export interface IPixelCanvasProps extends React.Props<PixelCanvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    project: IProject;
    lockedTags: string[];
    children?: ReactElement<AssetPreview>;
    context?: EditingContext;
    actions?: IProjectActions;
    selectedRegions: IRegion[];
    initialWorkData: ICanvasWorkViewData;
    confirmTagDeleted?: (tagName: string) => void;
    confirmTagRenamed?: (tagName: string, newTagName: string) => void;
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
    onToolbarItemSelected?: (toolbarItem: ToolbarItem) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
}

export default class PixelCanvas extends React.Component<IPixelCanvasProps> {
    public static defaultProps: IPixelCanvasProps = {
        editorMode: EditorMode.Select,
        selectedAsset: null,
        selectedRegions: [],
        project: null,
        lockedTags: [],
        initialWorkData: {zoomScale: 1.0, screenPos: {left: 0, top: 0}},
        context: EditingContext.None,
    };

    public editor: any;
    private sourceWidth: number;
    private sourceHeight: number;
    private isDrawing: boolean = false;

    private canvasZone: React.RefObject<HTMLCanvasElement> = React.createRef();

    public render = () => {
        return (
            <div>
                <div id="selectionDiv" onWheel={this.onWheelCapture} //onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}
                        >
                        <div id="editorDiv">
                            <canvas id="CanvasToolsEditor" ref={this.canvasZone}
                                width={this.props.selectedAsset.asset.size.width}
                                height={this.props.selectedAsset.asset.size.height}
                            >
                            </canvas>
                        </div>
                    </div>
            {this.renderChildren()}
            </div>
        );
    }
    /*
    <>
                <div id="canvasToolsDiv" ref={this.canvasZone} className="canvas-enabled"
                    onClick={(e) => e.stopPropagation()}>
                    <div id="toolbarDiv" className="editor-page-content-main-header">
                    </div>
                    <div id="showZoomFactor"></div>
                    {this.renderChildren()}
                </div>
                <div className="editor-page-right-sidebar">
                    <div className="canvas-sidebar">
                    </div>
                </div>
            </>
    */

    public componentDidMount = () => {
    }

    /**
     * Updates the content source for the editor.
     * @param source - Content source.
     * @returns A new `Promise` resolved when content is drawn and Editor is resized.
     */
    public async addContentSource(source: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement): Promise<void> {
        const context = this.canvasZone.current.getContext("2d");

        if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
            this.sourceWidth = source.width;
            this.sourceHeight = source.height;
        } else if (source instanceof HTMLVideoElement) {
            this.sourceWidth = source.videoWidth;
            this.sourceHeight = source.videoHeight;
        }

        this.canvasZone.current.width = this.sourceWidth;
        this.canvasZone.current.height = this.sourceHeight;

        context.drawImage(source, 0, 0, this.canvasZone.current.width, this.canvasZone.current.height);
        this.canvasZone.current.onmousemove = this.onMouseMove;
        this.canvasZone.current.onmousedown = this.onMouseDown;
        this.canvasZone.current.onmouseup = this.onMouseUp;
    }

    public componentWillUnmount() {
    }

    public componentDidUpdate = async (prevProps: Readonly<IPixelCanvasProps>) => {
    }

    private onMouseDown = (event) => {
        const context = this.canvasZone.current.getContext("2d");
        context.beginPath();
        const boundings = this.canvasZone.current.getBoundingClientRect();
        context.moveTo(event.clientX - boundings.left, event.clientY - boundings.top);
        context.lineCap = "round";
        context.lineJoin = "round";
        this.isDrawing = true;
    }

    private onMouseMove = (event) => {
        if (this.isDrawing) {
            const context = this.canvasZone.current.getContext("2d");
            const boundings = this.canvasZone.current.getBoundingClientRect();
            context.lineTo(event.clientX - boundings.left, event.clientY - boundings.top);
            context.stroke();
        }
    }

    private onMouseUp = (event) => {
        this.isDrawing = false;
    }
    /**
     * Raised when the underlying asset has completed loading
     */
     private onAssetLoaded = (contentSource: ContentSource) => {
        (contentSource as HTMLElement).setAttribute("id", "contentSource");
        this.addContentSource(contentSource as any);
        //const context = this.canvasZone.current.getContext("2d");
        //context.drawImage(contentSource as HTMLImageElement, 0, 0, contentSource.width, contentSource.height);
        //context.drawImage(contentSource as HTMLImageElement, 0, 0, contentSource.width, contentSource.height);
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onLoaded: this.onAssetLoaded,
        });
    }

    private getCursorPos = (e: any) => {
        const editorContainer = document.getElementsByClassName("CanvasToolsEditor")[0];
        e = e || window.event;
        /*get the x and y positions of the container:*/
        const containerPos = editorContainer.getBoundingClientRect();

        /*get the x and y positions of the image:*/
        const editorStyles = window.getComputedStyle(editorContainer);
        const imagePos = {
            left: containerPos.left + parseFloat(editorStyles.paddingLeft),
            top: containerPos.top + parseFloat(editorStyles.paddingTop),
        };

        let x = 0;
        let y = 0;
        /*calculate the cursor's x and y coordinates, relative to the image:*/
        x = e.pageX - imagePos.left;
        y = e.pageY - imagePos.top;
        /*consider any page scrolling:*/
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return {x, y};
    }

    private onWheelCapture = (e: any) => {
        if (!e.ctrlKey && !e.shiftKey && e.altKey) {
            if (this.editor) {
                const cursorPos = this.getCursorPos(e);
                if (e.deltaY < 0) {
                    this.editor.ZM.callbacks.onZoomingIn(cursorPos);
                } else if (e.deltaY > 0) {
                    this.editor.ZM.callbacks.onZoomingOut(cursorPos);
                }
                e.nativeEvent.stopImmediatePropagation();
                e.stopPropagation();
            }
        } else {
            const context = this.canvasZone.current.getContext("2d");
            if (e.deltaY > 0) {
                context.lineWidth = context.lineWidth + 0.5;
            } else {
                context.lineWidth = context.lineWidth < 1 ? 1 : context.lineWidth - 0.5;
            }
            
            e.stopPropagation();
        }
    }
}
