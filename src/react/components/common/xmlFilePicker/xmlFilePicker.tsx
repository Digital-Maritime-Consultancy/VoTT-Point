import React from "react";
import { SyntheticEvent } from "react";
import { AppError, ErrorCode, IFileInfo } from "../../../../models/applicationState";
import LocalFilePicker from "../localFilePicker/localFilePicker";

const XMLParser = require("react-xml-parser");

/**
 * Properties for Local File Picker
 * @member onChange - Function to call on change of file selection
 * @member onError - Function to call on file picking error
 */
 export interface IXmlFilePickerProps {
    onChange: (sender: SyntheticEvent, fileText: IFileInfo) => void;
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
        return <LocalFilePicker
                acceptFormat={this.acceptFormat}
                onChange={this.onXmlFileLoad}
                onError={this.onXmlFileLoadError} />;
    }

    private onXmlFileLoad = async (sender: SyntheticEvent, fileText: IFileInfo) => {
        if (fileText.content) {
            try {
                const xml = new XMLParser().parseFromString(fileText.content);
                console.log(xml);
                
            } catch (e) {
                throw new Error(e.message);
            }
        }
    }

    private onXmlFileLoadError = (e, error: any) => {
        if (error instanceof AppError) {
            throw error;
        }

        throw new AppError(ErrorCode.ProjectUploadError, "Error uploading project file");
    }
}

/*

                    <LocalFilePicker
                        acceptFormat={"text/xml"}
                        onChange={this.onProjectFileUpload}
                        onError={this.onProjectFileUploadError}/>
*/