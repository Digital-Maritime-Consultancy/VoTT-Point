import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import { bindActionCreators } from "redux";
import { IDot2RectSettings, IProject, IApplicationState } from "../../../../models/applicationState";
import IProjectActions, * as projectActions from "../../../../redux/actions/projectActions";
import { strings } from "../../../../common/strings";
import { Dot2RectForm } from "./dot2RectForm";
import { toast } from "react-toastify";

export interface IDot2RectPageProps extends RouteComponentProps, React.Props<Dot2RectPage> {
    project: IProject;
    recentProjects: IProject[];
    actions: IProjectActions;
}

export interface IDot2RectPageState {
    settings: IDot2RectSettings;
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

@connect(mapStateToProps, mapDispatchToProps)
export default class Dot2RectPage extends React.Component<IDot2RectPageProps, IDot2RectPageState> {
    public state: IDot2RectPageState = {
        settings: this.props.project ? this.props.project.dotToRectSettings : null,
    };

    public async componentDidMount() {
        const projectId = this.props.match.params["projectId"];
        // If we are creating a new project check to see if there is a partial
        // project already created in local storage
        if (!this.props.project && projectId) {
            const projectToLoad = this.props.recentProjects.find((project) => project.id === projectId);
            if (projectToLoad) {
                await this.props.actions.loadProject(projectToLoad);
            }
        }
    }

    public componentDidUpdate(prevProps: Readonly<IDot2RectPageProps>) {
        if (prevProps.project !== this.props.project) {
            this.setState({ settings: this.props.project.dotToRectSettings });
        }
    }

    public render() {
        return (
            <div className="project-settings-page">
                <div className="project-settings-page-settings m-3">
                    <h3>
                        <i className="fas fa-graduation-cap" />
                        <span className="px-2">
                            {strings.dot2Rect.title}
                        </span>
                    </h3>
                    <div className="m-3">
                        <Dot2RectForm
                            settings={this.state.settings}
                            onSubmit={this.onFormSubmit}
                            onCancel={this.onFormCancel} />
                    </div>
                </div>
            </div>
        );
    }

    private onFormSubmit = async (settings: IDot2RectSettings): Promise<void> => {
        const updatedProject: IProject = {
            ...this.props.project,
            dotToRectSettings: settings,
        };

        await this.props.actions.saveProject(updatedProject);
        toast.success(strings.dot2Rect.messages.saveSuccess);
        this.props.history.goBack();
    }

    private onFormCancel = (): void => {
        this.props.history.goBack();
    }
}
