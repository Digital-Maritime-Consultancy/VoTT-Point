import { EditingContext } from './models/applicationState';
import { ToolbarItemFactory } from "./providers/toolbar/toolbarItemFactory";
import { ExportProject } from "./react/components/toolbar/exportProject";
import { SaveProject } from "./react/components/toolbar/saveProject";
import { ToolbarItemType } from "./react/components/toolbar/toolbarItem";
import { strings } from "./common/strings";

export enum ToolbarItemName {
    SelectCanvas = "selectCanvas",
    DrawRectangle = "drawRectangle",
    DrawPolygon = "drawPolygon",
    DrawPoint = "drawPoint",
    SubmitPoints = "submitPoints",
    CopyRegions = "copyRegions",
    CutRegions = "cutRegions",
    PasteRegions = "pasteRegions",
    RemoveAllRegions = "removeAllRegions",
    PreviousAsset = "previousAsset",
    NextAsset = "nextAsset",
    Complete = "completeRevision",
    SaveProject = "saveProject",
    Disable = "disable",
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
        context: [EditingContext.EditDot, EditingContext.EditRect],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPoint,
        tooltip: strings.editorPage.toolbar.drawPoint,
        icon: "fa-dot-circle",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["O", "o"],
        context: [EditingContext.EditDot],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SubmitPoints,
        tooltip: strings.editorPage.toolbar.submitPoints,
        icon: "fas fa-upload",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Action,
        accelerators: ["K", "k"],
        context: [EditingContext.EditDot],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
        context: [EditingContext.EditDot, EditingContext.EditRect],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawPolygon,
        tooltip: strings.editorPage.toolbar.drawPolygon,
        icon: "fa-draw-polygon",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["P", "p"],
        context: [EditingContext.EditDot, EditingContext.EditRect],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.Disable,
        tooltip: strings.editorPage.toolbar.disable,
        icon: "fas fa-times",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["D", "d"],
        context: [EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CopyRegions,
        tooltip: strings.editorPage.toolbar.copy,
        icon: "fa-copy",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+C", "CmdOrCtrl+c"],
        context: [EditingContext.EditDot, EditingContext.EditRect, EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.CutRegions,
        tooltip: strings.editorPage.toolbar.cut,
        icon: "fa-cut",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+X", "CmdOrCtrl+x"],
        context: [EditingContext.EditDot, EditingContext.EditRect, EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PasteRegions,
        tooltip: strings.editorPage.toolbar.paste,
        icon: "fa-paste",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+V", "CmdOrCtrl+v"],
        context: [EditingContext.EditDot, EditingContext.EditRect, EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.RemoveAllRegions,
        tooltip: strings.editorPage.toolbar.removeAllRegions,
        icon: "fa-ban",
        group: ToolbarItemGroup.Regions,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+Delete", "CmdOrCtrl+Backspace"],
        context: [EditingContext.EditDot, EditingContext.EditRect],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.Approve,
        tooltip: strings.editorPage.toolbar.approve,
        icon: "fas fa-check",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["A", "a"],
        context: [EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.PreviousAsset,
        tooltip: strings.editorPage.toolbar.previousAsset,
        icon: "fas fa-arrow-circle-up",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: [","],
        context: [EditingContext.EditRect, EditingContext.EditDot, EditingContext.Purify, EditingContext.Revise],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["."],
        context: [EditingContext.EditRect, EditingContext.EditDot, EditingContext.Purify, EditingContext.Revise],
    });

    /*
    ToolbarItemFactory.register({
        name: ToolbarItemName.Comment,
        tooltip: strings.editorPage.toolbar.comment,
        icon: "fas fa-comment-dots",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["X", "x"],
        context: [EditingContext.EditRect, EditingContext.Revise],
    });
    */

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: "fa-check-circle",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["S", "s"],
        context: [EditingContext.EditRect, EditingContext.EditDot, EditingContext.Purify, EditingContext.Revise],
    }, SaveProject);
}
