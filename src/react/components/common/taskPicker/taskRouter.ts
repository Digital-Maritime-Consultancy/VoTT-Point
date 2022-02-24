import { EditingContext, TaskContext, TaskStatus, TaskType } from "../../../../models/applicationState";

export const getEditingContext = (taskType: TaskType, taskStatus: TaskStatus): EditingContext => {
    const taskContext = TaskContext.NotAssigned;
    if (taskStatus === TaskStatus.Finished) {
        return getPathFromTaskType(TaskContext.Audit);
    }
    if (taskType === TaskType.Cleansing) {
        if (taskStatus === TaskStatus.In_progress) {
            return getPathFromTaskType(TaskContext.Purification);
        } else if (taskStatus === TaskStatus.Review) {
            return getPathFromTaskType(TaskContext.RevisePurification);
        }
    } else if (taskType === TaskType.Annotation) {
        if (taskStatus === TaskStatus.In_progress) {
            return getPathFromTaskType(TaskContext.Annotation);
        } else if (taskStatus === TaskStatus.Review) {
            return getPathFromTaskType(TaskContext.ReviseAnnotation);
        }
    } else if (taskType === TaskType.Evaluation) {
        return getPathFromTaskType(TaskContext.ReviseAnnotation);
    }
    return getPathFromTaskType(taskContext);
}

export const getPathFromTaskType = (taskContext: TaskContext): EditingContext => {
    switch (taskContext) {
        case TaskContext.Annotation:
            return EditingContext.EditDot;
        case TaskContext.ReviseAnnotation:
            return EditingContext.EditRect;
        case TaskContext.Purification:
            return EditingContext.Purify;
        case TaskContext.RevisePurification:
            return EditingContext.Revise;
        case TaskContext.Audit:
            return EditingContext.None;
        default:
            return EditingContext.None;
    }
}

export const getIconNameFromTaskType = (taskContext: TaskContext): string => {
    switch (taskContext) {
        case TaskContext.Annotation:
            return "fa-dot-circle";
        case TaskContext.ReviseAnnotation:
            return "fa-vector-square";
        case TaskContext.Purification:
            return "fa-check";
        case TaskContext.RevisePurification:
            return "fa-user-check";
        case TaskContext.Audit:
            return "fa-eye";
        default:
            return "fa-eye";
    }
}