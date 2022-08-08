import React from "react";
import { SyntheticEvent } from "react";
import { IChangeEvent } from "react-jsonschema-form";
import { AppError, ErrorCode, IFileInfo, IImportFormat } from "../../../../models/applicationState";
import LocalFilePicker from "../localFilePicker/localFilePicker";

const XMLParser = require("react-xml-parser");

/**
 * Properties for Local File Picker
 * @member onChange - Function to call on change of file selection
 * @member onError - Function to call on file picking error
 */
export interface IXmlFilePickerProps {
    onChange: (file: IFileInfo) => void;
    onError: (sender: SyntheticEvent, error: any) => void;
}

/**
 * @name - Local File Picker
 * @description - Pick file from local file system
 */
export default class XmlFilePicker extends React.Component<IXmlFilePickerProps> {
    private acceptFormat = "text/xml";
    constructor(props, context) {
        super(props, context);
    }

    public render() {
        return (
            <div>
                <LocalFilePicker
                    acceptFormat={this.acceptFormat}
                    onChange={this.onXmlFileLoad}
                    onError={this.onXmlFileLoadError} />
            </div>);
    }

    private onXmlFileLoad = async (sender: SyntheticEvent, fileText: IFileInfo) => {
        this.props.onChange(fileText);
    }

    private onXmlFileLoadError = (e, error: any) => {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(ErrorCode.ProjectUploadError, "Error uploading project file");
    }
}