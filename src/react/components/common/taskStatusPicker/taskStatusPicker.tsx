import React from "react";
import _ from "lodash";
import { TaskStatus } from "../../../../models/applicationState";

/**
 * Properties for TaskStatus Picker
 * @member onChange - Function to call on change of selected value
 * @member id - ID for HTML select element
 * @member value - Selected value in picker
 */
export interface ITaskStatusPickerProps {
    onChange: (value: string) => void;
    id: string;
    value: string;
}

/**
 * Creates HTML select object for selecting an asset or storage provider
 * @param props Properties for picker
 */
export default function TaskStatusPicker(props: ITaskStatusPickerProps) {
    const taskStatus = ToArray(TaskStatus);
    function onChange(e) {
        props.onChange(e.target.value);
    }

    function ToArray(enumme) {
        return Object.keys(enumme)
            .map(key => enumme[key]);
    }

    return (
        <select id={props.id}
            className="form-control"
            value={props.value}
            onChange={onChange}>
            {
                taskStatus.map((provider) =>
                    <option key={provider} value={provider}>
                        {provider}
                    </option>)
            }
        </select>
    );
}
