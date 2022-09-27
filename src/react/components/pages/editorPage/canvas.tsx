import React, { Fragment, ReactElement } from "react";
import * as shortid from "shortid";
import { CanvasTools } from "@digital-maritime-consultancy/vott-dot-ct";
import { RegionData } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Core/RegionData";
import {
    EditingContext,
    EditorMode, IAssetMetadata,
    IProject, IRegion, RegionType,
} from "../../../../models/applicationState";
import CanvasHelpers from "./canvasHelpers";
import { AssetPreview, ContentSource } from "../../common/assetPreview/assetPreview";
import { Editor } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/CanvasTools.Editor";
import Clipboard from "../../../../common/clipboard";
import Confirm from "../../common/confirm/confirm";
import { strings } from "../../../../common/strings";
import { SelectionMode } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import { Rect } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Core/Rect";
import { createContentBoundingBox } from "../../../../common/layout";
import { ZoomManager, ZoomType } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Core/ZoomManager";
import { RegionsManager } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Region/RegionsManager";
import { AreaSelector } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Selection/AreaSelector";
import { FilterPipeline } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/CanvasTools.Filter";
import { EditorToolbar } from "./editorToolbar";
import { IToolbarItemRegistration, ToolbarItemFactory } from "../../../../providers/toolbar/toolbarItemFactory";
import IProjectActions from "../../../../redux/actions/projectActions";
import { ToolbarItem } from "../../toolbar/toolbarItem";
import _ from "lodash";

export interface ICanvasProps extends React.Props<Canvas> {
    selectedAsset: IAssetMetadata;
    editorMode: EditorMode;
    selectionMode: SelectionMode;
    project: IProject;
    lockedTags: string[];
    children?: ReactElement<AssetPreview>;
    context?: EditingContext;
    actions?: IProjectActions;
    selectedRegions: IRegion[];
    onAssetMetadataChanged?: (assetMetadata: IAssetMetadata) => void;
    onSelectedRegionsChanged?: (regions: IRegion[]) => void;
    onCanvasRendered?: (canvas: HTMLCanvasElement) => void;
    onToolbarItemSelected?: (toolbarItem: ToolbarItem) => void;
}

export interface ICanvasState {
    currentAsset: IAssetMetadata;
    contentSource: ContentSource;
    enabled: boolean;
    offset: number;
    /** Filtered toolbar items accordning to editing context */
    filteredToolbarItems: IToolbarItemRegistration[];
}

export default class Canvas extends React.Component<ICanvasProps, ICanvasState> {
    public static defaultProps: ICanvasProps = {
        selectionMode: SelectionMode.NONE,
        editorMode: EditorMode.Select,
        selectedAsset: null,
        selectedRegions: [],
        project: null,
        lockedTags: [],
        context: EditingContext.None,
    };

    public editor: any;

    public state: ICanvasState = {
        currentAsset: this.props.selectedAsset,
        contentSource: null,
        enabled: false,
        offset: 0,
        filteredToolbarItems: [],
    };

    // a flag to confirm an actual region move
    private isMoved = false;

    private canvasZone: React.RefObject<HTMLDivElement> = React.createRef();
    private clearConfirm: React.RefObject<Confirm> = React.createRef();
    private toolbarItems: IToolbarItemRegistration[] = ToolbarItemFactory.getToolbarItems();
    private template: Rect = new Rect(20, 20);

    public render = () => {
        const className = this.state.enabled ? "canvas-enabled" : "canvas-disabled";
        return (
            <>
                <Confirm title={strings.editorPage.canvas.removeAllRegions.title}
                    ref={this.clearConfirm as any}
                    message={strings.editorPage.canvas.removeAllRegions.confirmation}
                    confirmButtonColor="danger"
                    onConfirm={this.removeAllRegions}
                />
                <div id="canvasToolsDiv" ref={this.canvasZone} className={className}
                    onClick={(e) => e.stopPropagation()}>
                    {
                        this.props.context !== EditingContext.None &&
                        <div id="toolbarDiv" className="editor-page-content-main-header">
                            <EditorToolbar project={this.props.project}
                                items={this.state.filteredToolbarItems}
                                actions={this.props.actions}
                                onToolbarItemSelected={this.props.onToolbarItemSelected} />
                        </div>
                    }
                    <div id="showZoomFactor"></div>
                    <div id="selectionDiv" onWheel={this.onWheelCapture}
                        onKeyDown={this.onKeyDown} onKeyUp={this.onKeyUp}>
                        <div id="editorDiv"></div>
                </div>
                {this.renderChildren()}
            </div>
            </>
        );
    }

    public componentDidMount = () => {
        // Get references for editor and toolbar containers
        const editorContainer = document.getElementById("editorDiv") as HTMLDivElement;
        const toolbarContainer = document.getElementById("toolbarDiv") as HTMLDivElement;

        this.setState({
            filteredToolbarItems: this.toolbarItems.filter(e => e.config.context.indexOf(this.props.context) >= 0)});

        // Init the editor with toolbar.
        this.editor = new CanvasTools.Editor(editorContainer, undefined, undefined, undefined, {
            isZoomEnabled: true,
            zoomType: 3,
        });
        //this.editor.addToolbar(toolbarContainer, CanvasTools.Editor.FullToolbarSet, "./../shared/media/icons/", false);

        this.editor.onSelectionEnd = this.onSelectionEnd;
        this.editor.onRegionMove = () => this.isMoved = true;
        this.editor.onRegionMoveEnd = this.onRegionMoveEnd;
        this.editor.onRegionSelected = this.onRegionSelected;
        this.editor.onRegionDelete = this.onRegionDelete;

        this.editor.ZM.setMaxZoomScale(10);

        const showZoomDiv = document.getElementById("showZoomFactor");
        this.editor.onZoomEnd = function (zoom) {
            showZoomDiv.innerText = "Image zoomed at " + zoom.currentZoomScale*100 + " %";
        };

        this.setState({
            filteredToolbarItems: this.toolbarItems.filter(e => e.config.context.indexOf(this.props.context) >= 0)});
    }

    public componentDidUpdate = async (prevProps: Readonly<ICanvasProps>, prevState: Readonly<ICanvasState>) => {
        // Handles asset changing
        if (this.props.selectedAsset !== prevProps.selectedAsset) {
            this.setState({ currentAsset: this.props.selectedAsset });
        }

        // Handle region selection in canvas
        if (this.editor) {
            if (!_.isEqual(this.props.selectedRegions, prevProps.selectedRegions) ||
                this.props.selectedRegions.length && this.editor.RM.getSelectedRegions().length === 0) {
                    this.props.selectedRegions.forEach((r: IRegion) => this.editor.RM.selectRegionById(r.id));
            }
        }

        if (this.props.context !== prevProps.context) {
            this.setState({
                filteredToolbarItems: this.toolbarItems.filter(e => e.config.context.indexOf(this.props.context) >= 0)});
        }

        // Handle selection mode changes
        if (this.props.selectionMode !== prevProps.selectionMode) {
            const options = (this.props.selectionMode === SelectionMode.COPYRECT) ? this.template : null;
            this.editor.AS.setSelectionMode({ mode: this.props.selectionMode, template: options });
        }

        const assetIdChanged = this.state.currentAsset.asset.id !== prevState.currentAsset.asset.id;

        // When the selected asset has changed but is still the same asset id
        if (!assetIdChanged && this.state.currentAsset !== prevState.currentAsset) {
            this.refreshCanvasToolsRegions();
        }

        // When the context has changed but is still the same asset id
        if (this.props.context !== prevProps.context) {
            this.refreshCanvasToolsRegions();
        }

        // When the project tags change re-apply tags to regions
        if (this.props.project.tags !== prevProps.project.tags) {
            this.updateCanvasToolsRegionTags();
        }

        // Handles when the canvas is enabled & disabled
        if (prevState.enabled !== this.state.enabled) {
            // When the canvas is ready to display
            if (this.state.enabled) {
                this.refreshCanvasToolsRegions();
                this.setContentSource(this.state.contentSource);
                this.editor.AS.setSelectionMode({mode: this.props.selectionMode});
                this.editor.AS.enable();
                if (this.props.onSelectedRegionsChanged) {
                    this.props.onSelectedRegionsChanged(this.getSelectedRegions());
                }
            } else { // When the canvas has been disabled
                this.editor.AS.disable();
                this.clearAllRegions();
                this.editor.AS.setSelectionMode({mode: SelectionMode.NONE});
            }
        }
    }

    /**
     * Toggles tag on all selected regions
     * @param selectedTag Tag name
     */
    public applyTag = (tag: string) => {
        const selectedRegions = this.getSelectedRegions();
        const lockedTags = this.props.lockedTags;
        const lockedTagsEmpty = !lockedTags || !lockedTags.length;
        const regionsEmpty = !selectedRegions || !selectedRegions.length;
        if ((!tag && lockedTagsEmpty) || regionsEmpty) {
            return;
        }
        let transformer: (tags: string[], tag: string) => string[];
        if (process.env.REACT_APP_SINGLE_TAG_CONSTRAINT) {
            transformer = CanvasHelpers.toggleSingleTag;
        } else {
            if (lockedTagsEmpty) {
                // Tag selected while region(s) selected
                transformer = CanvasHelpers.toggleTag;
            } else if (lockedTags.find((t) => t === tag)) {
                // Tag added to locked tags while region(s) selected
                transformer = CanvasHelpers.addIfMissing;
            } else {
                // Tag removed from locked tags while region(s) selected
                transformer = CanvasHelpers.removeIfContained;
            }
        }
        for (const selectedRegion of selectedRegions) {
            selectedRegion.tags = transformer(selectedRegion.tags, tag);
        }
        this.updateRegions(selectedRegions);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegions);
        }
    }

    public copyRegions = async () => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        await Clipboard.writeObject(this.getSelectedRegions());
    }

    public cutRegions = async () => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        const selectedRegions = this.getSelectedRegions();
        await Clipboard.writeObject(selectedRegions);
        this.deleteRegions(selectedRegions);
    }

    public pasteRegions = async () => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        const regionsToPaste: IRegion[] = await Clipboard.readObject();
        const asset = this.state.currentAsset;
        const duplicates = CanvasHelpers.duplicateRegionsAndMove(
            regionsToPaste,
            asset.regions,
            asset.asset.size.width,
            asset.asset.size.height,
        );
        this.addRegions(duplicates);
    }

    public confirmRemoveAllRegions = () => {
        this.clearConfirm.current.open();
    }

    public getSelectedRegions = (): IRegion[] => {
        const selectedRegions = this.editor.RM.getSelectedRegions().map((rb) => rb.id);
        return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
    }

    public getSelectedRegionsById = (id: string): IRegion[] => {
        const selectedRegions = this.editor.RM.getAllRegions().filter(r => r.id === id).map((rb) => rb.id);
        return this.state.currentAsset.regions.filter((r) => selectedRegions.find((id) => r.id === id));
    }

    public updateCanvasToolsRegionTags = (): void => {
        for (const region of this.state.currentAsset.regions) {
            this.editor.RM.updateTagsById(
                region.id,
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region),
            );
        }
    }

    private removeAllRegions = () => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        const ids = this.state.currentAsset.regions.map((r) => r.id);
        for (const id of ids) {
            this.editor.RM.deleteRegionById(id);
        }
        this.deleteRegionsFromAsset(this.state.currentAsset.regions);
    }

    private addRegions = (regions: IRegion[]) => {
        this.addRegionsToCanvasTools(regions);
        this.addRegionsToAsset(regions);
    }

    private addRegionsToAsset = (regions: IRegion[]) => {
        this.updateAssetRegions(
            this.state.currentAsset.regions.concat(regions),
        );
    }

    private addRegionsToCanvasTools = (regions: IRegion[]) => {
        for (const region of regions) {
            const regionData = CanvasHelpers.getRegionData(region);
            const scaledRegionData = this.editor.scaleRegionToFrameSize(
                regionData,
                this.state.currentAsset.asset.size.width,
                this.state.currentAsset.asset.size.height);
            this.editor.RM.addRegion(
                region.id,
                scaledRegionData,
                CanvasHelpers.getTagsDescriptor(this.props.project.tags, region),
            );
        }
    }

    private deleteRegions = (regions: IRegion[]) => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        this.deleteRegionsFromCanvasTools(regions);
        this.deleteRegionsFromAsset(regions);
    }

    private deleteRegionsFromAsset = (regions: IRegion[]) => {
        const filteredRegions = this.state.currentAsset.regions.filter((assetRegion) => {
            return !regions.find((r) => r.id === assetRegion.id);
        });
        this.updateAssetRegions(filteredRegions);
    }

    private deleteRegionsFromCanvasTools = (regions: IRegion[]) => {
        for (const region of regions) {
            this.editor.RM.deleteRegionById(region.id);
        }
    }

    /**
     * Method that gets called when a new region is drawn
     * @param {RegionData} regionData the RegionData of created region
     * @returns {void}
     */
    private onSelectionEnd = (regionData: RegionData) => {
        if (CanvasHelpers.isEmpty(regionData) || this.props.context === EditingContext.None) {
            return;
        }
        const id = shortid.generate();

        this.editor.RM.addRegion(id, regionData, new CanvasTools.Core.TagsDescriptor());
        this.template = new Rect(regionData.width, regionData.height);

        // RegionData not serializable so need to extract data
        const scaledRegionData = this.editor.scaleRegionToSourceSize(
            regionData,
            this.state.currentAsset.asset.size.width,
            this.state.currentAsset.asset.size.height,
        );
        const lockedTags = this.props.lockedTags;
        const newRegion = {
            id,
            type: this.editorModeToType(this.props.editorMode),
            tags: lockedTags || [],
            boundingBox: {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            },
            points: scaledRegionData.points,
            attributes: {},
        };
        if (lockedTags && lockedTags.length) {
            this.editor.RM.updateTagsById(id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, newRegion));
        }
        this.updateAssetRegions([...this.state.currentAsset.regions, newRegion]);

        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([newRegion]);
        }
    }

    /**
     * Update regions within the current asset
     * @param regions
     * @param selectedRegions
     */
    private updateAssetRegions = (regions: IRegion[]) => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        const currentAsset: IAssetMetadata = {
            ...this.state.currentAsset,
            regions,
        };
        this.setState({
            currentAsset,
        }, () => {
            this.props.onAssetMetadataChanged(currentAsset);
        });
    }

    /**
     * Method called when moving a region already in the editor
     * @param {string} id the id of the region that was moved
     * @param {RegionData} regionData the RegionData of moved region
     * @returns {void}
     */
    private onRegionMoveEnd = (id: string, regionData: RegionData) => {
        if (this.props.context === EditingContext.None || !this.isMoved) {
            return ;
        }
        const currentRegions = this.state.currentAsset.regions;
        const movedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        const movedRegion = currentRegions[movedRegionIndex];
        const scaledRegionData = this.editor.scaleRegionToSourceSize(
            regionData,
            this.state.currentAsset.asset.size.width,
            this.state.currentAsset.asset.size.height,
        );

        if (movedRegion) {
            movedRegion.points = scaledRegionData.points;
            movedRegion.boundingBox = {
                height: scaledRegionData.height,
                width: scaledRegionData.width,
                left: scaledRegionData.x,
                top: scaledRegionData.y,
            };
        }

        currentRegions[movedRegionIndex] = movedRegion;
        this.updateAssetRegions(currentRegions);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([movedRegion]);
        }
        this.isMoved = false;
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the deleted region
     * @returns {void}
     */
    private onRegionDelete = (id: string) => {
        if (this.props.context === EditingContext.None) {
            return ;
        }
        // Remove from Canvas Tools
        this.editor.RM.deleteRegionById(id);

        // Remove from project
        const currentRegions = this.state.currentAsset.regions;
        const deletedRegionIndex = currentRegions.findIndex((region) => region.id === id);
        currentRegions.splice(deletedRegionIndex, 1);

        this.updateAssetRegions(currentRegions);
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged([]);
        }
    }

    /**
     * Method called when deleting a region from the editor
     * @param {string} id the id of the selected region
     * @param {boolean} multiSelect boolean whether region was selected with multi selection
     * @returns {void}
     */
    private onRegionSelected = (id: string, multiSelect: boolean) => {
        if (this.props.context === EditingContext.None) {
            //this.props.onSelectedRegionsChanged(this.getSelectedRegionsById(id));
            return ;
        }
        const selectedRegions = this.getSelectedRegions();
        if (this.props.onSelectedRegionsChanged) {
            this.props.onSelectedRegionsChanged(selectedRegions);
        }

        // Gets the scaled region data
        const selectedRegionsData = this.editor.RM.getSelectedRegions().find((region) => region.id === id);

        if (selectedRegionsData) {
            this.template = new Rect(selectedRegionsData.width, selectedRegionsData.height);
        }

        if (this.props.lockedTags && this.props.lockedTags.length) {
            for (const selectedRegion of selectedRegions) {
                selectedRegion.tags = CanvasHelpers.addAllIfMissing(selectedRegion.tags, this.props.lockedTags);
            }
            this.updateRegions(selectedRegions);
        }
    }

    private renderChildren = () => {
        return React.cloneElement(this.props.children, {
            onAssetChanged: this.onAssetChanged,
            onLoaded: this.onAssetLoaded,
            onError: this.onAssetError,
            onActivated: this.onAssetActivated,
            onDeactivated: this.onAssetDeactivated,
        });
    }

    /**
     * Raised when the asset bound to the asset preview has changed
     */
    private onAssetChanged = () => {
        this.setState({ enabled: false });
    }

    /**
     * Raised when the underlying asset has completed loading
     */
    private onAssetLoaded = (contentSource: ContentSource) => {
        this.setState({ contentSource });
    }

    private onAssetError = () => {
        this.setState({
            enabled: false,
        });
    }

    /**
     * Raised when the asset is taking control over the rendering
     */
    private onAssetActivated = () => {
        this.setState({ enabled: false });
    }

    /**
     * Raise when the asset is handing off control of rendering
     */
    private onAssetDeactivated = (contentSource: ContentSource) => {
        this.setState({
            contentSource,
            enabled: true,
        });
    }

    /**
     * Set the loaded asset content source into the canvas tools canvas
     */
    private setContentSource = async (contentSource: ContentSource) => {
        try {
            await this.editor.addContentSource(contentSource as any);

            if (this.props.onCanvasRendered) {
                const canvas = this.canvasZone.current.querySelector("canvas");
                this.props.onCanvasRendered(canvas);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    /**
     * Updates regions in both Canvas Tools and the asset data store
     * @param updates Regions to be updated
     * @param updatedSelectedRegions Selected regions with any changes already applied
     */
    private updateRegions = (updates: IRegion[]) => {
        const updatedRegions = CanvasHelpers.updateRegions(this.state.currentAsset.regions, updates);
        for (const update of updates) {
            this.editor.RM.updateTagsById(update.id, CanvasHelpers.getTagsDescriptor(this.props.project.tags, update));
        }
        this.updateAssetRegions(updatedRegions);
        this.updateCanvasToolsRegionTags();
    }

    /**
     * Updates the background of the canvas and draws the asset's regions
     */
    private clearAllRegions = () => {
        this.editor.RM.deleteAllRegions();
    }

    private refreshCanvasToolsRegions = () => {
        this.clearAllRegions();

        if (!this.state.currentAsset.regions || this.state.currentAsset.regions.length === 0) {
            return;
        }

        // Add regions to the canvas
        this.state.currentAsset.regions.forEach((region: IRegion) => {
            if (this.props.context === EditingContext.EditDot || this.props.context === EditingContext.None) {
                if (region.type === RegionType.Point || region.type === RegionType.Rectangle || region.type === RegionType.Polygon) {
                    const loadedRegionData = CanvasHelpers.getRegionData(region);
                    this.editor.RM.addRegion(
                        region.id,
                        this.editor.scaleRegionToFrameSize(
                            loadedRegionData,
                            this.state.currentAsset.asset.size.width,
                            this.state.currentAsset.asset.size.height,
                        ),
                        CanvasHelpers.getTagsDescriptor(this.props.project.tags, region));
                }
            } else if (this.props.context === EditingContext.EditRect) {
                if (region.type === RegionType.Rectangle || region.type === RegionType.Polygon) {
                    const loadedRegionData = CanvasHelpers.getRegionData(region);
                    this.editor.RM.addRegion(
                        region.id,
                        this.editor.scaleRegionToFrameSize(
                            loadedRegionData,
                            this.state.currentAsset.asset.size.width,
                            this.state.currentAsset.asset.size.height,
                        ),
                        CanvasHelpers.getTagsDescriptor(this.props.project.tags, region));
                }
            }
        });
    }

    private editorModeToType = (editorMode: EditorMode) => {
        let type;
        switch (editorMode) {
            case EditorMode.CopyRect:
            case EditorMode.Rectangle:
                type = RegionType.Rectangle;
                break;
            case EditorMode.Polygon:
                type = RegionType.Polygon;
                break;
            case EditorMode.Point:
                type = RegionType.Point;
                break;
            case EditorMode.Polyline:
                type = RegionType.Polyline;
                break;
            default:
                break;
        }
        return type;
    }

    private onKeyDown = (e: any) => {
        if (!e.ctrlKey && !e.shiftKey && e.altKey && this.editor) {
            if (this.editor.ZM.isZoomEnabled && !this.editor.ZM.isDraggingEnabled) {
                this.editor.ZM.callbacks.onDragActivated();
            }
        }
    }

    private onKeyUp = (e: any) => {
        if (this.editor) {
            if (this.editor.ZM.isZoomEnabled) {
                this.editor.ZM.callbacks.onDragDeactivated();
            }
        }
    }

    private onWheelCapture = (e: any) => {
        if (!e.ctrlKey && !e.shiftKey && e.altKey && this.editor) {
            const cursorPos = this.getCursorPos(e);
            if (e.deltaY < 0) {
                this.editor.ZM.callbacks.onZoomingIn(cursorPos);
            } else if (e.deltaY > 0) {
                this.editor.ZM.callbacks.onZoomingOut(cursorPos);
            }
            e.nativeEvent.stopImmediatePropagation();
            e.stopPropagation();
        }
    }

    private getCursorPos = (e: any) => {
        const editorContainer = document.getElementsByClassName("CanvasToolsEditor")[0];
        let containerPos, x = 0, y = 0;
        e = e || window.event;
        /*get the x and y positions of the container:*/
        containerPos = editorContainer.getBoundingClientRect();

        /*get the x and y positions of the image:*/
        const editorStyles = window.getComputedStyle(editorContainer);
        const imagePos = {
            left: containerPos.left + parseFloat(editorStyles.paddingLeft),
            top: containerPos.top + parseFloat(editorStyles.paddingTop)
        };


        /*calculate the cursor's x and y coordinates, relative to the image:*/
        x = e.pageX - imagePos.left;
        y = e.pageY - imagePos.top;
        /*consider any page scrolling:*/
        x = x - window.pageXOffset;
        y = y - window.pageYOffset;
        return {x : x, y : y};
    }
}
