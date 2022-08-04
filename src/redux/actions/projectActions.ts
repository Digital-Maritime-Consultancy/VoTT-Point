import { IFileInfo, IImportFormat } from './../../models/applicationState';
import { ImportProviderFactory } from './../../providers/import/importProviderFactory';
import { Action, Dispatch } from "redux";
import ProjectService from "../../services/projectService";
import { ActionTypes } from "./actionTypes";
import { AssetService } from "../../services/assetService";
import { ExportProviderFactory } from "../../providers/export/exportProviderFactory";
import {
    AppError,
    ErrorCode,
    IApplicationState,
    IAsset,
    IAssetMetadata,
    IConnection,
    IProject,
} from "../../models/applicationState";
import { createAction, createPayloadAction, IPayloadAction } from "./actionCreators";
import { IExportResults } from "../../providers/export/exportProvider";
import { appInfo } from "../../common/appInfo";
import { strings } from "../../common/strings";
import { AnnotationImportCheckResult } from '../../providers/import/importProvider';

/**
 * Actions to be performed in relation to projects
 */
export default interface IProjectActions {
    loadProject(project: IProject): Promise<IProject>;
    loadProjectFromStorage(connection: IConnection, projectId: string): Promise<IProject>;
    saveProject(project: IProject): Promise<IProject>;
    deleteProject(project: IProject): Promise<void>;
    closeProject(): void;
    exportProject(project: IProject): Promise<void> | Promise<IExportResults>;
    importAnnotation(project: IProject, source: IImportFormat): Promise<IProject>;
    checkAnnotation(project: IProject, source: IImportFormat): Promise<AnnotationImportCheckResult>;
    loadAssets(project: IProject): Promise<IAsset[]>;
    loadAssetMetadata(project: IProject, asset: IAsset): Promise<IAssetMetadata>;
    saveAssetMetadata(project: IProject, assetMetadata: IAssetMetadata): Promise<IAssetMetadata>;
    updateProjectTag(project: IProject, oldTagName: string, newTagName: string): Promise<IAssetMetadata[]>;
    deleteProjectTag(project: IProject, tagName): Promise<IAssetMetadata[]>;
}

/**
 * Dispatches Load Project action and resolves with IProject
 * @param project - Project to load
 */
export function loadProject(project: IProject):
    (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IProject> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        const appState = getState();
        const projectService = new ProjectService();

        // Lookup security token used to decrypt project settings
        const projectToken = appState.appSettings.securityTokens
            .find((securityToken) => securityToken && project && securityToken.name === project.securityToken);

        if (project && project.useSecurityToken && !projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }
        const loadedProject = await projectService.load(project, projectToken);

        dispatch(loadProjectAction(loadedProject));
        return loadedProject;
    };
}

/**
 * Dispatches Load Project action and resolves with IProject
 * @param connection - Connection
 * @param projectId - Project ID to load
 */
export function loadProjectFromStorage(connection: IConnection, projectId: string)
    : (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IProject> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        const projectService = new ProjectService();
        const loadedProject = await projectService.loadFromConnection(connection, projectId);

        dispatch(loadProjectAction(loadedProject));
        return loadedProject;
    };
}

/**
 * Dispatches Save Project action and resolves with IProject
 * @param project - Project to save
 */
export function saveProject(project: IProject)
    : (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IProject> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        const appState = getState();
        const projectService = new ProjectService();

        if (projectService.isDuplicate(project, appState.recentProjects)) {
            throw new AppError(ErrorCode.ProjectDuplicateName, `Project with name '${project.name}
                already exists with the same target connection '${project.targetConnection.name}'`);
        }

        const projectToken = appState.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (project.useSecurityToken && !projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }

        const savedProject = await projectService.save(project, projectToken);
        dispatch(saveProjectAction(savedProject));

        // Reload project after save actions
        await loadProject(savedProject)(dispatch, getState);

        return savedProject;
    };
}

/**
 * Dispatches Delete Project action and resolves with project
 * @param project - Project to delete
 */
export function deleteProject(project: IProject)
    : (dispatch: Dispatch, getState: () => IApplicationState) => Promise<void> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        const appState = getState();
        const projectService = new ProjectService();

        // Lookup security token used to decrypt project settings
        const projectToken = appState.appSettings.securityTokens
            .find((securityToken) => securityToken.name === project.securityToken);

        if (project.useSecurityToken && !projectToken) {
            throw new AppError(ErrorCode.SecurityTokenNotFound, "Security Token Not Found");
        }

        const decryptedProject = await projectService.load(project, projectToken);
        await projectService.delete(decryptedProject);
        dispatch(deleteProjectAction(decryptedProject));
    };
}

/**
 * Dispatches Close Project action
 */
export function closeProject(): (dispatch: Dispatch) => void {
    return (dispatch: Dispatch): void => {
        dispatch({ type: ActionTypes.CLOSE_PROJECT_SUCCESS });
    };
}

/**
 * Gets assets from project, dispatches load assets action and returns assets
 * @param project - Project from which to load assets
 */
export function loadAssets(project: IProject): (dispatch: Dispatch) => Promise<IAsset[]> {
    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const assets = await assetService.getAssets();
        dispatch(loadProjectAssetsAction(assets));

        return assets;
    };
}

/**
 * Load metadata from asset within project
 * @param project - Project from which to load asset metadata
 * @param asset - Asset from which to load metadata
 */
export function loadAssetMetadata(project: IProject, asset: IAsset): (dispatch: Dispatch) => Promise<IAssetMetadata> {
    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const assetMetadata = await assetService.getAssetMetadata(asset);
        dispatch(loadAssetMetadataAction(assetMetadata));

        return { ...assetMetadata };
    };
}

/**
 * Save metadata from asset within project
 * @param project - Project from which to save asset metadata
 * @param assetMetadata - Metadata for asset within project
 */
export function saveAssetMetadata(
    project: IProject,
    assetMetadata: IAssetMetadata): (dispatch: Dispatch) => Promise<IAssetMetadata> {
    const newAssetMetadata = { ...assetMetadata, version: appInfo.version };

    return async (dispatch: Dispatch) => {
        const assetService = new AssetService(project);
        const savedMetadata = await assetService.save(newAssetMetadata);
        dispatch(saveAssetMetadataAction(savedMetadata));

        return { ...savedMetadata };
    };
}

/**
 * Updates a project and all asset references from oldTagName to newTagName
 * @param project The project to update tags
 * @param oldTagName The old tag name
 * @param newTagName The new tag name
 */
export function updateProjectTag(project: IProject, oldTagName: string, newTagName: string)
    : (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IAssetMetadata[]> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        // Find tags to rename
        const assetService = new AssetService(project);
        const assetUpdates = await assetService.renameTag(oldTagName, newTagName);

        // Save updated assets
        await assetUpdates.forEachAsync(async (assetMetadata) => {
            await saveAssetMetadata(project, assetMetadata)(dispatch);
        });

        const currentProject = getState().currentProject;
        const updatedProject = {
            ...currentProject,
            tags: project.tags.map((t) => (t.name === oldTagName) ? { ...t, name: newTagName } : t),
        };

        // Save updated project tags
        await saveProject(updatedProject)(dispatch, getState);
        dispatch(updateProjectTagAction(updatedProject));

        return assetUpdates;
    };
}

/**
 * Updates a project and all asset references from oldTagName to newTagName
 * @param project The project to delete tags
 * @param tagName The tag to delete
 */
export function deleteProjectTag(project: IProject, tagName)
    : (dispatch: Dispatch, getState: () => IApplicationState) => Promise<IAssetMetadata[]> {
    return async (dispatch: Dispatch, getState: () => IApplicationState) => {
        // Find tags to rename
        const assetService = new AssetService(project);
        const assetUpdates = await assetService.deleteTag(tagName);

        // Save updated assets
        await assetUpdates.forEachAsync(async (assetMetadata) => {
            await saveAssetMetadata(project, assetMetadata)(dispatch);
        });

        const currentProject = getState().currentProject;
        const updatedProject = {
            ...currentProject,
            tags: project.tags.filter((t) => t.name !== tagName),
        };

        // Save updated project tags
        await saveProject(updatedProject)(dispatch, getState);
        dispatch(deleteProjectTagAction(updatedProject));

        return assetUpdates;
    };
}

/**
 * Initialize export provider, get export data and dispatch export project action
 * @param project - Project to export
 */
export function exportProject(project: IProject): (dispatch: Dispatch) => Promise<void> | Promise<IExportResults> {
    return async (dispatch: Dispatch) => {
        if (!project.exportFormat) {
            throw new AppError(ErrorCode.ExportFormatNotFound, strings.errors.exportFormatNotFound.message);
        }

        if (project.exportFormat && project.exportFormat.providerType) {
            const exportProvider = ExportProviderFactory.create(
                project.exportFormat.providerType,
                project,
                project.exportFormat.providerOptions);

            const results = await exportProvider.export();
            dispatch(exportProjectAction(project));

            return results as IExportResults;
        }
    };
}

export function checkAnnotation(project: IProject, source: IImportFormat):
    (dispatch: Dispatch) => Promise<AnnotationImportCheckResult> {
    return async (dispatch: Dispatch) => {
        if (!project.importFormat) {
            throw new AppError(ErrorCode.ImportFormatNotFound, strings.errors.importFormatNotFound.message);
        }

        if (project.importFormat && project.importFormat.providerType) {
            const importProvider = ImportProviderFactory.create(
                project.importFormat.providerType,
                project,
                project.importFormat.providerOptions);
            const result = await importProvider.check(project, source, this);
            dispatch(checkAnnotationAction(project));
            return result;
        }
        return AnnotationImportCheckResult.NotPerformed;
    };
}

/**
 * Initialize import provider, get import data and dispatch import annotation action
 * @param project - Project to integrate
 * @param source - File to be imported
 */
export function importAnnotation(project: IProject, source: IImportFormat): (dispatch: Dispatch) => Promise<IProject> {
    return async (dispatch: Dispatch) => {
        if (!project.importFormat) {
            throw new AppError(ErrorCode.ImportFormatNotFound, strings.errors.importFormatNotFound.message);
        }

        if (project.importFormat && project.importFormat.providerType) {
            const importProvider = ImportProviderFactory.create(
                project.importFormat.providerType,
                project,
                project.importFormat.providerOptions);

            project = await importProvider.import(project, source, this);
            dispatch(importAnnotationAction(project));
        }
        return project;
        /*
        if (!project.exportFormat) {
            throw new AppError(ErrorCode.ExportFormatNotFound, strings.errors.exportFormatNotFound.message);
        }

        if (project.exportFormat && project.exportFormat.providerType) {
            const exportProvider = ExportProviderFactory.create(
                project.exportFormat.providerType,
                project,
                project.exportFormat.providerOptions);

            const results = await exportProvider.export();
            dispatch(exportProjectAction(project));

            return results as IExportResults;
        }*/
    };
}

/**
 * Load project action type
 */
export interface ILoadProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.LOAD_PROJECT_SUCCESS;
}

/**
 * Close project action type
 */
export interface ICloseProjectAction extends Action<string> {
    type: ActionTypes.CLOSE_PROJECT_SUCCESS;
}

/**
 * Save project action type
 */
export interface ISaveProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.SAVE_PROJECT_SUCCESS;
}

/**
 * Delete project action type
 */
export interface IDeleteProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.DELETE_PROJECT_SUCCESS;
}

/**
 * Load project assets action type
 */
export interface ILoadProjectAssetsAction extends IPayloadAction<string, IAsset[]> {
    type: ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS;
}

/**
 * Load asset metadata action type
 */
export interface ILoadAssetMetadataAction extends IPayloadAction<string, IAssetMetadata> {
    type: ActionTypes.LOAD_ASSET_METADATA_SUCCESS;
}

/**
 * Save asset metadata action type
 */
export interface ISaveAssetMetadataAction extends IPayloadAction<string, IAssetMetadata> {
    type: ActionTypes.SAVE_ASSET_METADATA_SUCCESS;
}

/**
 * Export project action type
 */
export interface IExportProjectAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.EXPORT_PROJECT_SUCCESS;
}

/**
 * Import annotation action type
 */
export interface IImportAnnotationAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.IMPORT_ANNOTATION_SUCCESS;
}

/**
 * Check annotation action type
 */
export interface ICheckAnnotationAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.CHECK_ANNOTATION_SUCCESS;
}

/**
 * Update Project Tag action type
 */
export interface IUpdateProjectTagAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.UPDATE_PROJECT_TAG_SUCCESS;
}

/**
 * Delete project tag action type
 */
export interface IDeleteProjectTagAction extends IPayloadAction<string, IProject> {
    type: ActionTypes.DELETE_PROJECT_TAG_SUCCESS;
}

/**
 * Instance of Load Project action
 */
export const loadProjectAction = createPayloadAction<ILoadProjectAction>(ActionTypes.LOAD_PROJECT_SUCCESS);
/**
 * Instance of Close Project action
 */
export const closeProjectAction = createAction<ICloseProjectAction>(ActionTypes.CLOSE_PROJECT_SUCCESS);
/**
 * Instance of Save Project action
 */
export const saveProjectAction = createPayloadAction<ISaveProjectAction>(ActionTypes.SAVE_PROJECT_SUCCESS);
/**
 * Instance of Delete Project action
 */
export const deleteProjectAction = createPayloadAction<IDeleteProjectAction>(ActionTypes.DELETE_PROJECT_SUCCESS);
/**
 * Instance of Load Project Assets action
 */
export const loadProjectAssetsAction =
    createPayloadAction<ILoadProjectAssetsAction>(ActionTypes.LOAD_PROJECT_ASSETS_SUCCESS);
/**
 * Instance of Load Asset Metadata action
 */
export const loadAssetMetadataAction =
    createPayloadAction<ILoadAssetMetadataAction>(ActionTypes.LOAD_ASSET_METADATA_SUCCESS);
/**
 * Instance of Save Asset Metadata action
 */
export const saveAssetMetadataAction =
    createPayloadAction<ISaveAssetMetadataAction>(ActionTypes.SAVE_ASSET_METADATA_SUCCESS);
/**
 * Instance of Export Project action
 */
export const exportProjectAction =
    createPayloadAction<IExportProjectAction>(ActionTypes.EXPORT_PROJECT_SUCCESS);
/**
 * Instance of Import Annotation action
 */
export const importAnnotationAction =
    createPayloadAction<IImportAnnotationAction>(ActionTypes.IMPORT_ANNOTATION_SUCCESS);
/**
 * Instance of Import Annotation action
 */
export const checkAnnotationAction =
    createPayloadAction<ICheckAnnotationAction>(ActionTypes.CHECK_ANNOTATION_SUCCESS);
/**
 * Instance of Update project tag action
 */
export const updateProjectTagAction =
    createPayloadAction<IUpdateProjectTagAction>(ActionTypes.UPDATE_PROJECT_TAG_SUCCESS);
/**
 * Instance of Delete project tag action
 */
export const deleteProjectTagAction =
    createPayloadAction<IDeleteProjectTagAction>(ActionTypes.DELETE_PROJECT_TAG_SUCCESS);
