import { EditingContext, TaskType } from "../../../../models/applicationState";

export const getPathFromTaskType = (taskType: TaskType): string => {
    switch (taskType) {
        case TaskType.Annotation:
            return EditingContext.EditDot;
        case TaskType.ReviseAnnotation:
            return EditingContext.EditRect;
        case TaskType.Purification:
            return EditingContext.Purify;
        case TaskType.RevisePurification:
            return EditingContext.Revise;
        case TaskType.Audit:
            return EditingContext.EditRect;
        default:
            return EditingContext.None;
    }
}

export const getIconNameFromTaskType = (taskType: TaskType): string => {
    switch (taskType) {
        case TaskType.Annotation:
            return "fa-dot-circle";
        case TaskType.ReviseAnnotation:
            return "fa-vector-square";
        case TaskType.Purification:
            return "fa-check";
        case TaskType.RevisePurification:
            return "fa-user-check";
        case TaskType.Audit:
            return "fa-vector-square";
        default:
            return "fa-eye";
    }
}