import React, { KeyboardEventHandler, ReactElement } from "react";
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
import { KeyboardBinding } from "../../../common/keyboardBinding/keyboardBinding";
import { strings } from "../../../../../common/strings";
import { EditorToolbar } from "../editorToolbar";
import SplitPane from "react-split-pane";
import { KeyEventType } from "../../../common/keyboardManager/keyboardManager";
import PainterTools from "./painterTools";

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

    private clearConfirm: React.RefObject<Confirm> = React.createRef();
    private toolBar: React.RefObject<EditorToolbar> = React.createRef();
    private tagInput: React.RefObject<TagInput> = React.createRef();
    private attributeInput: React.RefObject<AttributeInput> = React.createRef();
    private toolbarItems: IToolbarItemRegistration[] = ToolbarItemFactory.getToolbarItems();
    private canvasContainer: React.RefObject<HTMLDivElement> = React.createRef();
    private painter: React.RefObject<PainterTools> = React.createRef();

    public render = () => {
        return (
            <>
                {[...Array(10).keys()].map((index) => {
                    return (<KeyboardBinding
                        displayName={strings.editorPage.tags.hotKey.apply}
                        key={index}
                        keyEventType={KeyEventType.KeyUp}
                        accelerators={[`${index}`]}
                        icon={"fa-tag"}
                        handler={this.handleTagHotKey} />);
                })}
                {[...Array(10).keys()].map((index) => {
                    return (<KeyboardBinding
                        displayName={strings.editorPage.tags.hotKey.lock}
                        key={index}
                        keyEventType={KeyEventType.KeyUp}
                        accelerators={[`CmdOrCtrl+${index}`]}
                        icon={"fa-lock"}
                        handler={this.handleCtrlTagHotKey} />);
                })}
                <Confirm title={strings.editorPage.canvas.removeAllRegions.title}
                    ref={this.clearConfirm as any}
                    message={strings.editorPage.canvas.removeAllRegions.confirmation}
                    confirmButtonColor="danger"
                    onConfirm={this.clearCanvas}
                />
                <div id="canvasToolsDiv" ref={this.canvasContainer} onClick={(e) => e.stopPropagation()}>
                    <div id="selectionDiv" onWheel={(e) => e.preventDefault()} //onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}
                            >
                        {
                            this.props.context !== EditingContext.None &&
                            <div id="toolbarDiv" className="editor-page-content-main-header">
                                <EditorToolbar
                                    ref={this.toolBar}
                                    project={this.props.project}
                                    items={this.getFilteredToolbarItems()}
                                    actions={this.props.actions}
                                    onToolbarItemSelected={this.props.onToolbarItemSelected} />
                            </div>
                        }
                        <PainterTools
                            ref={this.painter}
                            canvasContainer={this.canvasContainer}
                        />
                        </div>
                {this.renderChildren()}
                </div>
                <div className="editor-page-right-sidebar">
                    <div className="canvas-sidebar">
                    <SplitPane split="horizontal"
                        defaultSize={"50%"}
                        minSize={100}
                        maxSize={1000}
                        paneStyle={{ display: "flex", overflow: "auto" }}
                        onChange={()=>{}}
                        onDragFinished={()=>{}}>
                            <TagInput
                                ref={this.tagInput}
                                tags={this.props.project.tags}
                                editingContext={this.props.context}
                                lockedTags={this.props.lockedTags}
                                onGetSelectedRegions={this.getSelectedRegions}
                                onChange={() => {}}
                                onLockedTagsChange={() => {}}
                                onTagClick={this.onTagClicked}
                                onCtrlTagClick={this.onCtrlTagClicked}
                                onTagRenamed={this.props.confirmTagRenamed}
                                onTagDeleted={this.props.confirmTagDeleted}
                            />
                            <AttributeInput
                                ref={this.attributeInput}
                                attributeKeys={this.props.project.attributeKeys}
                                onChange={this.onAttributeChanged}
                                onAttributesUpdated={this.applyAttribute}
                            />
                    </SplitPane>
                    </div>
                </div>
            </>
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

    public componentDidUpdate = async (prevProps: Readonly<IPixelCanvasProps>) => {
    }

    public getSelectedRegions = (): IRegion[] => {
        return [];
    }

    public getAllRegions = () => {
        
    }

    public clearCanvas = () => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
    }

    /**
     * Set the loaded asset content source into the canvas tools canvas
     */
     private setContentSource = async (contentSource: ContentSource) => {
        try {
            await this.painter.current.addContentSource(contentSource as any);
        } catch (e) {
            console.warn(e);
        }
    }

    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
     public applyTag = (tag: string) => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
    }

    /**
     * Called when a tag from footer is clicked
     * @param tag Tag clicked
     */
     public onTagClicked = (tag: ITag): void => {
        this.applyTag(tag.name);
        if (this.tagInput.current) {
            this.tagInput.current.setSelectedTag(tag.name);
        }
    }

    public onCtrlTagClicked = (tag: ITag): void => {
        this.onTagClicked(tag);
        /*
        const locked = this.props.lockedTags;
        this.setState({
            selectedTag: tag.name,
            lockedTags: CanvasHelpers.toggleTag(locked, tag.name),
        }, () => this.applyTag(tag.name));
        */
    }

    public applyAttribute = (key: string, value: string) => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
    }

    private onAttributeChanged = async (key: string, value: string): Promise<void> => {
        if (this.getSelectedRegions().length) {
            this.applyAttribute(key, value);
        }
    }

    /**
     * Raised when the underlying asset has completed loading
     */
     private onAssetLoaded = (contentSource: ContentSource) => {
        (contentSource as HTMLElement).setAttribute("id", "contentSource");
        this.painter.current.addContentSource(contentSource as any);
        //const context = this.canvasZone.current.getContext("2d");
        //context.drawImage(contentSource as HTMLImageElement, 0, 0, contentSource.width, contentSource.height);
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onLoaded: this.onAssetLoaded,
        });
    }

    private getFilteredToolbarItems = () => {
        return this.toolbarItems.filter(e => e.config.context.indexOf(this.props.context) >= 0);
    }

    

    /**
     * Listens for {number key} and calls `onTagClicked` with tag corresponding to that number
     * @param event KeyDown event
     */
     private handleTagHotKey = (event: KeyboardEvent): void => {
        const tag = this.getTagFromKeyboardEvent(event);
        if (tag) {
            this.onTagClicked(tag);
        }
    }

    private handleCtrlTagHotKey = (event: KeyboardEvent): void => {
        const tag = this.getTagFromKeyboardEvent(event);
        if (tag) {
            this.onCtrlTagClicked(tag);
        }
    }

    private getTagFromKeyboardEvent = (event: KeyboardEvent): ITag => {
        let key = parseInt(event.key, 10);
        if (isNaN(key)) {
            try {
                key = parseInt(event.key.split("+")[1], 10);
            } catch (e) {
                return;
            }
        }
        let index: number;
        const tags = this.props.project.tags;
        if (key === 0 && tags.length >= 10) {
            index = 9;
        } else if (key < 10) {
            index = key - 1;
        }
        if (index < tags.length) {
            return tags[index];
        }
        return null;
    }
}
