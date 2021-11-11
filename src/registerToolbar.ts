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
    SubmitAnnotation = "submitAnnotation",
    SaveProject = "saveProject",
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
        context: [EditingContext.ReviseGenerated],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.DrawRectangle,
        tooltip: strings.editorPage.toolbar.drawRectangle,
        icon: "fa-vector-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.State,
        accelerators: ["R", "r"],
        context: [EditingContext.ReviseGenerated],
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
        context: [EditingContext.ReviseGenerated, EditingContext.PlantSeed],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.NextAsset,
        tooltip: strings.editorPage.toolbar.nextAsset,
        icon: "fas fa-arrow-circle-down",
        group: ToolbarItemGroup.Navigation,
        type: ToolbarItemType.Action,
        accelerators: ["ArrowDown", "S", "s"],
        context: [EditingContext.ReviseGenerated, EditingContext.PlantSeed],
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
        name: ToolbarItemName.SubmitAnnotation,
        tooltip: strings.editorPage.toolbar.submitAnnotation,
        icon: "fas fa-check-square",
        group: ToolbarItemGroup.Canvas,
        type: ToolbarItemType.Action,
        accelerators: ["A", "a"],
        context: [EditingContext.ReviseGenerated],
    });

    ToolbarItemFactory.register({
        name: ToolbarItemName.SaveProject,
        tooltip: strings.editorPage.toolbar.saveProject,
        icon: "fa-save",
        group: ToolbarItemGroup.Project,
        type: ToolbarItemType.Action,
        accelerators: ["CmdOrCtrl+S", "CmdOrCtrl+s"],
        context: [EditingContext.ReviseGenerated, EditingContext.PlantSeed],
    }, SaveProject);

}
