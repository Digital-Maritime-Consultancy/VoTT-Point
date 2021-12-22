import { EditingContext } from './models/applicationState';
import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { strings } from "./common/strings";

export enum ToolbarItemName {
    SelectCanvas = "selectCanvas",
    DrawRectangle = "drawRectangle",
    DrawPoint = "drawPoint",
    SubmitPoints = "submitPoints",
    PreviousAsset = "previousAsset",
    NextAsset = "nextAsset",
    Complete = "completeRevision",
    SaveProject = "saveProject",
    Reject = "reject",
    Approve = "approve",
    Comment = "comment",
}

export enum ToolbarItemGroup {
    Canvas = "canvas",
    Regions = "regions",
    Navigation = "navigation",
    Project = "project",
}

/**
 * Registers items for toolbar
 */
export default function registerToolbar() {
    ToolbarItemFactory.register({
        name: ToolbarItemName.SelectCanvas,
        tooltip: strings.editorPage.toolbar.select,
        icon: "fa-mouse-pointer",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["V", "v"],
        context: [EditingContext.PlantSeed, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
        context: [EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.Reject,
        tooltip: strings.editorPage.toolbar.reject,
        icon: "fas fa-times",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
        context: [EditingContext.Purify],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.Approve,
        tooltip: strings.editorPage.toolbar.approve,
        icon: "fas fa-check",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["A", "a"],
        context: [EditingContext.Purify],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPoint,
        tooltip: strings.editorPage.toolbar.drawPoint,
        icon: "fa-dot-circle",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["D", "d"],
        context: [EditingContext.PlantSeed],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        tooltip: strings.editorPage.toolbar.previousAsset,
        icon: "fas fa-arrow-circle-up",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowUp", "W", "w"],
        context: [EditingContext.Revise, EditingContext.PlantSeed, EditingContext.Purify],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "S", "s"],
        context: [EditingContext.Revise, EditingContext.PlantSeed, EditingContext.Purify],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SubmitPoints,
        tooltip: strings.editorPage.toolbar.submitPoints,
        icon: "fas fa-upload",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Action,
        accelerators: ["P", "p"],
        context: [EditingContext.PlantSeed],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.Comment,
        tooltip: strings.editorPage.toolbar.comment,
        icon: "fas fa-comment-dots",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["X", "x"],
        context: [EditingContext.Revise, EditingContext.Purify],
    });

    /*
    ToolbarItemFactory.register({
        name: ToolbarItemName.Complete,
        tooltip: strings.editorPage.toolbar.completeRevision,
        icon: "fas fa-user-check",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Action,
        accelerators: ["C", "c"],
        context: [EditingContext.Revise, EditingContext.PlantSeed, EditingContext.Purify],
    });
    */

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: "fa-save",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+S", "CmdOrCtrl+s"],
        context: [EditingContext.Revise, EditingContext.PlantSeed, EditingContext.Purify],
    }, SaveProject);

}
