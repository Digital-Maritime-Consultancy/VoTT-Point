import React from "react";
import { Switch, Route } from "react-router-dom";
import HomePage from "../pages/homepage/homePage";
import ActiveLearningPage from "../pages/activeLearning/activeLearningPage";
import AppSettingsPage from "../pages/appSettings/appSettingsPage";
import ConnectionPage from "../pages/connections/connectionsPage";
import EditorPage from "../pages/editorPage/editorPage";
import ExportPage from "../pages/export/exportPage";
import ProjectSettingsPage from "../pages/projectSettings/projectSettingsPage";
import Dot2RectPage from "../pages/dot2Rect/dot2RectPage";
import TaskPage from "../pages/\btaskPage/taskPage";

/**
 * @name - Main Content Router
 * @description - Controls main content pane based on route
 */
export default function MainContentRouter() {
    return (
        <div className="app-content text-light">
            <Switch>
                <Route path="/" exact component={HomePage} />
                <Route path="/settings" component={AppSettingsPage} />
                <Route path="/connections/:connectionId" component={ConnectionPage} />
                <Route path="/connections" exact component={ConnectionPage} />
                <Route path="/task/:taskId" component={TaskPage} />
                <Route path="/projects/:projectId/edit/:type/:status" component={EditorPage} />
                <Route path="/projects/create" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/settings" component={ProjectSettingsPage} />
                <Route path="/projects/:projectId/export" component={ExportPage} />
                <Route path="/projects/:projectId/dot2Rect" component={Dot2RectPage} />
                <Route component={HomePage} />
            </Switch>
        </div>
    );
}
