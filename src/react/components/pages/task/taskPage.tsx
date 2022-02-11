import React, { SyntheticEvent } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { bindActionCreators } from "redux";
import { strings, interpolate } from "../../../../common/strings";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import IApplicationActions, * as applicationActions from "../../../../redux/actions/applicationActions";
import { CloudFilePicker } from "../../common/cloudFilePicker/cloudFilePicker";
import CondensedList from "../../common/condensedList/condensedList";
import Confirm from "../../common/confirm/confirm";
import FilePicker from "../../common/filePicker/filePicker";
import "./taskPage.scss";
import { constants } from "../../../../common/constants";
import {
    IApplicationState, IConnection, IProject, IFileInfo,
    ErrorCode, AppError, IAppError, IAppSettings, IAsset, EditingContext,
} from "../../../../models/applicationState";
import ImportService from "../../../../services/importService";
import { IAssetMetadata } from "../../../../models/applicationState";
import { toast } from "react-toastify";
import MessageBox from "../../common/messageBox/messageBox";
import { isElectron } from "../../../../common/hostProcess";
import { TaskPicker } from "../../common/taskPicker/taskPicker";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import { IRemoteStorageOptions, RemoteStorage } from "../../../../providers/storage/remoteStorage";
import axios from "axios";

export interface ITaskPageProps extends RouteComponentProps, React.Props<TaskPage> {
    recentProjects: IProject[];
    connections: IConnection[];
    actions: IProjectActions;
    applicationActions: IApplicationActions;
    appSettings: IAppSettings;
    project: IProject;
}

export interface ITaskPageState {
    cloudPickerOpen: boolean;
}

function mapStateToProps(state: IApplicationState) {
    return {
        recentProjects: state.recentProjects,
        connections: state.connections,
        appSettings: state.appSettings,
        project: state.currentProject,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
        applicationActions: bindActionCreators(applicationActions, dispatch),
    };
}

@connect(mapStateToProps, mapDispatchToProps)
export default class TaskPage extends React.Component<ITaskPageProps, ITaskPageState> {
    public state: ITaskPageState = {
        cloudPickerOpen: false,
    };
    private deleteConfirm: React.RefObject<Confirm> = React.createRef();
    private taskPicker: React.RefObject<TaskPicker> = React.createRef();
    private importConfirm: React.RefObject<Confirm> = React.createRef();

    public render() {
        return (
            <div className="app-homepage">
                <div className="app-homepage-main">
                    <ul>
                        <li>
                            {/*Create Project from Task*/}
                            <a onClick={this.handleCreateProjectClick} className="p-5 cloud-open-project">
                                <i className="fas fa-file-import fa-9x"></i>
                                <h6>{strings.homePage.openTask.title}</h6>
                            </a>
                            <TaskPicker
                                ref={this.taskPicker}
                                connections={this.props.connections}
                                onSaveProject={(project: IProject) =>
                                    {
                                        this.props.applicationActions.addNewSecurityToken(project.name);
                                        this.saveProject(project);
                                    }}
                                onSubmit={(content) => this.loadSelectedProject(JSON.parse(content))}
                                fileExtension={constants.projectFileExtension}
                            />
                        </li>
                    </ul>
                </div>
                <Confirm title="Delete Project"
                    ref={this.deleteConfirm as any}
                    message={(project: IProject) => `${strings.homePage.deleteProject.confirmation} ${project.name}?`}
                    confirmButtonColor="danger"
                    onConfirm={this.deleteProject} />
            </div>
        );
    }

    private handleCreateProjectClick = async() => {
        // We should check whether the task ID is given from the URL parameters
        if (!this.props.match.params["taskId"] || this.props.match.params["taskId"].length === 0) {
            alert("Task ID not found! it should be given at the end of URL.");
            return ;
        }

        // and then we will choose connection available
        // the url of remote storage connection should be ended with '/task'
        const connectionForTask =
            this.props.connections.filter(
                    e => (e.providerOptions as IRemoteStorageOptions).url.endsWith('/task')).pop();
        if (connectionForTask) {
            // Let's grab task files from the connection
            const storageProvider = StorageProviderFactory.createFromConnection(connectionForTask);
            const files = await storageProvider.listFiles(
                connectionForTask.providerOptions["containerName"],
                constants.projectFileExtension);
            const fileItems = [];
            for (let i = 0; i < files.length; i++) {
                fileItems.push({
                    id: `file-${i + 1}`,
                    name: files[i],
                });
            }
            console.log(fileItems);
            // We will only use the task file having the same name with the given task ID
            const taskFile = fileItems.filter(e => e.name === this.props.match.params["taskId"]).pop();
            if (taskFile) {
                // Great! Let's create the project with API and jump into the edit page!
                await this.createProjectFromTask(
                    (connectionForTask.providerOptions as IRemoteStorageOptions).url, taskFile.name);
            }
        }
    }

    private async createProjectFromTask(url: string, taskId: string) {
        const apiUrl = `${url}/newProject?uuid=${taskId}`;
        const response = await axios.get(apiUrl);
        const project: IProject = response.data as IProject;
        this.props.applicationActions.addNewSecurityToken(project.name);
        this.saveProject(project);
        this.loadSelectedProject(project);
    }

    private loadSelectedProject = async (project: IProject) => {
        await this.props.actions.loadProject(project);
        this.props.history.push(`/projects/${project.id}/edit/${project.taskType}/${project.taskStatus}`);
    }

    private saveProject = async (project: IProject) => {
        await this.props.actions.saveProject(project);
        this.props.history.push(`/projects/${project.id}/edit/${project.taskType}/${project.taskStatus}`);
    }

    private deleteProject = async (project: IProject) => {
        try {
            await this.props.actions.deleteProject(project);
            toast.info(interpolate(strings.homePage.messages.deleteSuccess, { project }));
        } catch (error) {
            throw new AppError(ErrorCode.ProjectDeleteError, "Error deleting project file");
        }
    }
}
