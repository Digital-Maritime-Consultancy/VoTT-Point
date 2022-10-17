import _ from "lodash";
import React, { RefObject } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import SplitPane from "react-split-pane";
import { bindActionCreators } from "redux";
import { SelectionMode } from "@digital-maritime-consultancy/vott-dot-ct/lib/js/CanvasTools/Interface/ISelectorSettings";
import HtmlFileReader from "../../../../common/htmlFileReader";
import { strings } from "../../../../common/strings";
import {
    AssetState, AssetType, EditorMode, IApplicationState,
    IAppSettings, IAsset, IAssetMetadata, IProject, IRegion,
    ISize, IAdditionalPageSettings, AppError, ErrorCode, EditingContext, RegionType, TaskStatus, TaskType, ICanvasWorkData, IScreenPos,
} from "../../../../models/applicationState";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { ToolbarItemName } from "../../../../registerToolbar";
import { AssetService } from "../../../../services/assetService";
import { AssetPreview } from "../../common/assetPreview/assetPreview";
import { ToolbarItem } from "../../toolbar/toolbarItem";
import Canvas from "./canvas";
import "./editorPage.scss";
import EditorSideBar from "./editorSideBar";
import Alert from "../../common/alert/alert";
import Confirm from "../../common/confirm/confirm";
import { ActiveLearningService } from "../../../../services/activeLearningService";
import { toast } from "react-toastify";
import { DotToRectService } from "../../../../services/dotToRectService";
import { getEditingContext } from "../../common/taskPicker/taskRouter";

import connectionJson from "../../../../assets/defaultConnection.json";

/**
 * Properties for Editor Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 * @member applicationActions - Application setting actions
 */
export interface IEditorPageProps extends RouteComponentProps, React.Props<EditorPage> {
    project: IProject;
    recentProjects: IProject[];
    appSettings: IAppSettings;
    actions: IProjectActions;
    applicationActions: IApplicationActions;
}

/**
 * State for Editor Page
 */
export interface IEditorPageState {
    /** Context of editing */
    context: EditingContext;
    /** Array of assets in project */
    assets: IAsset[];
    /** The editor mode to set for canvas tools */
    editorMode: EditorMode;
    /** The selected asset for the primary editing experience */
    selectedAsset?: IAssetMetadata;
    /** Currently selected region on current asset */
    selectedRegions?: IRegion[];
    /** The child assets used for nest asset typs */
    childAssets?: IAsset[];
    /** Additional settings for asset previews */
    additionalSettings?: IAdditionalPageSettings;
    /** Most recently selected tag */
    selectedTag: string;
    /** Tags locked for region labeling */
    lockedTags: string[];
    /** Size of the asset thumbnails to display in the side bar */
    thumbnailSize: ISize;
    /**
     * Whether or not the editor is in a valid state
     * State is invalid when a region has not been tagged
     */
    isValid: boolean;
    /** Whether the show invalid region warning alert should display */
    showInvalidRegionWarning: boolean;

    canvasWorkData: ICanvasWorkData;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        project: state.currentProject,
        appSettings: state.appSettings,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
    };
}

/**
 * @name - Editor Page
 * @description - Page for adding/editing/removing tags to assets
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class EditorPage extends React.Component<IEditorPageProps, IEditorPageState> {
    public state: IEditorPageState = {
        context: EditingContext.None,
        selectedTag: null,
        lockedTags: [],
        assets: [],
        childAssets: [],
        editorMode: EditorMode.Rectangle,
        additionalSettings: {
            videoSettings: (this.props.project) ? this.props.project.videoSettings : null,
            activeLearningSettings: (this.props.project) ? this.props.project.activeLearningSettings : null,
            dotToRectService: (this.props.project) ? this.props.project.dotToRectSettings : null,
        },
        thumbnailSize: this.props.appSettings.thumbnailSize || { width: 175, height: 155 },
        isValid: true,
        showInvalidRegionWarning: false,
        canvasWorkData: {zoomScale: 1.0, screenPos: {left: 0, top: 0}},
    };

    private activeLearningService: ActiveLearningService = null;
    private dotToRectService: DotToRectService = null;
    private loadingProjectAssets: boolean = false;
    private canvas: RefObject<Canvas> = React.createRef();
    private renameTagConfirm: React.RefObject<Confirm> = React.createRef();
    private deleteTagConfirm: React.RefObject<Confirm> = React.createRef();

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        if (this.props.project && this.props.project.name === projectId) {
            await this.loadProjectAssets();
        } else if (projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            if (project) {
                await this.props.actions.loadProject(project);
            } else {
                // LOAD PROJECT ON-DEMAND: we will load project from remote storage
                const connection = connectionJson;
                await this.props.applicationActions.addNewSecurityToken(projectId);
                await this.props.actions.loadProjectFromStorage(connection, projectId);
            }
        }

        this.activeLearningService = new ActiveLearningService(this.props.project.activeLearningSettings);

        // dot to rect service check
        if (this.props.project && this.props.project.dotToRectSettings && this.props.project.dotToRectSettings.url) {
            this.dotToRectService = new DotToRectService(this.props.project.dotToRectSettings.url ?
                this.props.project.dotToRectSettings.url : connectionJson.providerOptions.dotToRectUrl ?
                connectionJson.providerOptions.dotToRectUrl : "");
        }
        window.addEventListener("beforeunload", this.onUnload);
    }

    public componentWillUnmount() {
        window.removeEventListener("beforeunload", this.onUnload);
    }

    public async componentDidUpdate(prevProps: Readonly<IEditorPageProps>) {
        if (this.props.project && this.state.assets.length === 0) {
            await this.loadProjectAssets();
        }

        if (this.canvas.current) {
            this.canvas.current.applyInitialWorkData();
        }

        const query = new URLSearchParams(this.props.location.search);
        const lockedTags = query.has('tags') && query.get('tags').length ? query.get('tags').split(',') : [];
        if (lockedTags.length &&
            !this.state.lockedTags.every((val, index) => val === lockedTags[index])) {
            // refresh view
            /*
            this.setState({
                context: this.getContext(),
                editorMode: EditorMode.Select,
                lockedTags: lockedTags,
            });
            */
        }

        // Navigating directly to the page via URL (ie, http://vott/projects/a1b2c3dEf/edit) sets the default state
        // before props has been set, this updates the project and additional settings to be valid once props are
        // retrieved.
        if (this.props.project && !prevProps.project) {
            this.setState({
                additionalSettings: {
                    videoSettings: (this.props.project) ? this.props.project.videoSettings : null,
                    activeLearningSettings: (this.props.project) ? this.props.project.activeLearningSettings : null,
                },
            });
        }

        if (this.props.project && prevProps.project && this.props.project.tags !== prevProps.project.tags) {
            this.updateRootAssets();
        }
    }

    public render() {
        const { project } = this.props;
        const { assets, selectedAsset, selectedRegions } = this.state;
        const rootAssets = assets.filter((asset) => !asset.parent);

        if (!project) {
            return (<div>Loading...</div>);
        }
        return (
            <div className="editor-page">
                <SplitPane split="vertical"
                    defaultSize={this.state.thumbnailSize.width}
                    minSize={100}
                    maxSize={400}
                    paneStyle={{ display: "flex" }}
                    onChange={this.onSideBarResize}
                    onDragFinished={this.onSideBarResizeComplete}>
                    <div className="editor-page-sidebar bg-lighter-1">
                        <EditorSideBar
                            assets={rootAssets}
                            selectedAsset={selectedAsset ? selectedAsset.asset : null}
                            onBeforeAssetSelected={this.onBeforeAssetSelected}
                            onAssetSelected={this.selectAsset}
                            thumbnailSize={this.state.thumbnailSize}
                        />
                    </div>
                    <div className="editor-page-content">
                        {selectedAsset &&
                            <Canvas
                                ref={this.canvas}
                                initialWorkData={this.state.canvasWorkData}
                                selectedAsset={this.state.selectedAsset}
                                onAssetMetadataChanged={this.onAssetMetadataChanged}
                                onCanvasRendered={this.onCanvasRendered}
                                onToolbarItemSelected={this.onToolbarItemSelected}
                                onSelectedRegionsChanged={this.onSelectedRegionsChanged}
                                confirmTagDeleted={this.confirmTagDeleted}
                                confirmTagRenamed={this.confirmTagRenamed}
                                actions={this.props.actions}
                                project={this.props.project}
                                lockedTags={this.state.lockedTags}
                                context={this.getContext()}>
                                <AssetPreview
                                    additionalSettings={this.state.additionalSettings}
                                    autoPlay={true}
                                    controlsEnabled={this.state.isValid}
                                    onBeforeAssetChanged={this.onBeforeAssetSelected}
                                    onChildAssetSelected={this.onChildAssetSelected}
                                    asset={this.state.selectedAsset.asset}
                                    childAssets={this.state.childAssets} />
                            </Canvas>
                        }
                        <Confirm title={strings.editorPage.tags.rename.title}
                            ref={this.renameTagConfirm}
                            message={strings.editorPage.tags.rename.confirmation}
                            confirmButtonColor="danger"
                            onConfirm={this.onTagRenamed} />
                        <Confirm title={strings.editorPage.tags.delete.title}
                            ref={this.deleteTagConfirm}
                            message={strings.editorPage.tags.delete.confirmation}
                            confirmButtonColor="danger"
                            onConfirm={this.onTagDeleted} />
                    </div>
                </SplitPane>
                <Alert show={this.state.showInvalidRegionWarning}
                    title={strings.editorPage.messages.enforceTaggedRegions.title}
                    // tslint:disable-next-line:max-line-length
                    message={strings.editorPage.messages.enforceTaggedRegions.description}
                    closeButtonColor="info"
                    onClose={() => this.setState({ showInvalidRegionWarning: false })} />
            </div>
        );
    }

    /**
     * Called when the asset side bar is resized
     * @param newWidth The new sidebar width
     */
    private onSideBarResize = (newWidth: number) => {
        //this.canvas.current.forceResize();
    }

    private getContext = (): EditingContext => {
        // Updating toolbar according to editing context
        return (this.props.match.params["type"] && this.props.match.params["status"]) ?
            getEditingContext(this.props.match.params["type"], this.props.match.params["status"]) :
            getEditingContext(this.props.project.taskType, this.props.project.taskStatus);
    }

    private onUnload = async () => {
        await this.storeAssetMetadata();
     }

    private onSelectedRegionsChanged = (selectedRegions: IRegion[]) => {
        
    }

    /**
     * Called when the asset sidebar has been completed
     */
    private onSideBarResizeComplete = () => {
        const appSettings = {
            ...this.props.appSettings,
            thumbnailSize: this.state.thumbnailSize,
        };

        this.props.applicationActions.saveAppSettings(appSettings);
    }

    /**
     * Open confirm dialog for tag renaming
     */
    private confirmTagRenamed = (tagName: string, newTagName: string): void => {
        this.renameTagConfirm.current.open(tagName, newTagName);
    }

    /**
     * Renames tag in assets and project, and saves files
     * @param tagName Name of tag to be renamed
     * @param newTagName New name of tag
     */
    private onTagRenamed = async (tagName: string, newTagName: string): Promise<void> => {
        const assetUpdates = await this.props.actions.updateProjectTag(this.props.project, tagName, newTagName);
        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);

        if (selectedAsset) {
            if (selectedAsset) {
                this.setState({ selectedAsset });
            }
        }
    }

    /**
     * Open Confirm dialog for tag deletion
     */
    private confirmTagDeleted = (tagName: string): void => {
        this.deleteTagConfirm.current.open(tagName);
    }

    /**
     * Removes tag from assets and projects and saves files
     * @param tagName Name of tag to be deleted
     */
    private onTagDeleted = async (tagName: string): Promise<void> => {
        const assetUpdates = await this.props.actions.deleteProjectTag(this.props.project, tagName);
        const selectedAsset = assetUpdates.find((am) => am.asset.id === this.state.selectedAsset.asset.id);

        if (selectedAsset) {
            this.setState({ selectedAsset });
        }
    }

    /**
     * Raised when a child asset is selected on the Asset Preview
     * ex) When a video is paused/seeked to on a video
     */
    private onChildAssetSelected = async (childAsset: IAsset) => {
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id !== childAsset.id) {
            await this.selectAsset(childAsset);
        }
    }

    /**
     * Returns a value indicating whether the current asset is taggable
     */
    private isTaggableAssetType = (asset: IAsset): boolean => {
        return asset.type !== AssetType.Unknown && asset.type !== AssetType.Video;
    }

    private storeAssetMetadata = async (refresh: boolean = true, workData?: ICanvasWorkData) => {
        if (this.canvas.current) {
            if (this.isThereSomethingUntagged()) {
                alert(strings.editorPage.messages.enforceTaggedRegions.description);
                return;
            }

            const updatedAsset = {...this.state.selectedAsset,
                regions: this.canvas.current.getAllRegions(),
                workData: workData ? workData :
                {
                    zoomScale: this.canvas.current.getCurrentScale(),
                    screenPos: this.canvas.current.getScreenPos()},
            };
            await this.onAssetMetadataChanged(updatedAsset);
            if (refresh) {
                this.setState({
                    selectedAsset: updatedAsset,
                    canvasWorkData:
                        updatedAsset.workData});
            }
        }
    }

    private isThereSomethingUntagged = (): boolean => {
        if (!this.canvas.current) {
            return false;
        }
        const regionsWithoutTags = this.canvas.current.getAllRegions().filter((region) => region.tags.length === 0);
        return regionsWithoutTags.length > 0;
    }

    /**
     * Raised when the selected asset has been changed.
     * This can either be a parent or child asset
     */
    private onAssetMetadataChanged = async (assetMetadata: IAssetMetadata): Promise<void> => {
        // If the asset contains any regions without tags, don't proceed.
        //const regionsWithoutTags = assetMetadata.regions.filter((region) => region.tags.length === 0);
        if (!this.canvas.current) {
            return;
        }

        const initialState = assetMetadata.asset.state;
        // The root asset can either be the actual asset being edited (ex: VideoFrame) or the top level / root
        // asset selected from the side bar (image/video).
        const rootAsset = { ...(assetMetadata.asset.parent || assetMetadata.asset) };

        assetMetadata.asset.state = this.getAssetMetadataState(assetMetadata);

        // Update root asset if not already in the "Tagged" state
        // This is primarily used in the case where a Video Frame is being edited.
        // We want to ensure that in this case the root video asset state is accurately
        // updated to match that state of the asset.
        if (rootAsset.id === assetMetadata.asset.id) {
            rootAsset.state = assetMetadata.asset.state;
        } else {
            const rootAssetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, rootAsset);

            rootAsset.state = rootAssetMetadata.asset.state;
        }

        // Only update asset metadata if state changes or is different
        if (initialState !== assetMetadata.asset.state || this.state.selectedAsset !== assetMetadata) {
            await this.props.actions.saveAssetMetadata(this.props.project, assetMetadata);
        }

        await this.props.actions.saveProject(this.props.project);

        const assetService = new AssetService(this.props.project);
        const childAssets = assetService.getChildAssets(rootAsset);

        // Find and update the root asset in the internal state
        // This forces the root assets that are displayed in the sidebar to
        // accurately show their correct state (not-visited, visited or tagged)
        const assets = [...this.state.assets];
        const assetIndex = assets.findIndex((asset) => asset.id === rootAsset.id);
        if (assetIndex > -1) {
            assets[assetIndex] = {
                ...rootAsset,
            };
        }
        this.setState({ childAssets, assets, isValid: true });
    }

    /**
     * Raised when the asset binary has been painted onto the canvas tools rendering canvas
     */
    private onCanvasRendered = async (canvas: HTMLCanvasElement) => {
        // When active learning auto-detect is enabled
        // run predictions when asset changes
        if (this.props.project.activeLearningSettings.autoDetect && !this.state.selectedAsset.asset.predicted) {
            await this.predictRegions(canvas);
        }
    }

    private onToolbarItemSelected = async (toolbarItem: ToolbarItem): Promise<void> => {
        switch (toolbarItem.props.name) {
            case ToolbarItemName.DrawRectangle:
                this.canvas.current.setSelectionMode(SelectionMode.RECT);
                break;
            case ToolbarItemName.SubmitPoints:
                await this.processPoint2Rect();
                break;
            case ToolbarItemName.DrawPoint:
                this.canvas.current.setSelectionMode(SelectionMode.POINT);
                break;
            case ToolbarItemName.DrawPolygon:
                this.canvas.current.setSelectionMode(SelectionMode.POLYGON);
                break;
            case ToolbarItemName.SelectCanvas:
                this.canvas.current.setSelectionMode(SelectionMode.NONE);
                break;
            case ToolbarItemName.PreviousAsset:
                await this.goToRootAsset(-1);
                break;
            case ToolbarItemName.NextAsset:
                await this.goToRootAsset(1);
                break;
            case ToolbarItemName.Complete:
                await this.updateAssetMetadataState(AssetState.Completed, true);
                break;
            case ToolbarItemName.Disable:
                await this.updateAssetMetadataState(AssetState.Disabled,
                    this.props.project.taskStatus === TaskStatus.Review);
                break;
            case ToolbarItemName.Approve:
                await this.updateAssetMetadataState(AssetState.Approved,
                    this.props.project.taskStatus === TaskStatus.Review);
                break;
            case ToolbarItemName.CopyRegions:
                this.canvas.current.copyRegions();
                break;
            case ToolbarItemName.CutRegions:
                this.canvas.current.cutRegions();
                break;
            case ToolbarItemName.PasteRegions:
                this.canvas.current.pasteRegions();
                break;
            case ToolbarItemName.RemoveAllRegions:
                this.canvas.current.confirmRemoveAllRegions();
                break;
            case ToolbarItemName.SaveProject:
                await this.storeAssetMetadata();
                break;
            case ToolbarItemName.ResetZoom:
                this.resetZoom();
                break;
        }
    }

    private processPoint2Rect = async () => {
        if (this.isThereSomethingUntagged()) {
            alert(strings.editorPage.messages.enforceTaggedRegions.description);
            return;
        }
        if (!this.onBeforeAssetSelected()) {
            return;
        } else {
            if (!this.dotToRectService) {
                toast.error("You need to set an URL for Dot-to-Rect service");
                return ;
            }
            // server connection confirmation
            let toastId: number = null;
            await this.dotToRectService.ensureConnected()
            .then(async res => {
                try {
                    const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, this.state.selectedAsset.asset);
                    if (assetMetadata.regions.length === 0){
                        alert("You need dots to be converted to rectangles");
                        return;
                    }
                    if (this.dotToRectService) {
                        const updatedAssetMetadata = await this.dotToRectService
                        .process(assetMetadata);
                        await this.onAssetMetadataChanged(updatedAssetMetadata);
                        this.setState({ selectedAsset: updatedAssetMetadata});
                    }
                    else {
                        alert("You need to set an URL for Dot-to-Rect service");
                    }
                } catch (e) {
                    throw new AppError(ErrorCode.ActiveLearningPredictionError, "Error predicting regions");
                }
            }).then(() => {
                toast.dismiss(toastId);
            })
            .catch(e=> {
                toast.error(strings.dot2Rect.messages.errorConnection);
                return;
            });
        }
    }

    private predictRegions = async (canvas?: HTMLCanvasElement) => {
        canvas = canvas || document.querySelector("canvas");
        if (!canvas) {
            return;
        }

        if (this.isThereSomethingUntagged()) {
            alert(strings.editorPage.messages.enforceTaggedRegions.description);
            return;
        }

        await this.storeAssetMetadata(false);

        // Load the configured ML model
        if (!this.activeLearningService.isModelLoaded()) {
            let toastId: number = null;
            try {
                toastId = toast.info(strings.activeLearning.messages.loadingModel, { autoClose: false });
                await this.activeLearningService.ensureModelLoaded();
            } catch (e) {
                toast.error(strings.activeLearning.messages.errorLoadModel);
                return;
            } finally {
                toast.dismiss(toastId);
            }
        }

        // Predict and add regions to current asset
        try {
            const updatedAssetMetadata = await this.activeLearningService
                .predictRegions(canvas, this.state.selectedAsset);

            await this.onAssetMetadataChanged(updatedAssetMetadata);
            this.setState({ selectedAsset: updatedAssetMetadata });
        } catch (e) {
            throw new AppError(ErrorCode.ActiveLearningPredictionError, "Error predicting regions");
        }
    }

    /**
     * Navigates to the previous / next root asset on the sidebar
     * @param direction Number specifying asset navigation
     */
    private goToRootAsset = async (direction: number) => {
        const selectedRootAsset = this.state.selectedAsset.asset.parent || this.state.selectedAsset.asset;
        const currentIndex = this.state.assets
            .findIndex((asset) => asset.id === selectedRootAsset.id);

        if (direction > 0) {
            await this.selectAsset(this.state.assets[Math.min(this.state.assets.length - 1, currentIndex + 1)]);
        } else {
            await this.selectAsset(this.state.assets[Math.max(0, currentIndex - 1)]);
        }
    }

    private onBeforeAssetSelected = (): boolean => {
        if (!this.state.isValid) {
            alert(strings.editorPage.messages.enforceTaggedRegions.description);
            //this.setState({ showInvalidRegionWarning: true });
        }

        return this.state.isValid;
    }

    private selectAsset = async (asset: IAsset): Promise<void> => {
        if (this.isThereSomethingUntagged()) {
            alert(strings.editorPage.messages.enforceTaggedRegions.description);
            return;
        }
        // Nothing to do if we are already on the same asset.
        if (this.state.selectedAsset && this.state.selectedAsset.asset.id === asset.id) {
            return;
        }

        await this.storeAssetMetadata(false);

        const assetMetadata = await this.props.actions.loadAssetMetadata(this.props.project, asset);
        try {
            if (!assetMetadata.asset.size) {
                const assetProps = await HtmlFileReader.readAssetAttributes(asset);
                assetMetadata.asset.size = { width: assetProps.width, height: assetProps.height };
            }
        } catch (err) {
            console.warn("Error computing asset size");
        }

        if (this.props.project.taskType === TaskType.Evaluation) {
            assetMetadata.asset.forEvaluation = true;
        }

        this.setState({
            selectedAsset: assetMetadata,
            canvasWorkData: {
                zoomScale: assetMetadata.workData ? assetMetadata.workData.zoomScale : 1.0,
                screenPos: assetMetadata.workData ? assetMetadata.workData.screenPos : {left: 0, top: 0},
            },
        }, async () => {
            await this.onAssetMetadataChanged(assetMetadata);
        });
    }

    private loadProjectAssets = async (): Promise<void> => {
        if (this.loadingProjectAssets || this.state.assets.length > 0) {
            return;
        }

        this.loadingProjectAssets = true;

        // Get all root project assets
        const rootProjectAssets = _.values(this.props.project.assets)
            .filter((asset) => !asset.parent);

        // Get all root assets from source asset provider
        const sourceAssets = await this.props.actions.loadAssets(this.props.project);

        // Merge and uniquify
        const rootAssets = _(rootProjectAssets)
            .concat(sourceAssets)
            .uniqBy((asset) => asset.id)
            .value();

        const lastVisited = rootAssets.find((asset) => asset.id === this.props.project.lastVisitedAssetId);

        this.setState({
            assets: rootAssets,
        }, async () => {
            if (rootAssets.length > 0) {
                await this.selectAsset(lastVisited ? lastVisited : rootAssets[0]);
            }
            this.loadingProjectAssets = false;
        });
    }

    /**
     * Updates the root asset list from the project assets
     */
    private updateRootAssets = () => {
        const updatedAssets = [...this.state.assets];
        updatedAssets.forEach((asset) => {
            const projectAsset = this.props.project.assets[asset.id];
            if (projectAsset) {
                asset.state = projectAsset.state;
            }
        });

        this.setState({ assets: updatedAssets });
    }

    /**
     * Get current state of Asset metadata
     */
    private getAssetMetadataState(assetMetadata: IAssetMetadata): AssetState {
        if (this.isTaggableAssetType(assetMetadata.asset)) {
            if (assetMetadata.asset.isDisabled) {
                return AssetState.Disabled;
            } else if (assetMetadata.asset.approved) {
                return AssetState.Approved;
            } else {
                return assetMetadata.regions.length === 0 ?
                AssetState.Visited : assetMetadata.regions.find(r => r.type === RegionType.Rectangle) ?
                    AssetState.TaggedRectangle : AssetState.TaggedDot;
            }
        }
        return assetMetadata.asset.state;
    }

    private updateAssetMetadataState = async (state: AssetState, completed: boolean = false) => {
        if (this.isThereSomethingUntagged()) {
            alert(strings.editorPage.messages.enforceTaggedRegions.description);
            return;
        }
        await this.onAssetMetadataChanged(
            {
            ...this.state.selectedAsset,
            asset: {
                ...this.state.selectedAsset.asset,
                state,
                isDisabled: state === AssetState.Disabled,
                approved: state === AssetState.Approved,
                completed,
                forEvaluation: this.props.project.taskType === TaskType.Evaluation,
            } as IAsset,
        } as IAssetMetadata);
    }

    private resetZoom = () => {
        this.storeAssetMetadata(true, {zoomScale: 1.0, screenPos: {left: 0, top: 0}});
    }
}
