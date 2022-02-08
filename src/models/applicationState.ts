import { ExportAssetState } from "../providers/export/exportProvider";
import { IAssetPreviewSettings } from "../react/components/common/assetPreview/assetPreview";

/**
 * @name - Application State
 * @description - Defines the root level application state
 * @member appSettings - Application wide settings
 * @member connections - Global list of connections available to application
 * @member recentProjects - List of recently used projects
 * @member currentProject - The active project being edited
 * @member appError - error in the app if any
 */
export interface IApplicationState {
    appSettings: IAppSettings;
    connections: IConnection[];
    recentProjects: IProject[];
    currentProject: IProject;
    appError?: IAppError;
}

/**
 * @name - Application Error
 * @description - Defines error detail
 * @member title - title of the error to display
 * @member message - message of the error to display
 * @member errorCode - error category
 */
export interface IAppError {
    errorCode: ErrorCode;
    message: any;
    title?: string;
}

/**
 * Enum of supported error codes
 */
export enum ErrorCode {
    // Note that the value of the enum is in camelCase while
    // the enum key is in Pascal casing
    Unknown = "unknown",
    GenericRenderError = "genericRenderError",
    CanvasError = "canvasError",
    V1ImportError = "v1ImportError",
    ProjectUploadError = "projectUploadError",
    ProjectDeleteError = "projectDeleteError",
    ProjectInvalidJson = "projectInvalidJson",
    ProjectInvalidSecurityToken = "projectInvalidSecurityToken",
    ProjectDuplicateName = "projectDuplicateName",
    SecurityTokenNotFound = "securityTokenNotFound",
    ExportFormatNotFound = "exportFormatNotFound",
    PasteRegionTooBig = "pasteRegionTooBig",
    OverloadedKeyBinding = "overloadedKeyBinding",
    ActiveLearningPredictionError = "activeLearningPredictionError",
}

/**
 * Base application error
 */
export class AppError extends Error implements IAppError {
    public errorCode: ErrorCode;
    public message: string;
    public title?: string;

    constructor(errorCode: ErrorCode, message: string, title: string = null) {
        super(message);
        this.errorCode = errorCode;
        this.message = message;
        this.title = title;
    }
}

/**
 * @name - Provider Options
 * @description - Property map of key values used within a export / asset / storage provider
 */
export interface IProviderOptions {
    [key: string]: any;
}

/**
 * @name - Application settings
 * @description - Defines the root level configuration options for the application
 * @member devToolsEnabled - Whether dev tools are current open and enabled
 * @member securityTokens - Token used to encrypt sensitive project settings
 */
export interface IAppSettings {
    devToolsEnabled: boolean;
    securityTokens: ISecurityToken[];
    thumbnailSize?: ISize;
}

/**
 * @name - Project
 * @description - Defines the structure of a VoTT project
 * @member id - Unique identifier
 * @member name - User defined name
 * @member securityToken - The Base64 encoded token used to encrypt sensitive project data
 * @member description - User defined description
 * @member tags - User defined list of tags
 * @member sourceConnection - Full source connection details
 * @member targetConnection - Full target connection details
 * @member exportFormat - Full export format definition
 * @member assets - Map of assets within a project
 * @member autoSave - Whether or not the project will automatically save updates to the underlying target
 */
export interface IProject {
    id: string;
    name: string;
    version: string;
    useSecurityToken: boolean;
    securityToken?: string;
    description?: string;
    taskType: TaskType;
    tags: ITag[];
    sourceConnection: IConnection;
    targetConnection: IConnection;
    exportFormat: IExportFormat;
    videoSettings: IProjectVideoSettings;
    activeLearningSettings: IActiveLearningSettings;
    dotToRectSettings: IDot2RectSettings;
    autoSave: boolean;
    assets?: { [index: string]: IAsset };
    lastVisitedAssetId?: string;
    stellaUrl?: string;
}

/**
 * @name - FileInfo
 * @description - Defines the file information and content for V1 projects
 * @member content - The content of a file (JSON string)
 * @member file - The File object point to the V1 project file
 */
export interface IFileInfo {
    content: string | ArrayBuffer;
    file: File;
}

/**
 * @name - Tag
 * @description - Defines the structure of a VoTT tag
 * @member name - User defined name
 * @member color - User editable color associated to tag
 */
export interface ITag {
    name: string;
    color: string;
}

/**
 * @enum LOCAL - Local storage type
 * @enum CLOUD - Cloud storage type
 * @enum OTHER - Any other storage type
 */
export enum StorageType {
    Local = "local",
    Cloud = "cloud",
    Other = "other",
}

/**
 * @name - Connection
 * @description - Defines a reusable data source definition for projects
 * @member id - Unique identifier for connection
 * @member name - User defined name
 * @member description - User defined short description
 * @member providerType - The underlying storage type (Local File System, Azure Blob Storage, etc)
 * @member providerOptions - Provider specific options used to connect to the data source
 */
export interface IConnection {
    id: string;
    name: string;
    description?: string;
    providerType: string;
    providerOptions: IProviderOptions | ISecureString;
}

/**
 * @name - Export Provider Options
 * @description - options defining the type of asset to export
 * @member assetState - export asset with the following state
 */
export interface IExportProviderOptions extends IProviderOptions {
    assetState: ExportAssetState;
}

/**
 * @name - Export Format
 * @description - Defines the settings for how project data is exported into commonly used format
 * @member id - Unique identifier for export format
 * @member name - Name of export format
 * @member providerType - The export format type (TF Records, YOLO, CSV, etc)
 * @member providerOptions - The provider specific option required to export data
 */
export interface IExportFormat {
    providerType: string;
    providerOptions: IExportProviderOptions | ISecureString;
}

/**
 * @name - Video Tagging Settings for the project
 * @description - Defines the video settings within a VoTT project
 * @member frameExtractionRate - Extraction rate for a video (number of frames per second of video)
 */
export interface IProjectVideoSettings {
    frameExtractionRate: number;
}

/**
 * @name - Model Path Type
 * @description - Defines the mechanism to load the TF.js model for Active Learning
 * @member Coco - Specifies the default/generic pre-trained Coco-SSD model
 * @member File - Specifies to load a custom model from filesystem
 * @member Url - Specifies to load a custom model from a web server
 */
export enum ModelPathType {
    Coco = "coco",
    File = "file",
    Url = "url",
}

/**
 * Properties for additional project settings
 * @member activeLearningSettings - Active Learning settings
 */
export interface IAdditionalPageSettings extends IAssetPreviewSettings {
    activeLearningSettings: IActiveLearningSettings;
    dotToRectService?: IDot2RectSettings;
}

/**
 * @name - Active Learning Settings for the project
 * @description - Defines the active learning settings within a VoTT project
 * @member modelPathType - Model loading type ["coco", "file", "url"]
 * @member modelPath - Local filesystem path to the TF.js model
 * @member modelUrl - Web url to the TF.js model
 * @member autoDetect - Flag for automatically call the model while opening a new asset
 * @member predictTag - Flag to predict also the tag name other than the rectangle coordinates only
 */
export interface IActiveLearningSettings {
    modelPathType: ModelPathType;
    modelPath?: string;
    modelUrl?: string;
    autoDetect: boolean;
    predictTag: boolean;
}

/**
 * @name - Dot to Rect Settings for the project
 * @description - Defines the dot to rect settings within a VoTT project
 * @member url - Web url to get the service
 */
export interface IDot2RectSettings {
    url: string;
}

/**
 * @name - Asset Video Settings
 * @description - Defines the settings for video assets
 * @member shouldAutoPlayVideo - true if the video should auto play when loaded, false otherwise
 * @member posterSource - Source location of the image to display when the video is not playing,
 * null for default (first frame of video)
 */
export interface IAssetVideoSettings {
    shouldAutoPlayVideo: boolean;
    posterSource: string;
    shouldShowPlayControls: boolean;
}

/**
 * @name - Asset
 * @description - Defines an asset within a VoTT project
 * @member id - Unique identifier for asset
 * @member type - Type of asset (Image, Video, etc)
 * @member state - State of Asset
 * @member name - Generated name for asset
 * @member path - Relative path to asset within the underlying data source
 * @member size - Size / dimensions of asset
 * @member isDisabled - Outcome of purification
 * @member approved - State of rejection
 * @member format - The asset format (jpg, png, mp4, etc)
 * @member comment - Comment for asset
 */
export interface IAsset {
    id: string;
    type: AssetType;
    state: AssetState;
    name: string;
    path: string;
    size: ISize;
    isDisabled: boolean;
    approved: boolean;
    completed: boolean;
    format?: string;
    timestamp?: number;
    parent?: IAsset;
    predicted?: boolean;
    comment?: string;
}

/**
 * @name - Asset Metadata
 * @description - Format to store asset metadata for each asset within a project
 * @member asset - References an asset within the project
 * @member regions - The list of regions drawn on the asset
 */
export interface IAssetMetadata {
    asset: IAsset;
    regions: IRegion[];
    version: string;
}

/**
 * @name - Size
 * @description - Defines the size and/or diminsion for an asset
 * @member width - The actual width of an asset
 * @member height - The actual height of an asset
 */
export interface ISize {
    width: number;
    height: number;
}

/**
 * @name - Region
 * @description - Defines a region within an asset
 * @member id - Unique identifier for this region
 * @member type - Defines the type of region
 * @member tags - Defines a list of tags applied to a region
 * @member points - Defines a list of points that define a region
 */
export interface IRegion {
    id: string;
    type: RegionType;
    tags: string[];
    points?: IPoint[];
    boundingBox?: IBoundingBox;
}

/**
 * @name - Bounding Box
 * @description - Defines the tag usage within a bounding box region
 * @member left - Defines the left x boundary for the start of the bounding box
 * @member top - Defines the top y boundary for the start of the boudning box
 * @member width - Defines the width of the bounding box
 * @member height - Defines the height of the bounding box
 */
export interface IBoundingBox {
    left: number;
    top: number;
    width: number;
    height: number;
}

/**
 * @name - Point
 * @description - Defines a point / coordinate within a region
 * @member x - The x value relative to the asset
 * @member y - The y value relative to the asset
 */
export interface IPoint {
    x: number;
    y: number;
}

/**
 * @name - Asset Type
 * @description - Defines the type of asset within a project
 * @member Image - Specifies an asset as an image
 * @member Video - Specifies an asset as a video
 */
export enum AssetType {
    Unknown = 0,
    Image = 1,
    Video = 2,
    VideoFrame = 3,
    TFRecord = 4,
}

/**
 * @name - Asset State
 * @description - Defines the state of the asset with regard to the tagging process
 * @member NotVisited - Specifies as asset that has not yet been visited or tagged
 * @member Visited - Specifies an asset has been visited, but not yet tagged
 * @member Tagged - Specifies an asset has been visited and tagged
 */
export enum AssetState {
    Disabled = -1, // 접근 불가
    NotVisited = 0, // 아무 작업도 수행되지 않은 상태
    Visited = 1, // 이미지를 본 상태
    TaggedDot = 2, // 이미지에 점 어노테이션 작업을 한 상태
    TaggedRectangle = 3, // 이미지에 사각형 어노테이션 작업이 완료된 상태, 작업자의 검수가 준비된 상태
    Commented = 4, // 검수에 따른 커멘트가 남겨진 상태
    Rejected = 5, // 검수 결과 기각된 상태
    Approved = 6, // 검수 결과 승인된 상태
    Completed = 7, // 작업 완료
}

export enum TaskType {
    Purification = "purification", // 정제 작업
    RevisePurification = "revise-purification", // 정제 검수 작업
    Annotation = "annotation", // 가공 작업
    ReviseAnnotation = "revise-annotation", // 가공 검수 작업
    Audit = "audit", // 검증 작업
    Admin = "admin", // 관리자
    NotAssigned = "notassigned", //지정 안됨
}

export interface IProgress {
    state: AssetState;
}

/**
 * @name - Task
 * @description - Defines a region within an asset
 * @member id - Unique identifier for this region
 * @member type - Defines the type of region
 * @member tags - Defines a list of tags applied to a region
 * @member points - Defines a list of points that define a region
 */
export interface ITask {
    id: string;
    vottBackendUrl: string;
    imageServerUrl: string;
    stellaUrl: string;
    dotToRectUrl: string;
    description: string;
    classList: { [name: string]: string };
    imageList: { [name: string]: string };
    type: string;
    status: string;
    createdAt?: string;
    lastUpdatedAt?: string;
    progress?: { [name: string]: IProgress };
}

/**
 * @name - Region Type
 * @description - Defines the region type within the asset metadata
 * @member Square - Specifies a region as a square
 * @member Rectangle - Specifies a region as a rectangle
 * @member Polygon - Specifies a region as a multi-point polygon
 */
export enum RegionType {
    Polyline = "POLYLINE",
    Point = "POINT",
    Rectangle = "RECTANGLE",
    Polygon = "POLYGON",
    Square = "SQUARE",
}

export enum EditingContext {
    EditDot = "editdot",
    EditRect = "editrect",
    Purify = "purify",
    Revise = "revise",
    None = "",
}

export enum EditorMode {
    Rectangle = "RECT",
    Polygon = "POLYGON",
    Polyline = "POLYLINE",
    Point = "POINT",
    Select = "SELECT",
    CopyRect = "COPYRECT",
    None = "NONE",
}

export interface ISecureString {
    encrypted: string;
}

export interface ISecurityToken {
    name: string;
    key: string;
}

export interface ITFRecordMetadata {
    width: number;
    height: number;
    xminArray: number[];
    yminArray: number[];
    xmaxArray: number[];
    ymaxArray: number[];
    textArray: string[];
}
