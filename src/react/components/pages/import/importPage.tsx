import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { RouteComponentProps } from "react-router-dom";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { IProject, IApplicationState, IImportFormat } from "../../../../models/applicationState";
import { strings } from "../../../../common/strings";
import { toast } from "react-toastify";
import ImportForm from "./importForm";

/**
 * Properties for Import Page
 * @member project - Project being edited
 * @member recentProjects - Array of projects recently viewed/edited
 * @member actions - Project actions
 */
export interface IImportPageProps extends RouteComponentProps, React.Props<ImportPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

function mapStateToProps(state: IApplicationState) {
    return {
        project: state.currentProject,
        recentProjects: state.recentProjects,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators(projectActions, dispatch),
    };
}

/**
 * @name - Import Page
 * @description - Page for importing different annotation format
 */
@connect(mapStateToProps, mapDispatchToProps)
export default class ImportPage extends React.Component<IImportPageProps> {
    private emptyImportFormat: IImportFormat = {
        providerType: "",
        providerOptions: undefined,
    };
    
    constructor(props, context) {
        super(props, context);

        const projectId = this.props.match.params["projectId"];
        if (!this.props.project && projectId) {
            const project = this.props.recentProjects.find((project) => project.id === projectId);
            this.props.actions.loadProject(project);
        }

        this.onFormSubmit = this.onFormSubmit.bind(this);
        this.onFormCancel = this.onFormCancel.bind(this);
    }

    public render() {
        const importFormat = this.props.project && this.props.project.importFormat
            ? this.props.project.importFormat
            : { ...this.emptyImportFormat };

        return (
            <div className="m-3">
                <h3>
                    <i className="fas fa-file-import fa-1x"></i>
                    <span className="px-2">
                        {strings.import.description}
                    </span>
                </h3>
                <div className="m-3">
                    <ImportForm
                        settings={importFormat}
                        onSubmit={this.onFormSubmit}
                        onCancel={this.onFormCancel} />
                </div>
            </div>
        );
    }

    private onFormSubmit = async (importFormat: IImportFormat) => {

        // assets need to be added
        const projectToUpdate: IProject = {
            ...this.props.project,
            importFormat,
        };

        await this.props.actions.saveProject(projectToUpdate);
        toast.success(strings.import.messages.saveSuccess);
        this.props.history.goBack();
    }

    private onFormCancel() {
        this.props.history.goBack();
    }
}
