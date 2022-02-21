import React from "react";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { strings } from "../../../../common/strings";
import { IConnection, IProject, StorageType } from "../../../../models/applicationState";
import { StorageProviderFactory } from "../../../../providers/storage/storageProviderFactory";
import CondensedList, { ListItem } from "../condensedList/condensedList";
import axios from "axios";
import { IRemoteStorageOptions } from "../../../../providers/storage/remoteStorage";

/**
 * Properties for Task Picker
 * @member connections - Array of connections to choose from
 * @member onSubmit - Function to call with contents of selected file
 * @member onCancel - Optional function to call on modal closed
 * @member onSaveProject
 * @member fileExtension - Filter on files with extension
 */
export interface ITaskPickerProps {
    connections: IConnection[];
    onSaveProject: (project: IProject) => void;
    onSubmit: (content: string) => void;
    onCancel?: () => void;
    fileExtension?: string;
}

/**
 * State for Task Picker
 * @member isOpen - Task Picker is open
 * @member modalHeader - Header for Picker modal
 * @member condensedList - List of rendered objects for picking
 * @member selectedConnection - Connection selected in picker
 * @member selectedFile - File selected in picker
 * @member okDisabled - Ok button is disabled
 * @member backDisabled - Back button is disabled
 */
export interface ITaskPickerState {
    isOpen: boolean;
    modalHeader: string;
    condensedList: any;
    selectedConnection: IConnection;
    selectedFile: string;
    okDisabled: boolean;
    backDisabled: boolean;
}

/**
 * @name - Task Picker
 * @description - Modal to choose and read file from cloud connections
 */
export class TaskPicker extends React.Component<ITaskPickerProps, ITaskPickerState> {

    constructor(props) {
        super(props);

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);

        this.getInitialState = this.getInitialState.bind(this);
        this.ok = this.ok.bind(this);
        this.back = this.back.bind(this);
        this.connectionList = this.connectionList.bind(this);
        this.onClickConnection = this.onClickConnection.bind(this);
        this.fileList = this.fileList.bind(this);
        this.onClickFile = this.onClickFile.bind(this);

        this.state = this.getInitialState();
    }

    public render() {
        const closeBtn = <button className="close" onClick={this.close}>&times;</button>;

        return(
            <Modal isOpen={this.state.isOpen} centered={true}>
                <ModalHeader toggle={this.close} close={closeBtn}>
                    {this.state.modalHeader}
                </ModalHeader>
                <ModalBody>
                    {this.state.condensedList}
                </ModalBody>
                <ModalFooter>
                    {this.state.selectedFile || ""}
                    <Button
                        className="btn btn-success mr-1"
                        onClick={this.ok}
                        disabled={this.state.okDisabled}>
                        Create Project
                    </Button>
                    <Button
                        onClick={this.back}
                        disabled={this.state.backDisabled}>
                        Go Back
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    /**
     * Open Task Picker
     */
    public open(): void {
        this.setState({isOpen: true});
    }

    /**
     * Close Task Picker
     */
    public close(): void {
        this.setState(this.getInitialState(),
            () => {
                if (this.props.onCancel) {
                    this.props.onCancel();
                }
            },
        );
    }

    public async fileList(connection: IConnection) {
        const storageProvider = StorageProviderFactory.createFromConnection(connection);
        const files = await storageProvider.listFiles(
            connection.providerOptions["containerName"],
            this.props.fileExtension);
        const fileItems = [];
        for (let i = 0; i < files.length; i++) {
            fileItems.push({
                id: `file-${i + 1}`,
                name: files[i],
            });
        }
        return this.getCondensedList(
            `${this.props.fileExtension || "All"} Files in "${connection.name}"`,
            fileItems,
            this.onClickFile,
        );
    }

    private getInitialState(): ITaskPickerState {
        return {
            isOpen: false,
            modalHeader: strings.homePage.openTask.selectConnection,
            condensedList: this.connectionList(),
            selectedConnection: null,
            selectedFile: null,
            okDisabled: true,
            backDisabled: true,
        };
    }

    private async ok() {
        if (this.state.selectedConnection && this.state.selectedConnection.providerOptions) {
            const apiUrl =
                `${(this.state.selectedConnection.providerOptions as IRemoteStorageOptions).taskServerUrl}/create?uuid=${this.state.selectedFile}`;
            const response = await axios.get(apiUrl);
            const project: IProject = response.data as IProject;
            this.props.onSaveProject(project);
            this.props.onSubmit(JSON.stringify(project));
        }
        
    }

    private back() {
        this.setState({
            ...this.getInitialState(),
            isOpen: true,
        });
    }

    private getCondensedList(title: string, items: any[], onClick) {
        return <CondensedList
            key={title}
            title={title}
            items={items}
            Component={ListItem}
            onClick={onClick}
        />;
    }

    private isCloudConnection(connection: IConnection): boolean {
        try {
            const storageProvider = StorageProviderFactory.createFromConnection(connection);
            return storageProvider.storageType === StorageType.Cloud;
        } catch (e) {
            // Catches connections that are not registered as StorageProviders (e.g. Bing Image search)
            return false;
        }
    }

    private getCloudConnections(connections: IConnection[]): IConnection[] {
        return connections.filter(this.isCloudConnection);
    }

    private connectionList() {
        const connections = this.getCloudConnections(this.props.connections);
        return this.getCondensedList("Task list", connections, (args) => this.onClickConnection(args));
    }

    private async onClickConnection(args) {
        const connection: IConnection = {
            ...args,
        };
        const fileList = await this.fileList(connection);
        this.setState({
            selectedConnection: connection,
            modalHeader: `Select a file from "${connection.name}"`,
            condensedList: fileList,
            backDisabled: false,
        });
    }

    private onClickFile(args) {
        const fileName = args.name;
        this.setState({
            selectedFile: fileName,
            okDisabled: false,
        });
    }
}
