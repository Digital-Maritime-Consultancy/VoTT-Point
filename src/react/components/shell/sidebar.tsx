import React from "react";
import { NavLink } from "react-router-dom";
import ConditionalNavLink from "../common/conditionalNavLink/conditionalNavLink";
import { strings } from "../../../common/strings";
import { TaskContext } from "../../../models/applicationState";
import { getEditingContext, getIconNameFromTaskType } from "../common/taskPicker/taskRouter";

/**
 * Side bar that remains visible throughout app experience
 * Contains links to editor, settings, export, etc.
 * @param param0 - {
 *      project - IProject
 * }
 */
export default function Sidebar({ project }) {
    const projectId = project ? project.id : null;
    return (
        <div className="bg-lighter-2 app-sidebar">
            <ul>
                <li>
                    <NavLink title={"Home"} to={`/`}>
                        <i className="fas fa-home"></i>
                    </NavLink>
                </li>
                {
                    project &&
                    <li>
                    <ConditionalNavLink disabled={!projectId}
                                title={strings.tags.editor}
                                to={`/projects/${projectId}/edit/${project.taskType}/${project.taskStatus}`}>
                                <i className={`fas ${getIconNameFromTaskType(project.taskType as TaskContext)}`}></i>
                            </ConditionalNavLink>
                    </li>
                }
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.projectSettings.title}
                        to={`/projects/${projectId}/settings`}>
                        <i className="fas fa-sliders-h"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.export.title}
                        to={`/projects/${projectId}/export`}>
                        <i className="fas fa-external-link-square-alt"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.import.title}
                        to={`/projects/${projectId}/import`}>
                        <i className="fas fa-file-import"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <ConditionalNavLink disabled={!projectId}
                        title={strings.dot2Rect.title}
                        to={`/projects/${projectId}/dot2Rect`}>
                        <i className="fas fa-server"></i>
                    </ConditionalNavLink>
                </li>
                <li>
                    <NavLink title={strings.connections.title}
                        to={`/connections`}><i className="fas fa-plug"></i></NavLink>
                </li>
            </ul>
            <div className="app-sidebar-fill"></div>
            <ul>
                <li><NavLink title={strings.appSettings.title}
                    to={`/settings`}><i className="fas fa-cog"></i></NavLink></li>
            </ul>
        </div>
    );
}
