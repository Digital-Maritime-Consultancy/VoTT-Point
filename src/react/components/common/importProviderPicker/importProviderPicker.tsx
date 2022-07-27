import React from "react";
import _ from "lodash";
import { ImportProviderFactory } from "../../../../providers/import/importProviderFactory";

/**
 * Properties for Import Provider Picker
 * @member onChange - Function to call on change of selected value
 * @member id - ID for HTML select element
 * @member value - Selected value in picker
 */
export interface IImportProviderPickerProps {
    onChange: (value: string) => void;
    id: string;
    value: string;
}

/**
 * Creates HTML select object for selecting an asset or storage provider
 * @param props Properties for picker
 */
export default function ImportProviderPicker(props: IImportProviderPickerProps) {
    const importProviders = _.values(ImportProviderFactory.providers);

    const allProviders = _([])
        .concat(importProviders)
        .orderBy("displayName")
        .value();

    function onChange(e) {
        props.onChange(e.target.value);
    }

    return (
        <select id={props.id}
            className="form-control"
            value={props.value}
            onChange={onChange}>
            {
                allProviders.map((provider) =>
                    <option key={provider.name} value={provider.name}>
                        {provider.displayName}
                    </option>)
            }
        </select>
    );
}
